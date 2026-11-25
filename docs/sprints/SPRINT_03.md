# 🎯 SPRINT 03 — MVP (O Grande Marco: Erro Seguro, Raio-X de Sinais e Ciclo Completo de Aprendizagem)

* **Período:** Sprint 3 (Marco Central do Produto / MVP)
* **Status:** ✅ Concluído
* **Objetivo Geral da Sprint:** Fechar o ciclo completo da metodologia pedagógica do **"Susto Seguro"**: *Vivenciar → Decidir → Errar sem perigo → Descobrir → Desconstruir os sinais de risco (Raio-X) → Entender os gatilhos psicológicos → Aprender a rota segura (Passo a Passo) → Tentar novamente com superação de erro*.

---

## 📋 Sumário de Tasks da Sprint 3

| Task ID | História Relacionada | Título da Task | Status |
| :--- | :--- | :--- | :---: |
| **TSK-11** | US10 | Alerta Empático de Erro Seguro e Acolhimento Imediato | ✅ Concluído |
| **TSK-12** | US11 | Laboratório Interativo de Raio-X dos Sinais de Risco (`SafeErrorModal`) | ✅ Concluído |
| **TSK-13** | US12 | Decomposição dos Gatilhos Psicológicos de Engenharia Social | ✅ Concluído |
| **TSK-14** | US13 | Guia Sequencial Interativo "O Que Fazer da Próxima Vez" (4 Passos) | ✅ Concluído |
| **TSK-15** | US14 | Mecânica de Reinício, Desafio Correlato e Troféu de Superação de Erro | ✅ Concluído |

---

## 🛠️ Detalhamento Individual das Tasks

---

### 📌 Task TSK-11 — Alerta Empático de Erro Seguro e Acolhimento Imediato
* **História de Usuário:** US10 — *Descobrir que caiu no golpe*
* **Objetivo:** Notificar imediatamente o usuário no exato momento em que uma ação de risco é consumada (ex.: confirmação de Pix fictício, digitação de senha bancária em link suspeito ou autorização na central telefônica falsa), sem causar culpa ou pânico.
* **Alterações Feitas:**
  - Tela de parada imediata: `🚨 PARE! Você caiu na simulação de golpe`.
  - Mensagem de alívio e segurança: *"Fique 100% tranquilo(a)! Nenhum centavo saiu da sua conta e nenhum vírus foi baixado. Este simulador existe exatamente para você errar aqui e nunca na vida real!"*.
  - Narração automática imediata por voz (Web Speech TTS) para garantir acolhimento instantâneo a pessoas com baixa visão ou ansiedade.
  - Exibição da ação exata que disparou o alarme (`criticalReason`).

---

### 📌 Task TSK-12 — Laboratório Interativo de Raio-X dos Sinais de Risco
* **História de Usuário:** US11 — *Visualizar os sinais do golpe*
* **Objetivo:** Desmontar as mensagens do golpista em tempo real, evidenciando as armadilhas que estavam disfarçadas.
* **Alterações Feitas:**
  - Aba **"2. Raio-X dos Sinais"** em [`src/components/simulator/SafeErrorModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SafeErrorModal.tsx).
  - Coleta dinâmica de sinais de risco dos nós percorridos (`RiskSignal`) e catálogo contextualizado por tipo de ambiente:
    - *Falso Familiar:* Número desconhecido fora da agenda + Pressão de horário + Pix em nome de terceiro ("Cleber Souza").
    - *Links Falsos:* Alerta de compra alta para pânico + Domínio estranho `.xyz` + Pesca de senha bancária de 6 dígitos.
    - *Falsa Central 0800:* Alerta SMS + Falso 0800 contratado + Falso "Pix de Blindagem da Conta-Cofre".
  - Badges coloridos por tática psicológica (`⏱️ Pressão de Tempo`, `😨 Medo & Pânico`, `🏛️ Falsa Autoridade`, `❤️ Laço Familiar`).
  - Leitura auditiva dedicada de cada sinal em áudio.

---

### 📌 Task TSK-13 — Decomposição dos Gatilhos Psicológicos
* **História de Usuário:** US12 — *Entender meu erro e os gatilhos psicológicos*
* **Objetivo:** Explicar a ciência por trás do golpe, mostrando ao idoso que ele não caiu por desatenção boba, mas sim porque os criminosos exploraram táticas psicológicas de persuasão.
* **Alterações Feitas:**
  - Aba **"3. Gatilhos Mentais"** em [`src/components/simulator/SafeErrorModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SafeErrorModal.tsx).
  - Análise dos três pilares da Engenharia Social:
    1. **O Senso de Urgência:** Como a pressa desativa o raciocínio crítico do cérebro.
    2. **A Falsa Autoridade e o Medo:** A falsa sensação de segurança trazida por termos bancários e protocolos falsos.
    3. **O Afeto e a Família:** A exploração da preocupação legítima de pais e avós com seus filhos.

---

### 📌 Task TSK-14 — Guia Sequencial Interativo "O Que Fazer"
* **História de Usuário:** US13 — *Aprender o que fazer da próxima vez*
* **Objetivo:** Fornecer um procedimento acionável e simples em 4 passos para memorização rápida.
* **Alterações Feitas:**
  - Aba **"4. O Que Fazer"** em [`src/components/simulator/SafeErrorModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SafeErrorModal.tsx).
  - Protocolo visual dos 4 passos:
    - **Passo 1 — PAUSA COGNITIVA (30 segundos):** Colocar o celular na mesa e respirar.
    - **Passo 2 — DESCONFIE DO CANAL:** Nunca confiar na mensagem que veio até você.
    - **Passo 3 — BUSQUE O CANAL INDEPENDENTE:** Ligar no número antigo ou no verso do cartão físico.
    - **Passo 4 — REGRA DE OURO:** Bancos e parentes reais nunca pedem Pix em nome de estranhos nem senhas por telefone.

---

### 📌 Task TSK-15 — Reinício, Desafio Correlato e Troféu de Superação de Erro
* **História de Usuário:** US14 — *Tentar novamente e comparar desempenho*
* **Objetivo:** Fechar o ciclo de aprendizagem permitindo uma segunda chance imediata ou avanço para um cenário correlato com medição de superação.
* **Alterações Feitas:**
  - Botão **"Praticar Novamente Este Treino (Segunda Chance)"**: Reinicia o mesmo cenário para que o usuário aplique o aprendizado.
  - Botão **"Tentar Desafio Correlato"**: Transiciona diretamente para o próximo treinamento correlato sem precisar passar pela tela inicial.
  - **Troféu de Superação do Erro (`hasOvercomeError`)** em [`src/components/simulator/SafeSuccessModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SafeSuccessModal.tsx): Quando o usuário cai na 1ª tentativa e obtém sucesso na 2ª tentativa, é disparado um card dourado especial com efeito de áudio e visual de conquista.
  - Registro de histórico e evolução em [`src/services/userProgressService.ts`](file:///f:/Projeto%20Extensao%20I/src/services/userProgressService.ts).

---

## 🏆 Critério de Aceite do MVP Atendido com Êxito
O sistema cumpre com precisão o fluxo pedagógico:
$$\text{Vivenciar} \longrightarrow \text{Decidir} \longrightarrow \text{Errar sem Perigo} \longrightarrow \text{Descobrir} \longrightarrow \text{Desconstruir Sinais} \longrightarrow \text{Aprender Rota Segura} \longrightarrow \text{Superar o Erro}$$
