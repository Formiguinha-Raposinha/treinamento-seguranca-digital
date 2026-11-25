import { Scenario } from '../../types/cenario';

export const fakeCallCenterScenario: Scenario = {
  id: 'falsa-central-0800',
  title: 'Golpe da Falsa Central de Segurança (Falso 0800 & Ligação)',
  category: 'Telefone & Falsas Centrais',
  environment: 'phone',
  difficulty: 'avancado',
  description: 'Você recebe um SMS sobre uma suposta transferência PIX de R$ 4.750,00 com um número 0800 falso, simulando uma ligação com falso atendente bancário.',
  sender: {
    name: 'CENTRAL 0800 ANTIFRAUDE',
    phoneNumber: 'SMS: 29402 | 0800 878 9120',
    avatarUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=150&auto=format&fit=crop&q=80',
    statusText: 'Central Telefônica Fictícia',
    institution: 'Central de Atendimento Fictícia'
  },
  initialNodeId: 'node_sms_alert',
  summary: {
    scamType: 'Golpe da Falsa Central Telefônica / Engenharia Social por Telefone (Vishing)',
    manipulationTactics: ['fear', 'authority', 'urgency'],
    safeRouteExplanation: 'Bancos e instituições financeiras NUNCA pedem transferências de dinheiro, "Pix de Blindagem", nem solicitam senhas ou código de segurança por telefone. Se receber alerta de compra ou Pix com 0800, desligue na hora e consulte o extrato no app oficial do banco ou ligue para o telefone impresso no verso do seu cartão físico.',
    goldenRule: 'Recebeu SMS mandando ligar para 0800? NUNCA ligue no número do SMS! Se ligarem, DESLIGUE! Bancos nunca pedem senhas nem Pix de segurança por telefone.'
  },
  nodes: {
    node_sms_alert: {
      id: 'node_sms_alert',
      sender: 'opponent',
      text: '[NOTIFICAÇÃO BANCO]: Transferência PIX de R$ 4.750,00 EM ANÁLISE para Lojas Americanas em 15/11 às 14:10. Caso NÃO reconheça esta operação, ligue AGORA para nossa Central Antifraude: 0800 878 9120 para bloqueio preventivo imediato.',
      timestamp: '14:10',
      riskSignals: [
        {
          id: 'sig_urgent_alert',
          title: 'Alerta com Valor Alto para Assustar',
          description: 'Os golpistas colocam um valor muito alto para provocar pânico e fazer a vítima agir sem pensar.',
          tactic: 'fear'
        },
        {
          id: 'sig_fake_0800',
          title: 'Falso Número 0800',
          description: 'Números 0800 podem ser contratados por criminosos para dar uma falsa sensação de legitimidade e canal oficial.',
          tactic: 'authority'
        }
      ],
      choices: [
        {
          id: 'c1_call_0800',
          text: '📞 Ligar para o 0800 878 9120 que veio na mensagem para cancelar a compra',
          type: 'insecure',
          nextNodeId: 'node_call_connected',
          explanation: 'Você ligou para o número fornecido na própria mensagem suspeita. Esse número cai direto na central dos golpistas.'
        },
        {
          id: 'c1_check_app',
          text: '📱 Não ligar para o 0800. Abrir o aplicativo oficial do meu banco no celular para checar a fatura',
          type: 'safe',
          nextNodeId: 'node_safe_app',
          explanation: 'Excelente! Você verificou por conta própria no canal oficial e viu que a compra não existia.'
        },
        {
          id: 'c1_call_card_back',
          text: '💳 Não ligar para o 0800 da mensagem. Ligar no telefone impresso no verso do meu cartão físico',
          type: 'verify_official',
          nextNodeId: 'node_safe_card_back',
          explanation: 'Atitude perfeita! O canal mais seguro é sempre o telefone impresso fisicamente no verso do seu cartão.'
        }
      ]
    },

    node_call_connected: {
      id: 'node_call_connected',
      sender: 'opponent',
      text: '🎶 [Música de espera da URA... "Bem-vindo à Central de Segurança Bancária. Para cancelamento de compras suspeitas, aguarde..."] \n\n👨‍💼 Atendente Rodrigo: "Boa tarde, sou o especialista Rodrigo da Central de Prevenção Antifraude. Confirmamos a tentativa de transferência PIX de R$ 4.750,00 no seu aplicativo para Lojas Americanas. Para cancelarmos imediatamente antes de compensar, preciso que a senhora confirme sua agência, conta e sua senha bancária de 6 dígitos."',
      timestamp: '14:12',
      riskSignals: [
        {
          id: 'sig_ask_password',
          title: 'Pedido de Senha por Telefone',
          description: 'Nenhum banco legítimo pede a senha de 4 ou 6 dígitos da sua conta ou cartão por telefone!',
          tactic: 'authority'
        }
      ],
      choices: [
        {
          id: 'c2_give_password',
          text: '🚨 [Passar a agência, conta e senha de 6 dígitos para o atendente cancelar]',
          type: 'insecure',
          nextNodeId: 'node_critical_password',
          explanation: 'Atenção extrema! Ao passar a senha por telefone, os golpistas conseguem acesso para esvaziar a conta.'
        },
        {
          id: 'c2_refuse_password',
          text: 'Não passo senha por telefone! Não tem outra forma de cancelar?',
          type: 'neutral',
          nextNodeId: 'node_fake_shield_pix',
          explanation: 'Você recusou passar a senha, mas continuou na linha com os criminosos.'
        },
        {
          id: 'c2_hangup',
          text: '🛑 Banco nenhum pede senha por telefone! Vou desligar e falar com o meu gerente na agência.',
          type: 'safe',
          nextNodeId: 'node_safe_hangup',
          explanation: 'Parabéns! Você reconheceu o golpe da falsa central e desligou imediatamente.'
        }
      ]
    },

    node_fake_shield_pix: {
      id: 'node_fake_shield_pix',
      sender: 'opponent',
      text: '👨‍💼 Atendente Rodrigo: "Entendo perfeitamente sua cautela, senhora. Então para a sua segurança, o nosso sistema ativou o protocolo do Mecanismo de Blindagem da Conta. A senhora precisa fazer um Pix temporário de R$ 1.500 para a nossa Conta-Cofre do Banco Central (Chave Pix: protecao-blindagem@custodia-bcb.net). Assim que o dinheiro cair na blindagem, o sistema cancela a transferência de R$ 4.750 e devolve seu dinheiro em 5 minutos!"',
      timestamp: '14:14',
      riskSignals: [
        {
          id: 'sig_fake_shield',
          title: 'Invenção de "Conta Segura" ou "Pix de Blindagem"',
          description: 'Não existe conta de blindagem nem conta-cofre de banco! Toda vez que mandam fazer Pix para "proteger o dinheiro", é golpe.',
          tactic: 'fear'
        }
      ],
      choices: [
        {
          id: 'c3_do_shield_pix',
          text: '🚨 [Fazer o Pix de R$ 1.500,00 para a "Conta-Cofre" para proteger o saldo]',
          type: 'insecure',
          nextNodeId: 'node_critical_pix_failure',
          explanation: 'Você enviou o dinheiro para a conta de um golpista acreditando que era uma blindagem de segurança.'
        },
        {
          id: 'c3_refuse_shield',
          text: '🛑 Não existe Pix de blindagem! Isso é golpe e vou desligar a chamada agora.',
          type: 'safe',
          nextNodeId: 'node_safe_refuse_pix',
          explanation: 'Perfeito! Você desmascarou o famoso golpe da Falsa Central e preservou o seu dinheiro.'
        }
      ]
    },

    node_safe_app: {
      id: 'node_safe_app',
      sender: 'system',
      text: 'Você abriu o aplicativo oficial do seu banco no celular com calma, consultou o extrato de compras e confirmou que a cobrança de R$ 4.750,00 nunca existiu. Você evitou cair no falso 0800!',
      timestamp: '14:11',
      isSafeEnding: true
    },

    node_safe_card_back: {
      id: 'node_safe_card_back',
      sender: 'system',
      text: 'Você pegou seu cartão físico, ligou no número oficial gravado no verso e o atendente legítimo do seu banco confirmou que seu cartão está seguro e que a mensagem de 0800 era uma fraude!',
      timestamp: '14:13',
      isSafeEnding: true
    },

    node_safe_hangup: {
      id: 'node_safe_hangup',
      sender: 'system',
      text: 'Você manteve a calma, lembrou que bancos nunca pedem senha por telefone e desligou a ligação imediatamente, salvando seus dados!',
      timestamp: '14:15',
      isSafeEnding: true
    },

    node_safe_refuse_pix: {
      id: 'node_safe_refuse_pix',
      sender: 'system',
      text: 'Você desmascarou a mentira da "Conta de Blindagem", não realizou nenhuma transferência e encerrou a chamada com segurança.',
      timestamp: '14:16',
      isSafeEnding: true
    },

    node_critical_password: {
      id: 'node_critical_password',
      sender: 'system',
      text: 'Você forneceu seus dados de acesso bancário e senha eletrônica em uma ligação não verificada. Os golpistas conseguiram acesso à conta.',
      timestamp: '14:13',
      isCriticalAction: true
    },

    node_critical_pix_failure: {
      id: 'node_critical_pix_failure',
      sender: 'system',
      text: 'Você realizou um Pix de R$ 1.500,00 para a falsa "Conta de Blindagem", transferindo seu dinheiro diretamente para os criminosos.',
      timestamp: '14:15',
      isCriticalAction: true
    }
  }
};
