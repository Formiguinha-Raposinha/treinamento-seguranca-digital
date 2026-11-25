import { Scenario } from '../../types/cenario';

export const fakeBankLinkScenario: Scenario = {
  id: 'falso-aviso-banco-link',
  title: 'Golpe do Falso Alerta de Banco (Link Suspeito)',
  category: 'Internet & Links Falsos',
  environment: 'sms',
  difficulty: 'intermediario',
  description: 'Você recebe um SMS urgente informando uma compra de R$ 2.490,00 aprovada no Magazine Luiza com um link malicioso para cancelamento imediato.',
  sender: {
    name: 'ALERTA-SEGURANCA',
    phoneNumber: 'SMS: 28401',
    avatarUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=150&auto=format&fit=crop&q=80',
    statusText: 'Canal de Notificações SMS',
    institution: 'Notificação Bancária Fictícia'
  },
  initialNodeId: 'node_1',
  summary: {
    scamType: 'Phishing Bancário com Link Falso / Engenharia Social de Medo e Urgência',
    manipulationTactics: ['urgency', 'fear', 'authority'],
    safeRouteExplanation: 'Bancos legítimos NUNCA enviam links em SMS ou WhatsApp para cancelamento de transações. Caso receba mensagens sobre compras não reconhecidas, ignore o link, acesse seu aplicativo oficial de costume ou ligue no telefone oficial que está impresso no verso do seu cartão físico.',
    goldenRule: 'Recebeu mensagem com link para cancelar compra? Pare, não clique! Feche a mensagem e cheque pelo canal oficial independente.'
  },
  simulatedWebPages: {
    page_fake_bank_cancel: {
      id: 'page_fake_bank_cancel',
      url: 'https://banco-seguro-cancelamento.xyz/seguranca/cancelamento',
      title: 'Central de Segurança Bancária — Cancelamento',
      brandName: 'Central de Atendimento e Segurança Bancária',
      theme: 'bank',
      isSuspiciousUrl: true,
      suspiciousDomainExplanation: 'O endereço do site termina em ".xyz" e usa palavras como "banco-seguro-cancelamento". Nenhum banco brasileiro utiliza terminação .xyz! Os sites legítimos utilizam domínios oficiais protegidos terminados em ".com.br" sem palavras intermediárias estranhas.',
      officialDomainExample: 'https://www.bb.com.br ou https://www.caixa.gov.br ou https://www.itau.com.br',
      headline: 'Cancelamento Imediato de Compra Não Reconhecida',
      subheadline: 'Transação sob suspeita: R$ 2.490,00 às 10:45 no Magazine Luiza (Smart TV 50") em seu cartão.',
      alertBox: {
        type: 'danger',
        title: 'Tempo Restante: 04:32 para bloqueio preventivo',
        message: 'Para cancelar esta transação e impedir a cobrança em sua conta, confirme seus dados e sua senha bancária de 6 dígitos para validação do estorno.'
      },
      formFields: [
        {
          id: 'cpf',
          label: 'Informe seu CPF (apenas números):',
          type: 'cpf',
          placeholder: '000.000.000-00'
        },
        {
          id: 'card_end',
          label: 'Confirme o final do seu cartão:',
          type: 'text',
          placeholder: 'Final 4 dígitos (ex: 4812)'
        },
        {
          id: 'password',
          label: 'Digite sua Senha Eletrônica / Bancária de 6 dígitos:',
          type: 'password',
          placeholder: '••••••'
        }
      ],
      actionButtons: [
        {
          id: 'btn_confirm_risk',
          label: '🚨 Confirmar Dados e Cancelar Compra de R$ 2.490',
          type: 'submit_risk',
          nextAction: 'critical_failure',
          explanation: 'Ao digitar dados e senha em página não oficial, o fraudador captura suas credenciais para roubar sua conta.'
        },
        {
          id: 'btn_inspect_url',
          label: '🔍 Inspecionar Endereço do Site (.xyz) e Segurança',
          type: 'inspect_url',
          nextAction: 'inspect_modal',
          explanation: 'Aprenda a notar a URL estranha antes de digitar qualquer dado.'
        },
        {
          id: 'btn_safe_exit',
          label: '🛑 Sair Deste Site e Ligar no Telefone do Meu Cartão',
          type: 'cancel_safe',
          nextAction: 'safe_return',
          explanation: 'Excelente! A atitude correta é fechar qualquer link e consultar o banco pelo telefone oficial impresso no cartão.'
        }
      ]
    }
  },
  nodes: {
    node_1: {
      id: 'node_1',
      sender: 'opponent',
      text: '[BANCO NOTIFICA]: Compra aprovada no valor de R$ 2.490,00 em Magazine Luiza (Smart TV 50") no seu cartao final 4812. Se voce NAO reconhece esta transacao, acerte o cancelamento em ate 15 min no portal seguro: ',
      timestamp: '10:46',
      linkPreview: {
        url: 'https://banco-seguro-cancelamento.xyz/seguranca/cancelamento',
        displayUrl: 'banco-seguro-cancelamento.xyz',
        title: 'Central de Segurança — Cancelar Transação Suspeita',
        description: 'Clique para cancelar a cobrança de R$ 2.490,00 e contestar a compra antes do fechamento da fatura.',
        destinationPageId: 'page_fake_bank_cancel'
      },
      riskSignals: [
        {
          id: 'signal_urgency_fear',
          title: 'Medo e Urgência Financeira',
          description: 'O golpista usa um valor alto e a ideia de perda imediata para fazer você se afobar.',
          tactic: 'fear'
        },
        {
          id: 'signal_fake_link',
          title: 'Link Falso em SMS (.xyz)',
          description: 'A mensagem traz um link que imita um banco, mas possui domínio incomum (.xyz).',
          tactic: 'authority'
        }
      ],
      choices: [
        {
          id: 'c1_click_link',
          text: '🌐 [Acessar Link no Navegador Simulado] Cancelar compra de R$ 2.490 no site',
          type: 'insecure',
          nextNodeId: 'node_in_browser',
          explanation: 'Acessar o link recebido por SMS leva a uma página clonada criada para roubar senhas.'
        },
        {
          id: 'c1_verify_app',
          text: '💳 Não clicar no link. Fechar o SMS e abrir meu aplicativo oficial do banco no celular.',
          type: 'verify_official',
          nextNodeId: 'node_safe_open_app',
          explanation: 'Perfeito! Se você abrir seu app oficial, verá que a compra nunca existiu.'
        },
        {
          id: 'c1_call_card',
          text: '📞 Ligar para o telefone oficial impresso no verso do meu cartão físico.',
          type: 'verify_official',
          nextNodeId: 'node_safe_call_card',
          explanation: 'Excelente! O número no verso do seu cartão é um canal 100% confiável e seguro.'
        },
        {
          id: 'c1_reply_msg',
          text: '❓ Responder a mensagem: "Eu não fiz essa compra, quem autorizou isso?"',
          type: 'neutral',
          nextNodeId: 'node_reply_sms',
          explanation: 'Responder a mensagens falsas de SMS confirma para os golpistas que o seu número está ativo.'
        }
      ]
    },

    node_in_browser: {
      id: 'node_in_browser',
      sender: 'opponent',
      text: 'Você clicou no link e foi direcionado para a página web simulada. Observe o endereço na barra superior e decida como proceder com cautela.',
      timestamp: '10:47',
      linkPreview: {
        url: 'https://banco-seguro-cancelamento.xyz/seguranca/cancelamento',
        displayUrl: 'banco-seguro-cancelamento.xyz',
        title: 'Central de Segurança — Cancelar Transação Suspeita',
        description: 'Clique no botão abaixo para abrir a página web no navegador simulado.',
        destinationPageId: 'page_fake_bank_cancel'
      },
      choices: [
        {
          id: 'c_open_browser_screen',
          text: '🌐 Abrir o Navegador Simulado agora para examinar a página falsa',
          type: 'neutral',
          nextNodeId: 'node_in_browser'
        },
        {
          id: 'c_back_to_safety',
          text: '🛑 Vi que o link termina em .xyz! Fechar a página e ligar no banco oficial.',
          type: 'safe',
          nextNodeId: 'node_safe_call_card'
        }
      ]
    },

    node_reply_sms: {
      id: 'node_reply_sms',
      sender: 'opponent',
      text: '[RESPOSTA AUTOMÁTICA]: Atendimento não reconhecido via texto. Seu tempo limite para contestação de R$ 3.890,00 sem encargos expira em 10 minutos. Acesse imediatamente: https://banco-seguro-cancelamento.xyz',
      timestamp: '10:48',
      linkPreview: {
        url: 'https://banco-seguro-cancelamento.xyz/seguranca/cancelamento',
        displayUrl: 'banco-seguro-cancelamento.xyz',
        title: 'Central de Segurança — Cancelamento de Compra',
        destinationPageId: 'page_fake_bank_cancel'
      },
      choices: [
        {
          id: 'c_reply_open_link',
          text: '🌐 Acessar o link para não perder o prazo dos 10 minutos',
          type: 'insecure',
          nextNodeId: 'node_in_browser'
        },
        {
          id: 'c_reply_ignore',
          text: '🛑 Essa pressão de tempo é típica de golpe. Vou ignorar e ligar no meu banco pelo cartão.',
          type: 'safe',
          nextNodeId: 'node_safe_call_card'
        }
      ]
    },

    // Nós de Desfecho
    node_critical_bank_data: {
      id: 'node_critical_bank_data',
      sender: 'system',
      text: 'Você digitou seu CPF e sua senha bancária em uma página falsa. Seus dados de acesso foram capturados pelo fraudador na simulação.',
      timestamp: '10:50',
      isCriticalAction: true
    },

    node_safe_open_app: {
      id: 'node_safe_open_app',
      sender: 'system',
      text: 'Você abriu o aplicativo oficial do seu banco no aparelho e verificou seu extrato. Nenhuma compra de R$ 3.890 havia sido feita! Você percebeu a tentativa de golpe e se protegeu.',
      timestamp: '10:49',
      isSafeEnding: true
    },

    node_safe_call_card: {
      id: 'node_safe_call_card',
      sender: 'system',
      text: 'Você pegou seu cartão físico e ligou no telefone oficial impresso no verso. A atendente confirmou que seu cartão está seguro e que o SMS recebido era uma tentativa de fraude. Parabéns pela atitude exemplar!',
      timestamp: '10:50',
      isSafeEnding: true
    }
  }
};
