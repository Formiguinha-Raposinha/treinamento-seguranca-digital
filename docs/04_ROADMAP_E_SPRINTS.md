# 04. Roadmap, Sprints e Acompanhamento de Progresso

> **Painel de Controle Oficial do Projeto (Atualizado):** Este documento reflete com exatidão o andamento real do projeto de extensão universitária do IFMT, as sprints já entregues e o ciclo em andamento.

---

## 📊 Visão Geral do Progresso Real

| Fase / Sprint | Foco Principal | Status | Entregáveis |
| :--- | :--- | :---: | :--- |
| **Sprint 1** | **Núcleo do Simulador WhatsApp** | 🟢 Concluído | US01, US02, US03, US04, US19, US21 |
| **Sprint 2** | **Golpe Interativo (Links & Web Falsa)** | 🟢 Concluído | US06, US07, US08, US09 |
| **Sprint 3 (MVP)** | **Metodologia do Susto Seguro** | 🟢 Concluído | US10, US11, US12, US13, US14 |
| **Sprint 4** | **Expansão dos 6 Grandes Golpes Nacionais** | 🟢 Concluído | US44, US45, US46, US47, US48 (0800, INSS, Motoboy, Presente) |
| **Sprint 5** | **Motor Offline pt-BR & Dicionário do Idoso** | 🟢 Concluído | US49, US50, US51, US52 (IndexedDB, Heurísticas, Relatório IFMT) |
| **Sprint 6** | **Portal da Família & Painel de Evolução** | 🟢 Concluído | US29, US30, US31, US36, US37, US38, US39 (Índice de Risco e Diagnóstico) |
| **Sprint 7** | **Pílulas de Boas Práticas da Dona Maria** | 🟡 Em Andamento | US53, US54, US55 (Mini Tutoriais Interativos de <= 5 min) |
| **Sprint 8** | **Assistente de Segurança ("Estou em Dúvida")** | ⚪ Próxima | US24, US25, US26, US27 (Consultoria para mensagens reais) |
| **Sprint 9** | **Hiperlocalização Regional (Mato Grosso / IFMT)** | ⚪ Planejada | US33, US34, US35 (Golpes locais de concessionárias e órgãos de MT) |

---

## 🏃 Detalhamento das Sprints Entregues e Planejadas

### 🏁 Sprint 1 — Primeira Simulação (Chat WhatsApp)
* **Objetivo:** Colocar o usuário dentro do primeiro ambiente de treinamento (conversa simulada).
* **Status:** 🟢 **Concluído**
* **Histórias Entregues:**
  - [x] **US01:** Iniciar uma simulação a partir do catálogo.
  - [x] **US02:** Visualizar conversa estilo WhatsApp com balões, foto de contato, status e carimbo de hora.
  - [x] **US03:** Interagir com escolhas de diálogo estruturadas e botões com acessibilidade.
  - [x] **US04:** Vivenciar o golpe do Falso Familiar (WhatsApp do Novo Número e Pix urgente).
  - [x] **US19/US21:** Síntese de áudio (TTS) e barra de acessibilidade (tamanhos de fonte e alto contraste WCAG AAA).

---

### 🏁 Sprint 2 — Golpe Interativo (Links & Web Falsa)
* **Objetivo:** Permitir ações de risco (navegar em links, páginas e formulários fictícios com navegador simulado).
* **Status:** 🟢 **Concluído**
* **Histórias Entregues:**
  - [x] **US06:** Acessar link simulado sem sair da aplicação segura.
  - [x] **US07:** Visualizar página web simulada (`banco-seguro-cancelamento.xyz`).
  - [x] **US08:** Modal de inspeção detalhada de links com verificação de protocolo e domínio oficial.
  - [x] **US09:** Realizar ação de risco com interceptação segura (formulário de dados fictício sem comunicação externa).

---

### 🎯 Sprint 3 — Metodologia do Susto Seguro (O Grande Marco MVP)
* **Objetivo:** Fechar o ciclo completo da metodologia pedagógica do "Susto Seguro" com reforço positivo e superação de erro.
* **Status:** 🟢 **Concluído**
* **Histórias Entregues:**
  - [x] **US10:** Alerta empático e acolhedor ("🚨 PARE! Você caiu em uma simulação, fique tranquilo!").
  - [x] **US11:** Raio-X dos Sinais de Risco com desconstrução didática da engenharia social.
  - [x] **US12:** Identificação dos gatilhos mentais (Urgência, Medo, Afeto, Falsa Autoridade).
  - [x] **US13:** Guia sequencial de 4 passos com a Regra de Ouro gravada.
  - [x] **US14:** Mecanismo de superação de erro (comparação da 1ª e da 2ª tentativa com troféu de superação).
  - [x] **US14-B:** Tela de Decisão Segura com desfecho do golpista visível na íntegra e opção de áudio.

---

