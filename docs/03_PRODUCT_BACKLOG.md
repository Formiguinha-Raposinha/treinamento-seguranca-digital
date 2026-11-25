# 03. Product Backlog Completo (Atualizado)

> **Documento Oficial de Engenharia e Extensão:** Contém a descrição detalhada de todos os épicos, histórias de usuário (US), critérios de aceite e tarefas técnicas do projeto.

## 🎯 Legenda de Status e Prioridades

* 🟢 **Concluído** — Desenvolvido, testado e em produção na plataforma.
* 🟡 **Em Andamento** — Atualmente no ciclo ativo de desenvolvimento.
* ⚪ **Planejado** — Próximos ciclos previstos no Roadmap.

---

# 📦 ÉPICO 1 — AMBIENTE DE SIMULAÇÃO
**Objetivo:** Permitir que o participante vivencie situações semelhantes às de fraudes reais em ambiente controlado, seguro e realista.

### US01 — Iniciar uma simulação
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero iniciar uma situação simulada para praticar como agir diante de uma possível tentativa de golpe.
* **Tarefas Técnicas:** Estrutura de dados em `src/types/cenario.ts`, catálogo dinâmico de 6 cenários em `src/data/scenarios/index.ts`.

### US02 — Visualizar uma conversa simulada (WhatsApp / SMS)
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero visualizar uma conversa semelhante às do meu dia a dia para praticar a identificação de situações suspeitas.
* **Tarefas Técnicas:** `src/components/simulador/SimuladorWhatsapp.tsx`, `BalaoMensagem.tsx`, `CabecalhoChat.tsx`.

### US03 — Interagir com a conversa (Opções e Digitação Livre)
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero interagir escolhendo opções rápidas ou digitando/falando livremente para tomar minhas próprias decisões.
* **Tarefas Técnicas:** `BarraEntradaTexto.tsx` com botões acessíveis e entrada de texto/voz livre.

### US04 — Vivenciar o Golpe do Falso Familiar
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero vivenciar a abordagem do falso filho no WhatsApp para reconhecer a tática do número novo e pedido de Pix urgente.
* **Tarefas Técnicas:** `src/data/scenarios/golpeFalsoFamiliar.ts`.

---

# 📦 ÉPICO 2 — LINKS, NAVEGADOR SIMULADO E TOMADA DE DECISÃO
**Objetivo:** Praticar a navegação em links suspeitos sem sair da aplicação e sem qualquer risco real.

### US06 — Acessar um link recebido no SMS
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero clicar no link do SMS para experimentar como é uma página de phishing sem colocar meus dados em risco.
* **Tarefas Técnicas:** `src/components/simulador/SimuladorNavegador.tsx`.

### US07 — Visualizar página web e formulário bancário falso
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero visualizar a página falsa do banco com domínio suspeito (.xyz) e formulários fictícios.
* **Tarefas Técnicas:** Renderização de alerta falso e inputs de login e senha no navegador simulado.

### US08 — Modal de Inspeção Segura de Links
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero clicar na lupa para inspecionar um link suspeito e aprender se ele pertence à instituição oficial.
* **Tarefas Técnicas:** `src/components/simulador/ModalInspecaoLink.tsx`.

### US09 — Realizar ação de risco simulada
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero poder clicar em confirmar para experimentar a sensação de erro sem qualquer perda financeira.
* **Tarefas Técnicas:** Interceptação segura e bloqueio absoluto de qualquer conexão de rede externa.

---

# 📦 ÉPICO 3 — O SUSTO SEGURO E A APRENDIZAGEM ATIVA
**Objetivo:** Transformar o momento do erro em uma experiência acolhedora, empática e memorável.

### US10 — Alerta Empático ("🚨 PARE! Você caiu em uma simulação")
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero ser alertado com tranquilidade de que caí na armadilha e que nada de ruim aconteceu de verdade.
* **Tarefas Técnicas:** `src/components/simulador/ModalAlertaGolpe.tsx` (Aba 1).

