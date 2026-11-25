import { Scenario } from '../../types/cenario';

export const fakeMotoboyScenario: Scenario = {
  id: 'golpe-falso-motoboy',
  title: 'Golpe do Falso Motoboy (Cartão Clonado & Retirada em Casa)',
  category: 'Cartão Clonado & Falso Motoboy',
  environment: 'phone',
  difficulty: 'avancado',
  description: 'Você recebe uma ligação telefônica de um suposto agente de segurança bancária dizendo que seu cartão foi clonado e que um motoboy credenciado do banco irá até sua casa recolher o cartão cortado ao meio.',
  sender: {
    name: 'SEGURANÇA CARTÕES & FRAUDES',
    phoneNumber: '0800 729 0722 (Chamada Externa)',
    avatarUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=150&auto=format&fit=crop&q=80',
    statusText: 'Chamada Telefônica de Fraude',
    institution: 'Setor de Cartões Fictício'
  },
  initialNodeId: 'node_motoboy_call_1',
  summary: {
    scamType: 'Golpe do Falso Motoboy com Engenharia Social e Retirada Presencial de Chip',
    manipulationTactics: ['fear', 'authority', 'urgency'],
    safeRouteExplanation: 'Nenhum banco ou instituição financeira envia motoboys, policiais ou funcionários à residência de clientes para recolher cartões bancários, mesmo que aleguem que o cartão está cancelado ou cortado ao meio. Ao cortar o cartão ao meio com tesoura, a maioria das pessoas corta apenas a tarja plástica, deixando o chip eletrônico dourado perfeitamente intacto, o que permite aos criminosos realizar compras e saques.',
    goldenRule: 'O banco disse que vai mandar motoboy buscar seu cartão? DESLIGUE O TELEFONE NA HORA! Bancos nunca enviam motoboy para recolher cartões. Cartão cancelado você mesmo destrói o chip e joga no lixo.'
  },
  nodes: {
    node_motoboy_call_1: {
      id: 'node_motoboy_call_1',
      sender: 'opponent',
      text: '👨‍💼 Atendente André (Setor de Cartões): "Alô, boa tarde! Sou do Departamento de Prevenção a Fraudes do seu cartão de crédito. Detectamos uma tentativa de compra suspeita de R$ 3.850,00 nas Casas Bahia em São Paulo no seu cartão com final 7140. A senhora reconhece esta compra ou está com o cartão em mãos?"',
      timestamp: '15:20',
      riskSignals: [
        {
          id: 'sig_cloned_fear',
          title: 'Medo de Compra em Outra Cidade',
          description: 'Os golpistas citam uma cidade distante (São Paulo ou Rio de Janeiro) para gerar sensação imediata de cartão clonado.',
          tactic: 'fear'
        },
        {
          id: 'sig_authority_tone',
          title: 'Tom Calmo e Profissional de Falsa Autoridade',
          description: 'Usam jargões bancários e simulam preocupação com a proteção das finanças da vítima.',
          tactic: 'authority'
        }
      ],
      choices: [
        {
          id: 'c1_deny_purchase',
          text: 'Não reconheço essa compra! Nunca estive em São Paulo e estou com meu cartão aqui em casa!',
          type: 'neutral',
          nextNodeId: 'node_motoboy_ask_pin',
          explanation: 'Você informou que não reconhece a compra. O golpista agora vai avançar para a armadilha do motoboy.'
        },
        {
          id: 'c1_hangup_immediately',
          text: '🛑 Banco nenhum liga assim! Vou desligar e ligar no telefone que está atrás do meu cartão físico.',
          type: 'safe',
          nextNodeId: 'node_safe_hangup_motoboy',
          explanation: 'Perfeito! Você reconheceu a tentativa de golpe telefônico e encerrou a chamada imediatamente.'
        }
      ]
    },

    node_motoboy_ask_pin: {
      id: 'node_motoboy_ask_pin',
      sender: 'opponent',
      text: '👨‍💼 Atendente André: "Perfeito, senhora. Já bloqueamos preventivamente o seu cartão para compras. Agora, para gerarmos o laudo de contestação para a Polícia Civil e cancelarmos a tarja, a senhora precisa digitar sua senha de 4 dígitos no teclado do telefone. Logo após, a senhora deve cortar o cartão ao meio com uma tesoura, colocá-lo num envelope lacrado e um motoboy credenciado do banco passará em sua residência em 30 minutos com crachá para recolher o cartão periciado."',
      timestamp: '15:22',
      riskSignals: [
        {
          id: 'sig_ask_pin_phone',
          title: 'Digitação de Senha no Teclado Telefônico',
          description: 'Os golpistas usam aparelhos que capturam os tons sonoros (DTMF) do teclado quando a vítima digita a senha.',
          tactic: 'authority'
        },
        {
          id: 'sig_send_motoboy',
          title: 'Envio de Motoboy para Recolher Cartão',
          description: 'Nenhum banco envia motoboy à casa do cliente. Essa é a assinatura exclusiva do Golpe do Falso Motoboy.',
          tactic: 'urgency'
        },
        {
          id: 'sig_cut_in_half_lie',
          title: 'Falso Pedido de "Cortar ao Meio"',
          description: 'Eles mandam cortar ao meio para a vítima achar que o cartão foi inutilizado, mas o chip dourado continua funcionando perfeitamente.',
          tactic: 'authority'
        }
      ],
      choices: [
        {
          id: 'c2_accept_motoboy',
          text: '🚨 [Digitar a senha no telefone, cortar o cartão e entregar no envelope para o motoboy do banco]',
          type: 'insecure',
          nextNodeId: 'node_critical_motoboy_deliver',
          explanation: 'Atenção extrema! Ao entregar o cartão (mesmo cortado) com o chip intacto e passar a senha, os criminosos esvaziam sua conta em minutos.'
        },
        {
          id: 'c2_refuse_motoboy',
          text: '🛑 O banco NUNCA manda motoboy buscar cartão na casa de ninguém! Vou desligar e falar com meu gerente.',
          type: 'safe',
          nextNodeId: 'node_safe_refuse_motoboy',
          explanation: 'Sensacional! Você aplicou a Regra de Ouro da Febraban contra o Golpe do Falso Motoboy e protegeu seu patrimônio.'
        },
        {
          id: 'c2_doubt_motoboy',
          text: 'Mas se o cartão já foi cortado, por que o banco precisa que o motoboy venha buscar?',
          type: 'neutral',
          nextNodeId: 'node_motoboy_insistence',
          explanation: 'Você desconfiou da retirada do cartão, mas ainda continua na linha com o criminoso.'
        }
      ]
    },

    node_motoboy_insistence: {
      id: 'node_motoboy_insistence',
      sender: 'opponent',
      text: '👨‍💼 Atendente André: "Senhora, a recolha física do cartão pelo motoboy é exigência da Perícia de Fraudes da Delegacia Especializada para a seguradora estornar os R$ 3.850,00 da sua fatura. Se a senhora não entregar o envelope lacrado para o motoboy, o banco não poderá cancelar a cobrança e o valor cairá na sua conta! Nosso motoboy Carlos já está a 10 minutos da sua rua com crachá e ordem de serviço."',
      timestamp: '15:24',
      riskSignals: [
        {
          id: 'sig_fear_police_insurance',
          title: 'Chantagem de Cobrança e Falsa Perícia',
          description: 'Ameaçam que a vítima terá que pagar a compra se não entregar o cartão ao motoboy.',
          tactic: 'fear'
        }
      ],
      choices: [
        {
          id: 'c3_surrender_motoboy',
          text: '🚨 [Ficar com medo da cobrança e aceitar entregar o cartão para o motoboy]',
          type: 'insecure',
          nextNodeId: 'node_critical_motoboy_deliver',
          explanation: 'Você cedeu à pressão do falso funcionário e entregou seu cartão bancário aos criminosos.'
        },
        {
          id: 'c3_hangup_firm',
          text: '🛑 Isso é GOLPE! Se vier motoboy na minha casa eu chamo a polícia militar! Vou desligar agora.',
          type: 'safe',
          nextNodeId: 'node_safe_hangup_motoboy',
          explanation: 'Excelente! Você desmascarou os criminosos com coragem e firmeza, impedindo o furto do seu cartão.'
        }
      ]
    },

    node_safe_hangup_motoboy: {
      id: 'node_safe_hangup_motoboy',
      sender: 'system',
      text: 'Você desligou a ligação imediatamente e ligou no número oficial que está no verso do seu cartão físico. O banco confirmou que nunca manda motoboy e que seu cartão estava seguro!',
      timestamp: '15:25',
      isSafeEnding: true
    },

    node_safe_refuse_motoboy: {
      id: 'node_safe_refuse_motoboy',
      sender: 'system',
      text: 'Parabéns! Você lembrou que bancos NUNCA mandam motoboy recolher cartões em domicílio. Você encerrou a chamada e evitou o golpe com maestria.',
      timestamp: '15:25',
      isSafeEnding: true
    },

    node_critical_motoboy_deliver: {
      id: 'node_critical_motoboy_deliver',
      sender: 'system',
      text: 'Você digitou a senha e autorizou o motoboy a buscar o cartão. Com o chip intacto e a senha capturada, os criminosos realizaram compras e saques de alto valor.',
      timestamp: '15:26',
      isCriticalAction: true
    }
  }
};