### 🏁 Sprint 4 — Expansão dos 6 Grandes Golpes Nacionais
* **Objetivo:** Expandir a cobertura para os golpes mais recorrentes contra pessoas idosas no Brasil, além de incluir o ambiente de ligação telefônica.
* **Status:** 🟢 **Concluído**
* **Histórias Entregues:**
  - [x] **US44 (Golpe 2):** Golpe do Falso Alerta de Banco (SMS de compra fictícia de TV com link de phishing).
  - [x] **US45 (Golpe 3 & Simulador Telefônico):** Golpe da Falsa Central 0800 com simulação interativa de chamada telefônica ("Atendente Rodrigo").
  - [x] **US46 (Golpe 4):** Golpe da Falsa Prova de Vida do INSS (ameaça de corte de benefício e roubo de biometria facial).
  - [x] **US47 (Golpe 5):** Golpe do Falso Motoboy (ligação de cartão clonado e recolha do cartão cortado mantendo chip intacto).
  - [x] **US48 (Golpe 6):** Golpe do Presente de Aniversário (falsa entrega com taxa na maquininha adulterada e pedido de selfie).

---

### 🏁 Sprint 5 — Motor Offline em pt-BR & Dicionário de Expressões (IFMT)
* **Objetivo:** Garantir funcionamento 100% autônomo sem internet e estruturar a base de dados para a pesquisa de extensão universitária sobre o linguajar dos idosos.
* **Status:** 🟢 **Concluído**
* **Histórias Entregues:**
  - [x] **US49:** Banco de dados local IndexedDB (`SegurancaDigitalIdososDB`) para registro de clientes, sessões completas e expressões.
  - [x] **US50:** Motor heurístico de PNL offline com mais de 1.500 linhas em português brasileiro isolando rigorosamente cada cenário.
  - [x] **US51:** Captura automática de expressões não mapeadas com classificação semântica (`familia`, `financeiro`, `seguranca`, `urgencia`, `geral`).
  - [x] **US52:** Painel do Dicionário & Nuvem de Palavras com exportação em CSV e gerador oficial de Relatório de Extensão com gráficos.

---

### 🏁 Sprint 6 — Portal da Família & Diagnóstico de Evolução
* **Objetivo:** Conectar a rede de apoio familiar e fornecer feedback individualizado de segurança para o próprio idoso.
* **Status:** 🟢 **Concluído**
* **Histórias Entregues:**
  - [x] **US29/US30:** Painel de Evolução do Aluno com níveis de proteção (Iniciante, Prudente, Guardião, Cidadão Protegido) e diagnóstico de pontos fortes e fracos.
  - [x] **US36/US37/US38:** Portal da Família & Cuidadores com cálculo automático do Índice de Vulnerabilidade Familiar (0 a 100%).
  - [x] **US39:** Checklist prático para familiares (limite de Pix, senha verbal familiar, bloqueio de 0800).
  - [x] **US39-B:** Emissão e impressão do Relatório de Proteção Familiar em formato limpo para arquivo.
  - [x] **US39-C:** Certificado Oficial de Conclusão do Treinamento em Segurança Digital emitido para o participante.

---

### 🟡 Sprint 7 — Pílulas de Boas Práticas da Dona Maria (Em Andamento)
* **Objetivo:** Criar mini tutoriais interativos de até 5 minutos com foco em descentração cognitiva (aprendizagem em 3ª pessoa, onde o idoso atua como mentor protetor da Dona Maria).
* **Status:** 🟡 **Em Andamento**
* **Histórias em Desenvolvimento:**
  - [ ] **US53:** Interface de Storyboard Interativo com ilustrações, narração em áudio e dilemas guiados em no máximo 5 minutos.
  - [ ] **US54:** Caso 1 — *"O Dia em que Dona Maria Salvou a Aposentadoria"* (Falso Filho no WhatsApp e a decisão de conferir no número antigo).
  - [ ] **US55:** Caso 2 — *"Seu Raimundo e o Falso SMS do 0800"* (A regra de ouro do telefone no verso do cartão).
  - [ ] **US56:** Caso 3 — *"Dona Francisca e a Falsa Prova de Vida do INSS"* (Por que nunca mandar selfie ou documento por mensagem).

---

### ⚪ Sprint 8 — Assistente de Segurança ("Estou em Dúvida") (Próxima)
* **Objetivo:** Apoio para mensagens reais recebidas pelos idosos fora do aplicativo.
* **Histórias Planejadas:**
  - [ ] **US24:** Acesso rápido ao botão "Estou em Dúvida" na tela inicial.
  - [ ] **US25:** Relatar situação por texto ou áudio gravado.
  - [ ] **US26:** Protocolo imediato de orientação preventiva (Acalmar -> Pausar -> Não Pagar -> Checar Canal Oficial).
  - [ ] **US27:** Indicador de risco semafórico (🟢 Seguro | 🟡 Suspeito | 🔴 Alto Risco).

---

### ⚪ Sprint 9 — Hiperlocalização Regional (Mato Grosso / IFMT)
* **Objetivo:** Conectar simulações à realidade regional de Cuiabá e Mato Grosso.
* **Histórias Planejadas:**
  - [ ] **US33:** Cenários com concessionárias locais de Cuiabá/MT (ex: falso corte de energia da Energisa ou da Águas Cuiabá).
  - [ ] **US34:** Golpes regionais reportados pelo Procon-MT e Delegacia Especializada de Delitos Informáticos (DEDEI-MT).