### US11 — Raio-X dos Sinais de Risco
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero ver com clareza quais detalhes indicavam perigo naquela mensagem.
* **Tarefas Técnicas:** Visualização didática dos gatilhos em `ModalAlertaGolpe.tsx` (Aba 2).

### US12 — Entender os Gatilhos Psicológicos da Engenharia Social
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero entender como os golpistas usam a pressa, o medo e o afeto para bloquear o raciocínio.
* **Tarefas Técnicas:** `ModalAlertaGolpe.tsx` (Aba 3).

### US13 — O Que Fazer da Próxima Vez (Guia de 4 Passos e Regra de Ouro)
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero aprender o passo a passo seguro para agir caso isso aconteça comigo na vida real.
* **Tarefas Técnicas:** `ModalAlertaGolpe.tsx` (Aba 4).

### US14 — Superação de Erro e Segunda Chance
* **Status:** 🟢 **Concluído**
* **História:** Como usuário que errou, quero tentar novamente e ser premiado quando vencer a simulação aplicando a regra de ouro.
* **Tarefas Técnicas:** Detecção de transição `fallen -> safe` com selo de superação em `ModalSucessoSeguro.tsx`.

---

# 📦 ÉPICO 4 — EXPANSÃO DOS 6 GRANDES GOLPES NACIONAIS & SIMULADOR TELEFÔNICO
**Objetivo:** Cobrir as principais fraudes sofridas pela população idosa no Brasil com interfaces dedicadas.

### US44 — Golpe do Falso Alerta de Banco (Phishing de Cartão / TV Magazine Luiza)
* **Status:** 🟢 **Concluído**
* **Tarefas Técnicas:** `src/data/scenarios/golpeLinkBanco.ts`.

### US45 — Golpe da Falsa Central 0800 & Simulador Telefônico Interativo
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero atender a uma chamada simulada com viva-voz para aprender a identificar o golpe do falso 0800 e Pix de blindagem.
* **Tarefas Técnicas:** `src/components/simulador/SimuladorLigacao.tsx` e `golpeFalsaCentral0800.ts`.

### US46 — Golpe da Falsa Prova de Vida do INSS
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero treinar o golpe do falso recadastramento do INSS para não entregar fotos de documentos nem selfies para desconhecidos.
* **Tarefas Técnicas:** `src/data/scenarios/golpeProvaVidaInss.ts`.

### US47 — Golpe do Falso Motoboy (Cartão Clonado Cortado com Chip Intacto)
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero vivenciar a ligação do banco que promete mandar motoboy recolher o cartão periciado para saber que banco NUNCA faz isso.
* **Tarefas Técnicas:** `src/data/scenarios/golpeFalsoMotoboy.ts`.

### US48 — Golpe do Presente de Aniversário (Taxa da Maquininha com Visor Apagado)
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero praticar a chegada de um falso presente na minha porta para aprender que presente de verdade não cobra taxa de entrega na maquininha.
* **Tarefas Técnicas:** `src/data/scenarios/golpePresenteTaxa.ts`.

---

# 📦 ÉPICO 5 — EXTENSÃO UNIVERSITÁRIA, BANCO DE DADOS & DICIONÁRIO DO IDOSO (IFMT)
**Objetivo:** Viabilizar a coleta de dados de campo e a pesquisa acadêmica sobre o linguajar de segurança digital dos idosos.

### US49 — Banco de Dados Local IndexedDB de Sessões e Participantes
* **Status:** 🟢 **Concluído**
* **Tarefas Técnicas:** `src/services/bancoDadosService.ts` (`SegurancaDigitalIdososDB`, store de clientes, sessões completas e expressões).

### US50 — Motor Heurístico Offline em pt-BR com 1.500+ Linhas
* **Status:** 🟢 **Concluído**
* **História:** Como idoso em uma oficina sem internet, quero que o simulador entenda o que eu digito ou falo em português do Brasil sem precisar de Wi-Fi.
* **Tarefas Técnicas:** `src/services/interpretadorDialogoService.ts` com isolamento por golpe e desfechos realistas de pânico/desistência.

