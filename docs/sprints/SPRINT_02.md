# 🏃 SPRINT 02 — Golpe Interativo (Links, Navegador e Páginas Web Falsas)

* **Período:** Sprint 2 (Ciclo de Expansão)
* **Status:** ✅ Concluído
* **Objetivo Geral da Sprint:** Expandir o simulador para além do aplicativo de mensagens, permitindo que o usuário clique em links suspeitos recebidos, visualize páginas web falsas em um navegador simulado interno (`BrowserSimulator`), inspecione o endereço com ferramenta didática (`UrlInspectorModal`) e execute ações de risco fictícias (como preencher dados ou tentar fazer um Pix falso) de forma 100% segura e com interceptação pedagógica.

---

## 📋 Sumário de Tasks da Sprint 2

| Task ID | História Relacionada | Título da Task | Status |
| :--- | :--- | :--- | :---: |
| **TSK-06** | US06 | Links Interativos com Pré-Visualização nos Balões de Mensagem | ✅ Concluído |
| **TSK-07** | US07 | Simulador de Navegador Web Móvel (`BrowserSimulator`) | ✅ Concluído |
| **TSK-08** | US07, US15 | Laboratório de Inspeção de URLs e Domínios (`UrlInspectorModal`) | ✅ Concluído |
| **TSK-09** | US08 | Roteiro do Cenário "Falso Alerta de Banco (Link Suspeito)" | ✅ Concluído |
| **TSK-10** | US09 | Ação de Risco Simulada com Interceptação Segura de Dados e Pix | ✅ Concluído |

---

## 🛠️ Detalhamento Individual das Tasks

---

