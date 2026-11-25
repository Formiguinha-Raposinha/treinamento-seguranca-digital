import { Scenario } from '../../types/cenario';

export const fakeDeliveryGiftScenario: Scenario = {
  id: 'golpe-presente-taxa-entrega',
  title: 'Golpe do Presente Surpresa (Taxa de Entrega na Maquininha)',
  category: 'Entregas & Maquininha de Cartão',
  environment: 'whatsapp',
  difficulty: 'intermediario',
  description: 'Um suposto entregador entra em contato no WhatsApp dizendo ter uma linda cesta de presente para você, mas exige o pagamento presencial de uma taxa de entrega de R$ 9,50 exclusivamente na maquininha de cartão.',
  sender: {
    name: 'EXPRESS CESTAS & PRESENTES',
    phoneNumber: '(11) 98452-9104',
    avatarUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=150&auto=format&fit=crop&q=80',
    statusText: 'Entregas Especiais • Disponível',
    institution: 'Transportadora Fictícia de Presentes'
  },
  initialNodeId: 'node_delivery_hello',
  summary: {
    scamType: 'Golpe do Falso Presente com Fraude na Maquininha de Cartão e Roubo de Biometria',
    manipulationTactics: ['reward', 'urgency', 'authority'],
    safeRouteExplanation: 'O Golpe do Presente de Aniversário explora a curiosidade e vaidade da vítima ao alegar que ela recebeu uma cesta surpresa. No momento da entrega, o falso entregador alega que "falta pagar a taxa de frete de R$ 9,50" e exige o cartão. Os criminosos usam maquininhas com o visor apagado, quebrado ou com película escura que digita R$ 9.500,00 em vez de R$ 9,50, ou aproveitam o momento para trocar o cartão da vítima por outro idêntico.',
    goldenRule: 'Presente de verdade NUNCA cobra taxa de entrega de quem recebe! Se o entregador exigir pagamento no cartão na maquininha ou pedir foto do seu rosto para "comprovar entrega", RECUSE A ENCOMENDA IMEDIATAMENTE!'
  },
  nodes: {
    node_delivery_hello: {
      id: 'node_delivery_hello',
      sender: 'opponent',
      text: '🎁 Olá! Boa tarde! Sou o Marcos da Express Cestas & Flores. Temos uma entrega muito especial de uma linda cesta de café da manhã e flores para a senhora, presente com cartão de aniversário de uma pessoa querida! Estou com o pacote na moto a caminho da sua rua. A senhora está em casa para receber?',
      timestamp: '11:10',
      riskSignals: [
        {
          id: 'sig_gift_surprise',
          title: 'Presente Surpresa de "Pessoa Querida"',
          description: 'Não revelam o nome de quem enviou de propósito, atiçando a curiosidade e o sentimento afetivo da vítima.',
          tactic: 'reward'
        }
      ],
      choices: [
        {
          id: 'c1_ask_sender',
          text: 'Que linda surpresa! Mas quem foi que me mandou esse presente?',
          type: 'neutral',
          nextNodeId: 'node_delivery_fee_request',
          explanation: 'Você perguntou quem enviou. O entregador vai usar isso para engatar a cobrança da taxa.'
        },
        {
          id: 'c1_refuse_unknown_gift',
          text: '🛑 Não estou esperando presente de ninguém e não atendo estranhos no portão. Pode devolver à loja.',
          type: 'safe',
          nextNodeId: 'node_safe_refuse_gift',
          explanation: 'Excelente prudência! Recusar encomendas inesperadas de desconhecidos é a proteção mais segura.'
        }
      ]
    },

    node_delivery_fee_request: {
      id: 'node_delivery_fee_request',
      sender: 'opponent',
      text: 'Marcos Entregador: "No cartão vem escrito \'com carinho de quem te ama muito\', é uma surpresa linda! Mas tem só um detalhe simples: o remetente esqueceu de pagar a taxa de frete da transportadora de R$ 9,50. O aplicativo da empresa só libera a entrega mediante o pagamento dessa taxa de R$ 9,50 no cartão de débito ou crédito na minha maquininha. Não aceitamos dinheiro vivo por segurança da empresa. A senhora pode descer no portão com seu cartão para receber o presente?"',
      timestamp: '11:12',
      riskSignals: [
        {
          id: 'sig_delivery_fee_card_only',
          title: 'Exigência de Taxa Exclusivamente no Cartão',
          description: 'A recusa de dinheiro vivo e a exigência de cartão é o sinal máximo do golpe: eles precisam que você insira o cartão na maquininha adulterada.',
          tactic: 'urgency'
        },
        {
          id: 'sig_hidden_sender',
          title: 'Recusa em Informar o Remetente Real',
          description: 'Usam frases genéricas como "de quem te ama muito" para não dizer quem mandou.',
          tactic: 'affection'
        }
      ],
      choices: [
        {
          id: 'c2_pay_fee_card',
          text: '🚨 [Pegar o cartão de crédito e ir ao portão pagar os R$ 9,50 na maquininha do rapaz]',
          type: 'insecure',
          nextNodeId: 'node_critical_pos_fraud',
          explanation: 'Perigo extremo! A maquininha do golpista tem o visor alterado: você digita a senha achando que é R$ 9,50, mas ele passa R$ 9.500,00 ou troca seu cartão por um falso.'
        },
        {
          id: 'c2_refuse_delivery_fee',
          text: '🛑 Presente não se cobra taxa de entrega! Não vou passar meu cartão em maquininha nenhuma. Pode levar de volta!',
          type: 'safe',
          nextNodeId: 'node_safe_refuse_fee',
          explanation: 'Brilhante! Você aplicou a Regra de Ouro: presente legítimo nunca cobra taxa de entrega na porta de casa.'
        },
        {
          id: 'c2_offer_cash',
          text: 'Eu não passo cartão no portão. Se for o caso, eu tenho R$ 10,00 em dinheiro trocado em mãos.',
          type: 'neutral',
          nextNodeId: 'node_delivery_selfie_request',
          explanation: 'Você recusou o cartão, mas continuou negociando com o golpista no portão.'
        }
      ]
    },

    node_delivery_selfie_request: {
      id: 'node_delivery_selfie_request',
      sender: 'opponent',
      text: 'Marcos Entregador: "Olha senhora, nosso aplicativo não aceita dinheiro de jeito nenhum! Mas para a senhora não perder a cesta e as flores, eu posso pagar os R$ 9,50 do meu próprio bolso aqui na maquininha! Em troca, a senhora só precisa deixar eu tirar uma foto do seu rosto bem nítida segurando seu RG ou documento para eu anexar no app da empresa e comprovar que eu entreguei. É só uma selfie rápida para o aplicativo!"',
      timestamp: '11:15',
      riskSignals: [
        {
          id: 'sig_selfie_delivery_theft',
          title: 'Pedido de Foto do Rosto (Selfie) no Portão',
          description: 'Entregadores NUNCA precisam de selfie com documento para entregar presentes. Essa foto é usada para aprovar empréstimos faciais e abrir contas bancárias!',
          tactic: 'authority'
        }
      ],
      choices: [
        {
          id: 'c3_allow_selfie',
          text: '🚨 [Aceitar tirar a foto do rosto segurando o documento para receber o presente]',
          type: 'insecure',
          nextNodeId: 'node_critical_selfie_theft',
          explanation: 'Você entregou sua biometria facial para criminosos. Com a foto do seu rosto e documento, eles solicitam empréstimos imediatos no seu nome.'
        },
        {
          id: 'c3_slam_door',
          text: '🛑 Ninguém vai tirar foto do meu rosto nem cobrar taxa! Não quero nada, saia da minha calçada!',
          type: 'safe',
          nextNodeId: 'node_safe_refuse_gift',
          explanation: 'Perfeito! Você fechou o portão, recusou a selfie e protegeu sua identidade e suas finanças.'
        }
      ]
    },

    node_safe_refuse_gift: {
      id: 'node_safe_refuse_gift',
      sender: 'system',
      text: 'Você recusou a entrega suspeita e não passou nenhum cartão nem permitiu fotos! Mais tarde, você checou com seus familiares e descobriu que ninguém havia enviado presente algum. Você evitou um prejuízo de milhares de reais!',
      timestamp: '11:16',
      isSafeEnding: true
    },

    node_safe_refuse_fee: {
      id: 'node_safe_refuse_fee',
      sender: 'system',
      text: 'Sensacional! Você lembrou que presente de verdade NUNCA tem taxa de entrega. O golpista foi embora e seu dinheiro e cartão continuaram 100% protegidos.',
      timestamp: '11:16',
      isSafeEnding: true
    },

    node_critical_pos_fraud: {
      id: 'node_critical_pos_fraud',
      sender: 'system',
      text: 'Você inseriu o cartão na maquininha do entregador. O visor estava danificado e a cobrança real passada foi de R$ 4.890,00, além do golpista ter trocado seu cartão por outro idêntico sem você perceber.',
      timestamp: '11:17',
      isCriticalAction: true
    },

    node_critical_selfie_theft: {
      id: 'node_critical_selfie_theft',
      sender: 'system',
      text: 'Você permitiu que tirassem uma foto do seu rosto e documento. Os criminosos usaram sua imagem em aplicativos bancários para contratar um empréstimo consignado não autorizado.',
      timestamp: '11:18',
      isCriticalAction: true
    }
  }
};
