import { Scenario } from '../../types/cenario';

export const fakeRelativeScenario: Scenario = {
  id: 'falso-familiar-novo-numero',
  title: 'Golpe do Falso Familiar (Novo Número)',
  category: 'WhatsApp & Mensagens',
  environment: 'whatsapp',
  difficulty: 'iniciante',
  description: 'Você recebe uma mensagem no WhatsApp de um número desconhecido usando a foto de um familiar próximo dizendo que trocou de aparelho.',
  sender: {
    name: '+55 (65) 99841-3320',
    phoneNumber: 'Número não salvo na agenda',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    statusText: 'online',
    institution: 'Contato Desconhecido'
  },
  initialNodeId: 'node_1',
  summary: {
    scamType: 'Golpe do Falso Familiar / Engenharia Social Afetiva',
    manipulationTactics: ['affection', 'urgency', 'isolation'],
    safeRouteExplanation: 'Sempre que alguém conhecido pedir dinheiro de um número novo, ligue no número antigo que já estava gravado na sua agenda ou faça uma chamada de vídeo antes de qualquer ação.',
    goldenRule: 'Troca de número + Pedido de Dinheiro com Urgência = 99% de chance de Golpe. Pare e confirme pelo canal oficial.'
  },
  nodes: {
    node_1: {
      id: 'node_1',
      sender: 'opponent',
      text: 'Oi mãe, tudo bem? Salva meu número novo por favor! O meu outro celular caiu no chão, quebrou a tela toda e tive que pegar esse aparelho temporário.',
      timestamp: '14:32',
      riskSignals: [
        {
          id: 'signal_new_number',
          title: 'Número Desconhecido',
          description: 'A pessoa alega ser da família, mas está enviando mensagem de um número não cadastrado na sua agenda.',
          tactic: 'affection'
        }
      ],
      choices: [
        {
          id: 'c1_reply_normal',
          text: 'Oi filho! Que susto... Tudo bem com você? Já vou salvar aqui.',
          type: 'neutral',
          nextNodeId: 'node_2',
          explanation: 'Você aceitou a conversa sem verificar a identidade de quem estava mandando a mensagem.'
        },
        {
          id: 'c1_ask_name',
          text: 'Quem está falando? Qual dos meus filhos é você?',
          type: 'neutral',
          nextNodeId: 'node_verify_name',
          explanation: 'Fazer perguntas para checar a identidade é um bom início de cautela.'
        },
        {
          id: 'c1_call_old_number',
          text: '📞 Vou ligar agora no seu número antigo de sempre para confirmar se é você mesmo.',
          type: 'verify_official',
          nextNodeId: 'node_safe_call_old',
          explanation: 'Excelente! Usar um canal que você já tinha previamente salvo é a atitude mais segura possível.'
        }
      ]
    },

    node_verify_name: {
      id: 'node_verify_name',
      sender: 'opponent',
      text: 'Sou eu mãe, seu filho! Não reconheceu minha foto no perfil? É que tô numa correria danada aqui no serviço hoje...',
      timestamp: '14:33',
      riskSignals: [
        {
          id: 'signal_public_photo',
          title: 'Foto de Perfil Pública',
          description: 'Qualquer pessoa na internet pode baixar uma foto pública das suas redes sociais e colocar no WhatsApp.',
          tactic: 'affection'
        }
      ],
      choices: [
        {
          id: 'c_vn_continue',
          text: 'Ah meu filho! Me desculpe. O que aconteceu?',
          type: 'neutral',
          nextNodeId: 'node_2'
        },
        {
          id: 'c_vn_demand_audio',
          text: '🎤 Me manda um áudio agora falando a data do aniversário do seu pai.',
          type: 'safe',
          nextNodeId: 'node_audio_excuse'
        }
      ]
    },

    node_audio_excuse: {
      id: 'node_audio_excuse',
      sender: 'opponent',
      text: 'Mãe, o microfone desse aparelho provisório tá quebrado, por isso tô só digitando! Por favor, confia em mim, preciso muito da sua ajuda urgente agora.',
      timestamp: '14:34',
      riskSignals: [
        {
          id: 'signal_excuse_voice',
          title: 'Desculpa para não mandar áudio',
          description: 'Golpistas sempre inventam que o microfone está quebrado ou que estão numa reunião para não revelar a voz verdadeira.',
          tactic: 'urgency'
        }
      ],
      choices: [
        {
          id: 'c_ae_give_in',
          text: 'Tá bom, me conta qual é o problema.',
          type: 'neutral',
          nextNodeId: 'node_2'
        },
        {
          id: 'c_ae_block',
          text: '🚫 Se não mandar áudio ou não atender ligação, não falo mais e vou te bloquear.',
          type: 'safe',
          nextNodeId: 'node_safe_block'
        }
      ]
    },

    node_2: {
      id: 'node_2',
      sender: 'opponent',
      text: 'Mãe, estou com um problema sério. Preciso pagar uma conta de R$ 1.250,00 da assistência técnica urgente até as 15h senão vou perder o aparelho, e meu app do banco não está habilitado neste telefone novo.',
      timestamp: '14:35',
      riskSignals: [
        {
          id: 'signal_urgency_pressure',
          title: 'Pressão de Tempo e Urgência',
          description: 'O pedido estabelece um limite de tempo muito curto para você agir sem conseguir pensar ou consultar outras pessoas.',
          tactic: 'urgency'
        },
        {
          id: 'signal_financial_request',
          title: 'Pedido Financeiro Inesperado',
          description: 'Solicitação de dinheiro através de número recém-aparecido.',
          tactic: 'urgency'
        }
      ],
      choices: [
        {
          id: 'c2_pay_pix',
          text: 'Me passa a chave Pix que eu pago pra você não perder o celular.',
          type: 'insecure',
          nextNodeId: 'node_3_pix_request'
        },
        {
          id: 'c2_ask_family',
          text: 'Vou ligar para o seu pai/irmão para ver se eles conseguem te ajudar.',
          type: 'safe',
          nextNodeId: 'node_safe_call_family'
        },
        {
          id: 'c2_refuse_message_money',
          text: 'Não faço pagamento para ninguém por mensagem. Quando você chegar em casa a gente conversa.',
          type: 'safe',
          nextNodeId: 'node_safe_refuse'
        }
      ]
    },

    node_3_pix_request: {
      id: 'node_3_pix_request',
      sender: 'opponent',
      text: 'Obrigado mãe! A chave Pix da assistência é: financeiro-suporte@pagamentorapido.net (Nome: Cleber Souza). Assim que fizer me manda o comprovante por aqui por favor!',
      timestamp: '14:36',
      riskSignals: [
        {
          id: 'signal_unknown_beneficiary',
          title: 'Chave Pix em Nome de Terceiro Desconhecido',
          description: 'O Pix está em nome de uma pessoa física ou e-mail que você nunca ouviu falar.',
          tactic: 'urgency'
        }
      ],
      choices: [
        {
          id: 'c3_confirm_fake_pix',
          text: '🚨 [Simular Envio do Pix de R$ 1.250,00]',
          type: 'insecure',
          nextNodeId: 'node_critical_failure'
        },
        {
          id: 'c3_stop_and_think',
          text: '🛑 Espera aí... Quem é Cleber Souza? Isso tá muito esquisito. Não vou transferir.',
          type: 'safe',
          nextNodeId: 'node_safe_refuse'
        }
      ]
    },

    // Nós de Desfecho
    node_critical_failure: {
      id: 'node_critical_failure',
      sender: 'system',
      text: 'Transferência Pix de R$ 1.250,00 simulada com sucesso para Cleber Souza.',
      timestamp: '14:37',
      isCriticalAction: true
    },

    node_safe_call_old: {
      id: 'node_safe_call_old',
      sender: 'system',
      text: 'Você ligou para o número antigo do seu filho. Ele atendeu normalmente no trabalho, confirmou que NÃO trocou de número e avisou que era uma tentativa de golpe.',
      timestamp: '14:35',
      isSafeEnding: true
    },

    node_safe_block: {
      id: 'node_safe_block',
      sender: 'system',
      text: 'Você se recusou a agir sob pressão e bloqueou o número suspeito. Você protegeu seu dinheiro e evitou o golpe com segurança!',
      timestamp: '14:36',
      isSafeEnding: true
    },

    node_safe_call_family: {
      id: 'node_safe_call_family',
      sender: 'system',
      text: 'Você consultou outro familiar de confiança que te alertou a tempo sobre o golpe do novo número.',
      timestamp: '14:37',
      isSafeEnding: true
    },

    node_safe_refuse: {
      id: 'node_safe_refuse',
      sender: 'system',
      text: 'Você manteve a calma, não cedeu à pressa e se recusou a transferir valores por mensagem. Decisão perfeita!',
      timestamp: '14:38',
      isSafeEnding: true
    }
  }
};
