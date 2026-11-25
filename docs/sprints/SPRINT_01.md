# 🏃 SPRINT 01 — Primeira Simulação e Interface de Mensagens

* **Período:** Sprint 1 (Ciclo Inicial)
* **Status:** ✅ Concluído
* **Objetivo Geral da Sprint:** Criar a fundação tecnológica da plataforma e colocar o usuário dentro do primeiro ambiente de treinamento (Simulador de Mensagens/WhatsApp) com suporte total à acessibilidade (áudio e botões grandes) e o cenário do *Falso Familiar*.

---

## 📋 Sumário de Tasks da Sprint 1

| Task ID | História Relacionada | Título da Task | Status |
| :--- | :--- | :--- | :---: |
| **TSK-01** | US01 | Setup do Projeto & Tipagem de Cenários | ✅ Concluído |
| **TSK-02** | US02 | Interface do Chat Simulado (Balões, Avatar, Status) | ✅ Concluído |
| **TSK-03** | US03 | Painel de Decisões e Máquina de Estados da Simulação | ✅ Concluído |
| **TSK-04** | US04 | Roteiro do Cenário "Falso Familiar (Novo Número)" | ✅ Concluído |
| **TSK-05** | US19, US21 | Acessibilidade por Áudio (TTS pt-BR) e Alto Contraste | ✅ Concluído |

---

## 🛠️ Detalhamento Individual das Tasks

---

