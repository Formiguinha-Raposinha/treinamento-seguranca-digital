-- =============================================================================
-- Segurança Digital para Idosos — Banco de dados no Supabase
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo → Run.
-- Pode rodar de novo sem quebrar (usa IF NOT EXISTS / CREATE OR REPLACE).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PERFIS (um por conta de login)
--    role: 'senior' (idoso), 'family' (familiar) ou 'admin' (coordenação)
--    Ninguém consegue virar admin pelo app: só via SQL (ver final do arquivo).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'senior' check (role in ('senior', 'family', 'admin')),
  name        text not null default '',
  phone       text,
  age_group   text,
  invite_code text unique,              -- código que o idoso passa ao familiar (ex.: FAM-7K2P)
  created_at  timestamptz not null default now()
);

create table if not exists public.family_links (
  family_id    uuid not null references public.profiles (id) on delete cascade,
  senior_id    uuid not null references public.profiles (id) on delete cascade,
  relationship text,
  created_at   timestamptz not null default now(),
  primary key (family_id, senior_id)
);

-- Registro de tentativas incorretas de código de convite (rate limit)
create table if not exists public.invite_code_attempts (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index if not exists invite_attempts_user_idx on public.invite_code_attempts (user_id, attempted_at desc);

-- -----------------------------------------------------------------------------
-- 2. TREINOS, FEEDBACKS E EXPRESSÕES NÃO RECONHECIDAS
-- -----------------------------------------------------------------------------
create table if not exists public.sessions (
  id             text primary key,
  senior_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  scenario_id    text not null,
  scenario_title text,
  category       text,
  outcome        text not null check (outcome in ('safe', 'fallen', 'abandoned')),
  completed_at   timestamptz not null default now(),
  data           jsonb not null,         -- sessão completa (mensagens, motivos etc.)
  created_at     timestamptz not null default now()
);
create index if not exists sessions_senior_idx on public.sessions (senior_id);
create index if not exists sessions_scenario_idx on public.sessions (scenario_id);

create table if not exists public.feedback (
  id             bigint generated always as identity primary key,
  senior_id      uuid not null references public.profiles (id) on delete cascade,
  author_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  author_role    text not null check (author_role in ('senior', 'family')),
  scenario_id    text,
  scenario_title text,
  category       text check (category in ('ocorrido', 'dificuldade', 'sugestao', 'outro')),
  rating         int check (rating between 1 and 5),
  comment        text not null default '' check (char_length(comment) <= 2000),
  audio_path     text,                   -- caminho no bucket 'feedback-audio'
  status         text not null default 'novo' check (status in ('novo', 'em_analise', 'resolvido')),
  created_at     timestamptz not null default now()
);
create index if not exists feedback_senior_idx on public.feedback (senior_id);

-- Anônimo de propósito: não guarda quem digitou, só o texto e o cenário.
create table if not exists public.unrecognized_expressions (
  id              text primary key,
  scenario_id     text,
  scenario_title  text,
  raw_text        text not null check (char_length(raw_text) <= 500),
  normalized_text text,
  input_type      text,
  stage           text,
  status          text not null default 'pending' check (status in ('pending', 'mapped', 'ignored')),
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. FUNÇÕES DE APOIO (usadas pelas regras de acesso)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_family_of(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_links where family_id = auth.uid() and senior_id = sid);
$$;

-- true se o usuário logado é o próprio idoso ou um familiar vinculado
create or replace function public.can_access_senior(sid text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid()::text = sid
      or exists (select 1 from public.family_links where family_id = auth.uid() and senior_id::text = sid);
$$;

create or replace function public.gen_invite_code()
returns text language plpgsql volatile set search_path = public as $$
declare
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sem 0/O/1/I para não confundir
  bloco1 text;
  bloco2 text;
  codigo text;
begin
  loop
    bloco1 := '';
    bloco2 := '';
    for i in 1..4 loop
      bloco1 := bloco1 || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
      bloco2 := bloco2 || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    codigo := 'FAM-' || bloco1 || '-' || bloco2;
    exit when not exists (select 1 from public.profiles where invite_code = codigo);
  end loop;
  return codigo;
end;
$$;

-- Cria o perfil automaticamente quando alguém se cadastra.
-- O app manda role = 'senior' ou 'family'; qualquer outro valor vira 'senior'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(new.raw_user_meta_data ->> 'role', 'senior');
begin
  if r not in ('senior', 'family') then r := 'senior'; end if;
  insert into public.profiles (id, role, name, phone, age_group, invite_code)
  values (
    new.id,
    r,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'age_group',
    case when r = 'senior' then public.gen_invite_code() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. REGRAS DE ACESSO (Row Level Security)
-- -----------------------------------------------------------------------------
alter table public.profiles                 enable row level security;
alter table public.family_links             enable row level security;
alter table public.invite_code_attempts     enable row level security;
alter table public.sessions                 enable row level security;
alter table public.feedback                 enable row level security;
alter table public.unrecognized_expressions enable row level security;

-- PERFIS: cada um vê o seu; familiar vê o idoso vinculado; idoso vê quem o acompanha.
-- O admin NÃO vê nomes/telefones de ninguém (só números agregados).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_family_of(id)
  or exists (select 1 from public.family_links fl where fl.senior_id = auth.uid() and fl.family_id = profiles.id)
);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Só estes campos podem ser alterados pelo app (role e invite_code ficam travados)
revoke update on public.profiles from authenticated;
grant update (name, phone, age_group) on public.profiles to authenticated;

-- VÍNCULOS: criados só pela função link_family_by_code; qualquer lado pode desfazer.
drop policy if exists links_select on public.family_links;
create policy links_select on public.family_links for select to authenticated
  using (family_id = auth.uid() or senior_id = auth.uid());
drop policy if exists links_delete on public.family_links;
create policy links_delete on public.family_links for delete to authenticated
  using (family_id = auth.uid() or senior_id = auth.uid());

-- TREINOS: o idoso grava os seus; idoso e familiares vinculados leem.
drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions for insert to authenticated
  with check (senior_id = auth.uid());
drop policy if exists sessions_update on public.sessions;
create policy sessions_update on public.sessions for update to authenticated
  using (senior_id = auth.uid()) with check (senior_id = auth.uid());
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated
  using (senior_id = auth.uid() or public.is_family_of(senior_id));

-- FEEDBACK: idoso e familiar enviam; admin lê tudo e muda o status.
drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback for insert to authenticated
  with check (author_id = auth.uid() and public.can_access_senior(senior_id::text));
drop policy if exists feedback_select on public.feedback;
create policy feedback_select on public.feedback for select to authenticated
  using (author_id = auth.uid() or public.can_access_senior(senior_id::text) or public.is_admin());
drop policy if exists feedback_update_admin on public.feedback;
create policy feedback_update_admin on public.feedback for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke update on public.feedback from authenticated;
grant update (status) on public.feedback to authenticated;

-- EXPRESSÕES: qualquer usuário logado registra; só o admin lê e organiza.
drop policy if exists unrec_insert on public.unrecognized_expressions;
create policy unrec_insert on public.unrecognized_expressions for insert to authenticated with check (true);
drop policy if exists unrec_admin on public.unrecognized_expressions;
create policy unrec_admin on public.unrecognized_expressions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. FUNÇÕES CHAMADAS PELO APP
-- -----------------------------------------------------------------------------

-- Familiar digita o código do idoso para passar a acompanhá-lo (com limite de tentativas).
create or replace function public.link_family_by_code(code text, rel text default null)
returns table (senior_id uuid, senior_name text)
language plpgsql security definer set search_path = public as $$
declare
  s public.profiles%rowtype;
  tentativas_recentes int;
  codigo_limpo text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'family') then
    raise exception 'Apenas contas de familiar podem usar código de convite.';
  end if;

  select count(*) into tentativas_recentes
    from public.invite_code_attempts
   where user_id = auth.uid()
     and attempted_at > now() - interval '1 hour';

  if tentativas_recentes >= 5 then
    raise exception 'Muitas tentativas incorretas. Aguarde 1 hora e tente novamente.';
  end if;

  codigo_limpo := regexp_replace(upper(trim(coalesce(code, ''))), '[^A-Z0-9]', '', 'g');

  select * into s from public.profiles
   where regexp_replace(upper(coalesce(invite_code, '')), '[^A-Z0-9]', '', 'g') = codigo_limpo
     and role = 'senior';

  if not found then
    insert into public.invite_code_attempts (user_id) values (auth.uid());
    raise exception 'Código não encontrado. Confira as letras com o idoso.';
  end if;

  delete from public.invite_code_attempts where user_id = auth.uid();

  insert into public.family_links (family_id, senior_id, relationship)
  values (auth.uid(), s.id, rel)
  on conflict do nothing;
  return query select s.id, s.name;
end;
$$;

-- Permite ao idoso gerar um novo código de convite (invalidando o anterior).
create or replace function public.regenerate_invite_code()
returns text
language plpgsql security definer set search_path = public as $$
declare
  novo text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'senior') then
    raise exception 'Apenas o participante idoso pode gerar novo código de convite.';
  end if;
  novo := public.gen_invite_code();
  update public.profiles set invite_code = novo where id = auth.uid();
  return novo;
end;
$$;

-- Estatística de um cenário para as mensagens de incentivo (sem dados pessoais).
create or replace function public.scenario_stats(p_scenario_id text)
returns table (total int, safe_pct int, fallen_pct int)
language sql stable security definer set search_path = public as $$
  select count(*)::int,
         coalesce(round(100.0 * count(*) filter (where outcome = 'safe')   / nullif(count(*), 0)), 0)::int,
         coalesce(round(100.0 * count(*) filter (where outcome = 'fallen') / nullif(count(*), 0)), 0)::int
    from public.sessions where scenario_id = p_scenario_id;
$$;

-- Painel do admin: só números agregados, nenhum nome ou telefone.
create or replace function public.admin_metrics()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  resultado jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito à coordenação.';
  end if;

  with tentativas as (
    select senior_id, scenario_id, scenario_title, category, outcome,
           row_number() over (partition by senior_id, scenario_id order by completed_at) as n
      from public.sessions
  ),
  primeiro_acerto as (
    select senior_id, scenario_id, min(n) as tentativa
      from tentativas where outcome = 'safe'
     group by senior_id, scenario_id
  ),
  por_cenario as (
    select t.scenario_id,
           max(t.scenario_title) as titulo,
           max(t.category) as categoria,
           count(*) as tentativas,
           count(distinct t.senior_id) as participantes,
           round(100.0 * count(*) filter (where t.outcome = 'safe') / nullif(count(*), 0)) as taxa_acerto,
           round(100.0 * count(*) filter (where t.n = 1 and t.outcome = 'safe')
                 / nullif(count(*) filter (where t.n = 1), 0)) as acerto_primeira,
           (select round(avg(p.tentativa), 1) from primeiro_acerto p where p.scenario_id = t.scenario_id) as media_ate_acertar,
           (select count(*) from primeiro_acerto p where p.scenario_id = t.scenario_id) as aprenderam
      from tentativas t
     group by t.scenario_id
  )
  select jsonb_build_object(
    'participantes',     (select count(*) from public.profiles where role = 'senior'),
    'familiares',        (select count(*) from public.profiles where role = 'family'),
    'ativos_30d',        (select count(distinct senior_id) from public.sessions where completed_at > now() - interval '30 days'),
    'treinos',           (select count(*) from public.sessions),
    'taxa_acerto_geral', (select coalesce(round(100.0 * count(*) filter (where outcome = 'safe') / nullif(count(*), 0)), 0) from public.sessions),
    'feedbacks_novos',   (select count(*) from public.feedback where status = 'novo'),
    'por_cenario',       coalesce((select jsonb_agg(to_jsonb(pc) order by pc.taxa_acerto nulls last) from por_cenario pc), '[]'::jsonb),
    'por_semana',        coalesce((
                           select jsonb_agg(x order by x.semana) from (
                             select to_char(date_trunc('week', completed_at), 'YYYY-MM-DD') as semana,
                                    count(*) as treinos,
                                    round(100.0 * count(*) filter (where outcome = 'safe') / nullif(count(*), 0)) as taxa_acerto
                               from public.sessions
                              where completed_at > now() - interval '12 weeks'
                              group by 1
                           ) x), '[]'::jsonb)
  ) into resultado;

  return resultado;
end;
$$;

grant execute on function public.link_family_by_code(text, text) to authenticated;
grant execute on function public.regenerate_invite_code()         to authenticated;
grant execute on function public.scenario_stats(text)            to authenticated;
grant execute on function public.admin_metrics()                 to authenticated;

-- -----------------------------------------------------------------------------
-- 6. ÁUDIOS DOS FEEDBACKS (Storage privado)
--    Caminho do arquivo: <id do idoso>/<arquivo>.webm
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('feedback-audio', 'feedback-audio', false)
on conflict (id) do nothing;

drop policy if exists feedback_audio_insert on storage.objects;
create policy feedback_audio_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'feedback-audio' and public.can_access_senior((storage.foldername(name))[1]));
drop policy if exists feedback_audio_select on storage.objects;
create policy feedback_audio_select on storage.objects for select to authenticated
  using (bucket_id = 'feedback-audio'
         and (public.can_access_senior((storage.foldername(name))[1]) or public.is_admin()));

-- =============================================================================
-- 7. TORNAR SUA CONTA ADMIN (rode separado, depois de se cadastrar no app
--    como "Familiar" com o seu e-mail). Troque o e-mail abaixo:
--
--   update public.profiles set role = 'admin', invite_code = null
--    where id = (select id from auth.users where email = 'SEU_EMAIL@exemplo.com');
-- =============================================================================