### US51 — Captura Automática de Expressões Não Mapeadas
* **Status:** 🟢 **Concluído**
* **História:** Como pesquisador do projeto de extensão, quero que todo termo desconhecido dito pelos idosos seja armazenado para alimentar a pesquisa.
* **Tarefas Técnicas:** `src/services/vocabularioService.ts` com remoção de stopwords e categorização semântica.

### US52 — Painel Acadêmico de Dicionário, Nuvem de Palavras e Relatório IFMT
* **Status:** 🟢 **Concluído**
* **Tarefas Técnicas:** `src/components/dicionario/DicionarioExpressoes.tsx`, `ModalRelatorioExtensao.tsx` e exportações em CSV/JSON.

---

# 📦 ÉPICO 6 — PORTAL DA FAMÍLIA & EVOLUÇÃO INDIVIDUAL
**Objetivo:** Engajar familiares cuidadores e oferecer um diagnóstico personalizado de segurança para o idoso.

### US29/US30 — Painel de Evolução do Aluno com Níveis de Proteção
* **Status:** 🟢 **Concluído**
* **História:** Como usuário, quero ver meu nível de segurança (Iniciante, Prudente, Guardião, Cidadão Protegido) e pontos que merecem atenção.
* **Tarefas Técnicas:** `src/components/evolucao/PainelEvolucaoIdoso.tsx`.

### US36/US37/US38 — Portal de Vulnerabilidade para Cuidadores e Familiares
* **Status:** 🟢 **Concluído**
* **História:** Como filho(a) ou cuidador(a), quero ver um resumo do risco do meu familiar idoso para ajudá-lo a se proteger sem invadir sua privacidade.
* **Tarefas Técnicas:** `src/components/familia/PortalVulnerabilidadeFamilia.tsx` com índice 0 a 100% e quebra por tipo de golpe.

### US39 — Checklist Prático Familiar & Emissão de Certificado
* **Status:** 🟢 **Concluído**
* **Tarefas Técnicas:** Checklist preventivo da família, impressão do relatório familiar e emissão do Certificado Oficial em `ModalCertificado.tsx`.

---

# 📦 ÉPICO 7 — PÍLULAS DE BOAS PRÁTICAS & MINI TUTORIAIS DA DONA MARIA
**Objetivo:** Criar mini tutoriais interativos de até 5 minutos com aprendizagem em 3ª pessoa (o idoso como mentor protetor da Dona Maria).

### US53 — Storyboard Interativo das Pílulas de Aprendizagem (<= 5 min)
* **Status:** 🟡 **Em Andamento**
* **História:** Como participante, quero assistir e interagir com historinhas curtas e acolhedoras para aprender boas práticas sem cansaço mental.
* **Critérios de Aceite:** Duração máxima de 3 a 5 minutos, ilustrações acessíveis, narração em áudio e dilemas guiados.

### US54 — Pílula 1: "O Dia em que Dona Maria Salvou a Aposentadoria"
* **Status:** 🟡 **Em Andamento**
* **História:** Dona Maria recebe uma mensagem de um novo número dizendo ser seu filho. O usuário decide como ela deve reagir (ligar no número antigo).

### US55 — Pílula 2: "Seu Raimundo e o Falso SMS do 0800"
* **Status:** ⚪ **Planejado**
* **História:** Seu Raimundo recebe um SMS dizendo que gastaram R$ 4.750 no cartão dele. O usuário o orienta a olhar o telefone no verso do cartão.

### US56 — Pílula 3: "Dona Francisca e a Falsa Prova de Vida do INSS"
* **Status:** ⚪ **Planejado**
* **História:** Dona Francisca recebe um link exigindo selfie para não cortar o benefício. O usuário a ensina que o INSS faz prova de vida automática ou pelo 135.