### 📌 Task TSK-01 — Setup do Projeto & Motor de Cenários
* **História de Usuário:** US01 — *Iniciar uma simulação*
* **Objetivo:** Configurar o ambiente moderno de desenvolvimento (React + TypeScript + Vite + Tailwind CSS) e criar os schemas de dados para modelar árvores de conversas, sinais de risco e perfis de remetente.
* **Alterações Feitas:**
  - Criação do `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` e `postcss.config.js`.
  - Implementação de [`src/types/scenario.ts`](file:///f:/Projeto%20Extensao%20I/src/types/scenario.ts): interfaces `Scenario`, `MessageNode`, `UserChoice`, `SenderProfile`, `RiskSignal`, `ManipulationTactic`.
  - Configuração do catálogo de cenários em [`src/data/scenarios/index.ts`](file:///f:/Projeto%20Extensao%20I/src/data/scenarios/index.ts).
* **Casos de Uso Cobertos:**
  - O sistema consegue carregar qualquer cenário tipado a partir de sua chave inicial (`initialNodeId`).
  - Permite ramificar caminhos de acordo com as decisões do usuário.
* **Requisitos para Teste:**
  1. O build TypeScript deve passar sem erros de tipagem (`npm run build`).
  2. O catálogo de cenários deve listar os treinamentos disponíveis.

---

### 📌 Task TSK-02 — Interface da Conversa Simulada
* **História de Usuário:** US02 — *Visualizar uma conversa simulada*
* **Objetivo:** Reproduzir visualmente a interface autêntica de um aplicativo de mensagens (WhatsApp), com cabeçalho de contato, indicador de "digitando...", balões de mensagens com foto/hora e badge de ambiente seguro.
* **Alterações Feitas:**
  - Componente [`src/components/simulator/ChatHeader.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/ChatHeader.tsx): exibição do número puro `+55 (65) 99841-3320` e status `Número não salvo na agenda (~ Lucas)` em vez de nome salvo, simulando com fidelidade o recebimento de mensagem de um desconhecido.
  - Componente [`src/components/simulator/MessageBubble.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/MessageBubble.tsx): balões distintos para remetente, usuário e avisos de sistema.
  - Scroll automático para a última mensagem recebida.
* **Casos de Uso Cobertos:**
  - O usuário visualiza as mensagens como se estivesse dentro de um aplicativo de mensagens real, percebendo visualmente que o número **não está salvo** nos contatos do aparelho.
  - Sabe claramente que está em um ambiente simulado protegido (badge no topo).
* **Requisitos para Teste:**
  1. Ao abrir o treinamento, a mensagem inicial deve surgir com uma breve simulação de digitação.
  2. As mensagens do interlocutor aparecem à esquerda em branco/cinza e as do usuário à direita em verde/destaque.

---

### 📌 Task TSK-03 — Painel de Interação e Tomada de Decisão
* **História de Usuário:** US03 — *Interagir com a conversa*
* **Objetivo:** Permitir que o usuário escolha respostas ou ações concretas dentro da conversa através de botões grandes e acessíveis.
* **Alterações Feitas:**
  - Componente [`src/components/simulator/DecisionPanel.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/DecisionPanel.tsx): lista de opções de ação com ícones representativos.
  - Componente [`src/components/simulator/SimulationContainer.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SimulationContainer.tsx): gerenciador de estado que recebe a escolha, adiciona a fala do usuário ao chat e avança para o nó seguinte.
* **Casos de Uso Cobertos:**
  - O usuário clica em uma resposta e vê sua fala inserida no chat.
  - O cenário reage dinamicamente com base na opção selecionada.
* **Requisitos para Teste:**
  1. Clicar em qualquer opção deve desabilitar o painel temporariamente, inserir a resposta do usuário no chat e disparar a réplica do fraudador.

---

### 📌 Task TSK-04 — Roteiro do Cenário "Falso Familiar"
* **História de Usuário:** US04 — *Vivenciar um golpe realista*
* **Objetivo:** Criar um roteiro realista com a dinâmica de engenharia social afetiva ("Oi mãe, troquei de número"), com múltiplos caminhos e sinais de risco embutidos.
* **Alterações Feitas:**
  - Criação de [`src/data/scenarios/fakeRelative.ts`](file:///f:/Projeto%20Extensao%20I/src/data/scenarios/fakeRelative.ts):
    - *Etapa 1:* Troca de número inesperada (Afeição/Foto pública).
    - *Etapa 2:* Urgência de conserto de celular e bloqueio do app de banco.
    - *Etapa 3:* Pedido de Pix em nome de terceiro desconhecido (Cleber Souza).
    - *Desfechos:* Ação insegura (Pix simulado) vs. Ações seguras (ligar para número antigo, pedir áudio, falar com outro familiar).
  - Modais [`SafeErrorModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SafeErrorModal.tsx) e [`SafeSuccessModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SafeSuccessModal.tsx).
* **Casos de Uso Cobertos:**
  - Se o usuário tentar enviar o Pix: o sistema ativa o "🚨 PARE! Simulação de Golpe", acolhe o usuário e explica o erro.
  - Se o usuário ligar para o número antigo ou recusar: o sistema parabeniza e reforça a regra de ouro.
* **Requisitos para Teste:**
  1. Seguir o caminho de risco e verificar se o modal do Susto Seguro é disparado no momento do Pix.
  2. Seguir o caminho seguro (ligar no número antigo) e verificar se o modal de parabéns é exibido.

---

### 📌 Task TSK-05 — Acessibilidade por Áudio (TTS) e Interface Acessível
* **História de Usuário:** US19, US21, US22
* **Objetivo:** Garantir que o usuário não dependa exclusivamente de leitura, fornecendo narração em voz alta de todas as mensagens, instruções e opções.
* **Alterações Feitas:**
  - Criação do serviço [`src/services/audioService.ts`](file:///f:/Projeto%20Extensao%20I/src/services/audioService.ts) utilizando Web Speech API (`SpeechSynthesis`) calibrado para pt-BR com fala acolhedora e pausada (rate 0.95).
  - Adição de botões "Ouvir" em:
    - Banner de Boas-Vindas da tela inicial.
    - Cada balão de mensagem no chat.
    - Painel de opções (ouvir todas ou ouvir individualmente).
    - Modais de feedback e explicação completa.
  - Barra de acessibilidade [`src/components/common/AccessibilityBar.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/common/AccessibilityBar.tsx) com 3 níveis de tamanho de fonte e modo Alto Contraste.
* **Casos de Uso Cobertos:**
  - Usuários com baixa visão ou dificuldade de alfabetização podem ouvir todas as mensagens tocando no botão "Ouvir".
  - Possibilidade de aumentar a fonte e ativar alto contraste a qualquer momento.
* **Requisitos para Teste:**
  1. Clicar no botão "Ouvir" de qualquer balão deve iniciar a fala em português.
  2. Clicar em "Silenciar Áudio" na barra superior deve cancelar a fala imediatamente.
  3. Clicar em "Texto Grande" / "Texto Extra Grande" deve aumentar as fontes de toda a interface.