### 📌 Task TSK-06 — Links Interativos com Pré-Visualização nos Balões
* **História de Usuário:** US06 — *Acessar um link recebido*
* **Objetivo:** Permitir que mensagens recebidas (SMS ou WhatsApp) contenham links com pré-visualização visual rica e clicável, levando para o navegador seguro dentro do app sem qualquer conexão externa.
* **Alterações Feitas:**
  - Atualização do schema [`src/types/scenario.ts`](file:///f:/Projeto%20Extensao%20I/src/types/scenario.ts) com a interface `LinkPreview` (`url`, `displayUrl`, `title`, `description`, `thumbnailUrl`, `destinationPageId`).
  - Atualização do componente [`src/components/simulator/MessageBubble.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/MessageBubble.tsx) para renderizar o card de pré-visualização com ícone de globo, URL destacada em vermelho, título, descrição e botões de "Acessar Link (Simulado)" e "Inspecionar".
  - Narração em áudio compatível: o botão "Ouvir" do balão agora narra também o link e o destino.
* **Casos de Uso Cobertos:**
  - O usuário recebe um SMS bancário com link e visualiza o card idêntico ao que os navegadores e mensageiros exibem.
  - O usuário clica no botão do link e transiciona diretamente para o navegador web simulado.
* **Requisitos para Teste:**
  1. No cenário do Falso Alerta de Banco, a primeira mensagem deve conter o card de link com o botão "Acessar Link (Simulado)".
  2. Clicar no botão do link deve abrir a página correspondente no navegador interno.

---

### 📌 Task TSK-07 — Simulador de Navegador Web Móvel (`BrowserSimulator`)
* **História de Usuário:** US07 — *Visualizar um site simulado*
* **Objetivo:** Reproduzir a experiência autêntica de um navegador web móvel (como Google Chrome ou Safari) dentro da aplicação, com barra de endereço, cadeado, botão de recarregar e botão de fechar/retornar.
* **Alterações Feitas:**
  - Criação do componente [`src/components/simulator/BrowserSimulator.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/BrowserSimulator.tsx).
  - Barra superior de navegação com:
    - Botão de retorno e botão de fechar navegador.
    - Barra de endereço com a URL fictícia e botão de inspeção.
    - Indicador de cadeado com aviso de site suspeito.
    - Faixa garantindo ambiente 100% simulado e seguro.
    - Narração em áudio de toda a página pelo botão "Ouvir Página".
  - Renderização do cabeçalho da instituição (banco/entrega), alerta de urgência piscante, headline explicativa, formulário de dados e simulação de pagamento.
* **Casos de Uso Cobertos:**
  - O idoso percebe como é uma página clonada na internet, compreendendo a barra de endereço e o layout visual sem correr perigo real.
  - Pode navegar, fechar o navegador a qualquer momento ou retornar para as mensagens.
* **Requisitos para Teste:**
  1. O navegador deve exibir a URL `https://banco-seguro-cancelamento.xyz/seguranca/cancelamento`.
  2. Clicar no botão de fechar (`X`) ou voltar (`←`) deve retornar à tela da conversa sem perda de estado.

---

### 📌 Task TSK-08 — Laboratório de Inspeção de URLs e Domínios (`UrlInspectorModal`)
* **História de Usuário:** US07, US15 — *Identificar links suspeitos*
* **Objetivo:** Oferecer uma ferramenta educativa que desmonta a URL na frente do usuário, explicando por que ela é falsa e ensinando a diferenciar um domínio oficial de uma imitação maliciosa.
* **Alterações Feitas:**
  - Criação do componente [`src/components/simulator/UrlInspectorModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/UrlInspectorModal.tsx).
  - Comparador visual lado a lado entre o link suspeito (`banco-seguro-cancelamento.xyz`) e o link oficial legítimo (`banco.com.br`).
  - Destaque didático do "Mito do Cadeado": explicação de que o cadeado não garante honestidade e que criminosos também usam conexões criptografadas.
  - Leitura por áudio completa com explicações pausadas e acessíveis em português.
* **Casos de Uso Cobertos:**
  - O usuário clica em "Inspecionar Link" tanto no balão da mensagem quanto na barra de endereço do navegador.
  - O modal explica que bancos nunca usam `.xyz` nem palavras extras como `-seguro` ou `-cancelamento`.
* **Requisitos para Teste:**
  1. Clicar em "Inspecionar Link" deve abrir o modal com a comparação visual.
  2. O botão de áudio deve narrar a regra de ouro das URLs.

---

### 📌 Task TSK-09 — Roteiro do Cenário "Falso Alerta de Banco (Link Suspeito)"
* **História de Usuário:** US08 — *Tomar uma decisão dentro da simulação*
* **Objetivo:** Modelar um cenário verossímil de engenharia social por SMS com ameaça financeira urgente (compra suspeita de R$ 3.890 nas Casas Bahia) e caminhos ramificados seguros e inseguros.
* **Alterações Feitas:**
  - Criação de [`src/data/scenarios/fakeBankLink.ts`](file:///f:/Projeto%20Extensao%20I/src/data/scenarios/fakeBankLink.ts).
  - Mapeamento completo dos nós:
    - *Mensagem 1:* SMS alarmante com link suspeito.
    - *Caminho Inseguro:* Clicar no link, preencher senha e tentar confirmar o cancelamento.
    - *Caminhos Seguros:* Abrir o app oficial instalado, ligar para o número impresso no verso do cartão físico ou recusar a pressão de tempo.
    - *Caminho Neutro:* Responder ao SMS pedindo satisfação, recebendo réplica automatizada com contagem regressiva de 10 minutos.
  - Registro do cenário em [`src/data/scenarios/index.ts`](file:///f:/Projeto%20Extensao%20I/src/data/scenarios/index.ts) e destaque na tela inicial de [`src/App.tsx`](file:///f:/Projeto%20Extensao%20I/src/App.tsx).
* **Casos de Uso Cobertos:**
  - O usuário seleciona o novo cenário diretamente na tela inicial do sistema.
  - Vivencia o dilema do SMS bancário e escolhe livremente se clica no link, inspeciona a URL ou busca o canal oficial.
* **Requisitos para Teste:**
  1. O card "Golpe do Falso Alerta de Banco (Link Suspeito)" aparece listado na tela inicial com badge "🌐 Inclui Navegador & Site Falso".
  2. Clicar em "Começar Treino" abre a simulação com a interface de SMS e link preview.

---

### 📌 Task TSK-10 — Ação de Risco com Interceptação Segura de Dados e Pix
* **História de Usuário:** US09 — *Realizar uma ação de risco simulada*
* **Objetivo:** Permitir que o usuário digite dados falsos (CPF, senha de 6 dígitos) e clique em "Confirmar Cancelamento", congelando a operação no instante crítico para acionar o alerta pedagógico do Susto Seguro sem expor nenhum dado real.
* **Alterações Feitas:**
  - Integração do formulário no `BrowserSimulator.tsx` com campos acessíveis e dinâmicos.
  - Interceptador de clique: ao clicar no botão de risco (`submit_risk`), o sistema simula um breve processamento e dispara o modal [`SafeErrorModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SafeErrorModal.tsx) explicando que os dados foram capturados pelo fraudador na simulação.
  - Ao clicar no botão de saída segura ("Sair do Site e Ligar no Cartão"), o sistema aciona o [`SafeSuccessModal.tsx`](file:///f:/Projeto%20Extensao%20I/src/components/simulator/SafeSuccessModal.tsx) parabenizando pela atitude correta.
* **Casos de Uso Cobertos:**
  - O usuário testa a consequência de entregar sua senha e CPF em um site suspeito sem perder dinheiro ou correr risco.
  - Aprende que a rota segura é sempre ligar no número do verso do cartão físico.
* **Requisitos para Teste:**
  1. Clicar em "Confirmar Dados e Cancelar Compra" na página falsa deve abrir o SafeErrorModal com acolhimento empático.
  2. Clicar em "Sair Deste Site e Ligar no Telefone do Meu Cartão" deve abrir o SafeSuccessModal.
