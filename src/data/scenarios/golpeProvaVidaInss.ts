import { Scenario } from '../../types/cenario';

export const fakeInssScenario: Scenario = {
  id: 'falsa-prova-vida-inss',
  title: 'Golpe da Falsa Prova de Vida do INSS (Ameaça de Bloqueio)',
  category: 'INSS & Benefícios Previdenciários',
  environment: 'sms',
  difficulty: 'intermediario',
  description: 'Você recebe um SMS alarmante do suposto Meu INSS alertando que sua Prova de Vida anual está pendente e que sua aposentadoria será bloqueada em 48h se não clicar no link para enviar selfie e dados do Gov.br.',
  sender: {
    name: 'MEU-INSS-NOTIFICA',
    phoneNumber: 'SMS: 28080 (INSS-ALERTA)',
    avatarUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=150&auto=format&fit=crop&q=80',
    statusText: 'Notificação Previdenciária',
    institution: 'Previdência Social Fictícia'
  },
  initialNodeId: 'node_sms_inss',
  summary: {
    scamType: 'Phishing Previdenciário com Roubo de Biometria Facial e Credenciais Gov.br',
    manipulationTactics: ['fear', 'urgency', 'authority'],
    safeRouteExplanation: 'O INSS NUNCA envia mensagens por SMS ou WhatsApp com links para realização de prova de vida nem solicita fotos de documentos ou senhas. Desde 2023, a prova de vida é realizada de forma automática pelo Governo Federal através do cruzamento de bancos de dados oficiais (vacinação, votação, emissão de documentos) ou presencialmente no banco onde você recebe o benefício.',
    goldenRule: 'Recebeu mensagem com link ameaçando suspender a aposentadoria? Pare, não clique! O INSS não bloqueia benefícios por SMS. Acesse exclusivamente o aplicativo oficial "Meu INSS" ou ligue na Central Oficial 135.'
  },
  simulatedWebPages: {
    page_inss_biometria: {
      id: 'page_inss_biometria',
      url: 'https://meu-inss-recadastramento-biometria.xyz/login',
      title: 'Meu INSS — Validação Anual de Prova de Vida Digital',
      brandName: 'Governo Federal • Meu INSS Previdência',
      theme: 'government',
      isSuspiciousUrl: true,
      suspiciousDomainExplanation: 'O endereço do site termina em ".xyz". Todos os sites oficiais do INSS e do Governo Federal utilizam OBRIGATORIAMENTE o domínio protegido final ".gov.br" (exemplo: gov.br/meuinss). Criminosos usam .xyz para enganar pessoas com páginas clonadas.',
      officialDomainExample: 'https://meu.inss.gov.br ou aplicativo oficial Meu INSS',
      headline: 'Recadastramento Obrigatório de Prova de Vida Digital',
      subheadline: 'Benefício Previdenciário sob aviso de suspensão cautelar em 48 horas.',
      alertBox: {
        type: 'danger',
        title: 'Prazo Limite: Restam 48 horas para envio dos dados',
        message: 'Para regularizar o pagamento da sua aposentadoria e evitar o bloqueio no banco, informe sua senha da Conta Gov.br e anexe sua foto facial (selfie) para verificação biométrica.'
      },
      formFields: [
        {
          id: 'cpf',
          label: 'Informe seu CPF (apenas números):',
          type: 'cpf',
          placeholder: '000.000.000-00'
        },
        {
          id: 'gov_pass',
          label: 'Digite sua Senha de Acesso à Conta Gov.br:',
          type: 'password',
          placeholder: 'Senha da conta Gov.br'
        },
        {
          id: 'selfie_upload',
          label: 'Foto do Rosto (Selfie) para Validação Biométrica:',
          type: 'text',
          placeholder: 'Toque para tirar foto do rosto ou enviar documento'
        }
      ],
      actionButtons: [
        {
          id: 'btn_confirm_inss_risk',
          label: '🚨 Enviar Minha Selfie e Senha para Validar Benefício',
          type: 'submit_risk',
          nextAction: 'critical_failure',
          explanation: 'Ao enviar sua senha Gov.br e foto do rosto em site não oficial, os golpistas utilizam sua biometria facial para abrir contas bancárias e tomar empréstimos consignados no seu nome.'
        },
        {
          id: 'btn_inspect_inss_url',
          label: '🔍 Inspecionar Endereço (.xyz vs .gov.br)',
          type: 'inspect_url',
          nextAction: 'inspect_modal',
          explanation: 'Veja como identificar que o endereço termina em .xyz e não no domínio oficial .gov.br do governo.'
        },
        {
          id: 'btn_safe_exit_inss',
          label: '🛑 Fechar Este Link e Consultar no App Oficial Meu INSS',
          type: 'cancel_safe',
          nextAction: 'safe_return',
          explanation: 'Excelente! A atitude correta é jamais colocar dados em links de SMS e verificar no app oficial do Meu INSS ou ligar para o telefone 135.'
        }
      ]
    }
  },
  nodes: {
    node_sms_inss: {
      id: 'node_sms_inss',
      sender: 'opponent',
      text: '[MEU INSS ALERTA]: Consta PENDÊNCIA na sua Prova de Vida 2026. O pagamento do seu benefício de aposentadoria será SUSPENSO em 48 horas. Para regularizar imediatamente e enviar a validação facial digital, acesse o portal: ',
      timestamp: '09:15',
      linkPreview: {
        url: 'https://meu-inss-recadastramento-biometria.xyz/login',
        displayUrl: 'meu-inss-recadastramento-biometria.xyz',
        title: 'Meu INSS — Prova de Vida Digital e Atualização Cadastral',
        description: 'Acesse para realizar o envio da biometria facial e impedir a suspensão da sua aposentadoria.',
        destinationPageId: 'page_inss_biometria'
      },
      riskSignals: [
        {
          id: 'sig_inss_fear',
          title: 'Medo de Perder a Aposentadoria',
          description: 'Ameaçar o corte ou bloqueio do pagamento mensal é o gatilho psicológico de pânico mais explorado contra pessoas idosas.',
          tactic: 'fear'
        },
        {
          id: 'sig_fake_gov_domain',
          title: 'Link Falso Fora do Domínio .gov.br',
          description: 'O link termina em .xyz. Todo serviço oficial do Governo Federal brasileiro termina estritamente em .gov.br.',
          tactic: 'authority'
        },
        {
          id: 'sig_inss_biometric_theft',
          title: 'Tentativa de Captura de Biometria (Selfie)',
          description: 'Golpistas solicitam fotos de selfie para obter aprovação facial em abertura de contas de laranjas e empréstimos consignados.',
          tactic: 'urgency'
        }
      ],
      choices: [
        {
          id: 'c1_click_inss_link',
          text: '🌐 [Acessar Link no Navegador] Entrar no site para não ter minha aposentadoria bloqueada',
          type: 'insecure',
          nextNodeId: 'node_in_browser_inss',
          explanation: 'Acessar o link enviado por SMS leva a uma página clonada do governo criada para roubar senhas do Gov.br e fotos de biometria.'
        },
        {
          id: 'c1_check_inss_app',
          text: '📱 Não clicar no link. Abrir o aplicativo oficial "Meu INSS" baixado no meu celular',
          type: 'safe',
          nextNodeId: 'node_safe_inss_app',
          explanation: 'Atitude perfeita! A consulta de benefícios deve ser realizada exclusivamente dentro do aplicativo oficial ou pelo portal gov.br.'
        },
        {
          id: 'c1_call_135',
          text: '📞 Ignorar a mensagem e ligar para a Central Telefônica Oficial do INSS no telefone 135',
          type: 'verify_official',
          nextNodeId: 'node_safe_135',
          explanation: 'Excelente! O telefone 135 é o canal telefônico oficial gratuito do INSS para esclarecimento de dúvidas sobre benefícios.'
        }
      ]
    },

    node_in_browser_inss: {
      id: 'node_in_browser_inss',
      sender: 'system',
      text: 'Você clicou no link recebido por SMS e foi direcionado para a página clonada do Meu INSS no navegador simulado.',
      timestamp: '09:16'
    },

    node_safe_inss_app: {
      id: 'node_safe_inss_app',
      sender: 'system',
      text: 'Você abriu o aplicativo oficial "Meu INSS" com segurança e verificou que seu benefício está 100% ativo e sem pendências! A mensagem de SMS era uma fraude criminosa.',
      timestamp: '09:17',
      isSafeEnding: true
    },

    node_safe_135: {
      id: 'node_safe_135',
      sender: 'system',
      text: 'Você ligou para o 135 da Previdência Social e a atendente oficial confirmou: o INSS nunca manda links por SMS para fazer prova de vida e sua aposentadoria está garantida!',
      timestamp: '09:18',
      isSafeEnding: true
    }
  }
};
