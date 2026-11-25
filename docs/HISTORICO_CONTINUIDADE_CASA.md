# 📋 Histórico do Projeto e Guia de Continuidade (Casa)
**Projeto de Extensão Universitária:** Treinamento Prático em Segurança Digital para Pessoas Idosas  
**Instituição:** IFMT - Campus Cuiabá | **Orientador:** Prof. Thiago Lacerda  
**Aluna / Desenvolvedora:** Vitória Cristina dos Santos Cansado  
**Data do Registro:** 12/11/2026  

---

## 🚀 1. Como Rodar no Outro Computador (Passo a Passo)

### Pré-requisitos
* **Node.js:** Versão 18 ou superior instalada ([nodejs.org](https://nodejs.org/)).
* **Google Chrome:** Navegador instalado.
* **VS Code:** Editor de código recomendado.

### Comandos de Inicialização
Ao extrair a pasta do projeto no seu computador de casa, abra o terminal na pasta e execute:

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

### ⚡ Atalho Fácil com F5 (VS Code)
Configuramos o arquivo `.vscode/launch.json`:
* Basta abrir a pasta no **VS Code** e pressionar **F5** no teclado.
* O sistema inicia o Vite e abre automaticamente a aplicação no **Google Chrome** no endereço:
  👉 **`http://127.0.0.1:5173/`**

---

## 🔑 2. Configuração de Inteligência Artificial (.env)

O projeto possui um motor híbrido de IA: funciona **100% offline** (árvore heurística pedagógica) e também com **Google Gemini 3.5 Flash Lite** quando há internet.

Certifique-se de que o arquivo `.env` na raiz do projeto contenha a chave:
```env
VITE_GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI
```
*(Você também pode alterar ou ligar/desligar a IA diretamente na interface web clicando no botão `[ ✨ IA Online ]` no topo da simulação).*

---

## 🛠️ 3. O que Foi Concluído Hoje (Últimas Entregas e Ajustes)

### A. 🎙️ Microfone e Reconhecimento de Voz (Speech-to-Text)
* **Arquivo:** `src/components/simulator/ChatInputBar.tsx`
* **Melhorias:**
  * Solicitação prévia de permissão do navegador (`navigator.mediaDevices.getUserMedia`).
  * Transcrição de fala em tempo real (`interimResults: true`), permitindo que a pessoa idosa veja o que está falando enquanto dita.
  * Auto-interrupção do áudio TTS (sintetizador de voz) ao ligar o microfone para evitar eco.
  * Mensagens acolhedoras de instrução caso o microfone esteja bloqueado ou não detecte som.

### B. ⚡ Servidor fora da porta 3000 e Abertura no Chrome
* **Arquivos:** `vite.config.ts`, `.vscode/launch.json`, `.vscode/tasks.json`
* **Melhorias:**
  * Mudança definitiva da porta conflitante `3000` para a porta `5173` (com tolerância automática para `5174` se ocupada).
  * Injeção de `process.env.BROWSER = 'chrome'` para redirecionar diretamente ao Google Chrome no Windows.
  * Configuração do F5 no modo `node-terminal` para eliminar erros de attach de depurador.

### C. 🧠 Blindagem e Treinamento da IA (Anti-Alucinação)
* **Arquivos:** `src/services/aiScammerService.ts` e `src/services/dialogueInterpreter.ts`
* **Problemas Resolvidos:**
  1. **Verbo "deixou" como nome do filho:** Criada lista de bloqueio com mais de 50 verbos comuns em português (`deixou`, `salvou`, `mandou`, `enviou`, `pagou`, etc.) e barreira contra frases como *"onde o filho deixou salvo"*.
  2. **Alucinação cruzada (Filho no SMS de Banco):** O prompt da IA agora é 100% isolado por tipo de cenário:
     * **No Golpe do Banco:** A IA atua estritamente como sistema automatizado interbancário/antifraude. Há regra proibindo chamar o usuário de "mãe" ou fingir ser familiar.
     * **Quando perguntam de múltiplos bancos:** A IA responde tecnicamente sobre monitoramento de bandeiras e cartões associados ao CPF e orienta a validação via link.
  3. **Treinamento In-Context (Few-Shot):** Inseridos exemplos reais de diálogos no prompt para que a IA aja como golpista realista e saiba identificar saídas seguras (aplicação da Regra de Ouro).
  4. **Blindagem e Isolamento Total de Cenário (Anti-Drift):** 
     * Implementado `interpretBankLink` e `interpretCallCenter` no interpretador offline, impedindo que o fallback offline envie mensagens de "Mãe" e "Filho" no teste de banco.
     * Adicionada **Barreira de Saída (Output Guardrail)** no `aiScammerService.ts` que intercepta qualquer termo familiar acidental e substitui automaticamente pela resposta formal bancária.
     * Expurgo automático do histórico de conversas anteriores ao trocar de cenário para evitar contaminação de contexto.

### D. 📱 Interface Dedicada de SMS vs. WhatsApp
* **Arquivos:** `src/components/simulator/SimulationContainer.tsx`, `ChatHeader.tsx`, `MessageBubble.tsx`, `ChatInputBar.tsx`
* **Melhorias:**
  * O cenário de SMS (`falso-aviso-banco-link`) agora possui identidade visual própria de aplicativo de mensagens (estilo Google Mensagens / Android):
    * Fundo neutro `bg-slate-100` (removido o papel de parede bege `#EFEAE2` do WhatsApp).
    * Topo escuro `bg-slate-900` com número curto (`SMS: 28401`).
    * Removidos ícones de chamada de vídeo e a bolinha verde de status "online" (incompatíveis com SMS).
    * Balões de resposta do usuário em azul clássico de SMS (`bg-blue-600`) sem marcas de leitura (`✓✓`).
    * Campo de digitação com texto *"Mensagem de texto (SMS)..."*.

### E. 🧹 Limpeza de Jargões Internos
* **Arquivos:** `SafeErrorModal.tsx`, `SafeSuccessModal.tsx`
* Removidos textos técnicos como *"Sprint 3 MVP"* e *"US14"*, substituídos por linguagem pedagógica acolhedora (*"Metodologia do Susto Seguro • Treinamento Prático"* e *"Conquista de Aprendizagem • Parabéns!"*).

---

## 📂 4. Mapa dos Arquivos Mais Importantes para Mexer

| Arquivo | Função Principal |
| :--- | :--- |
| `src/services/aiScammerService.ts` | Motor de IA com Google Gemini (prompts, personas e regras). |
| `src/services/dialogueInterpreter.ts` | Motor local/offline de interpretação e árvore de diálogo. |
| `src/components/simulator/SimulationContainer.tsx` | Contêiner central que gerencia o fluxo da simulação. |
| `src/components/simulator/ChatHeader.tsx` | Cabeçalho adaptativo (WhatsApp vs. SMS). |
| `src/components/simulator/MessageBubble.tsx` | Balões de mensagem com áudio acessível e links. |
| `src/components/simulator/ChatInputBar.tsx` | Barra de mensagem com digitação, sugestões e microfone. |
| `src/components/simulator/SafeErrorModal.tsx` | Centro pedagógico do Erro Seguro (Alerta Empático e Raio-X). |
| `src/components/simulator/SafeSuccessModal.tsx` | Tela de superação de erro e conquista ao evitar o golpe. |
| `src/data/scenarios/` | Banco de dados dos cenários (Falso Familiar, SMS Banco, 0800). |

---

## 🎯 5. Sugestões de Próximos Ajustes em Casa

1. **Testes de Conversação com a IA:** Faça diferentes testes simulando mensagens de idosos (ex: *"vou pedir ajuda pro meu neto"*, *"não sei usar internet"*, *"não tenho dinheiro"*) para verificar como a IA reage.
2. **Cenário da Falsa Central (0800):** Refinar o visual da simulação de ligação telefônica (áudio de espera e operadora).
3. **Painel do Participante (`UserEvolutionDashboard.tsx`):** Validar os gráficos de evolução individual conforme você realiza tentativas nos treinamentos.
