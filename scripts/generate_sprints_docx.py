import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import os

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_cell_borders(cell, top="CCCCCC", bottom="CCCCCC", left=None, right=None, sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    borders_xml = f'<w:tcBorders {nsdecls("w")}>'
    if top:
        borders_xml += f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{top}"/>'
    else:
        borders_xml += '<w:top w:val="none"/>'
    if bottom:
        borders_xml += f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{bottom}"/>'
    else:
        borders_xml += '<w:bottom w:val="none"/>'
    if left:
        borders_xml += f'<w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{left}"/>'
    else:
        borders_xml += '<w:left w:val="none"/>'
    if right:
        borders_xml += f'<w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{right}"/>'
    else:
        borders_xml += '<w:right w:val="none"/>'
    borders_xml += '</w:tcBorders>'
    tcPr.append(parse_xml(borders_xml))

def build_sprints_docx(output_path):
    doc = Document()

    # Define page margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Palette
    COLOR_PRIMARY = RGBColor(24, 55, 114)     # Deep Navy
    COLOR_SECONDARY = RGBColor(30, 95, 175)   # Ocean Blue
    COLOR_DARK = RGBColor(35, 40, 50)         # Charcoal text
    COLOR_MUTED = RGBColor(100, 110, 125)     # Gray text
    COLOR_SUCCESS = RGBColor(16, 124, 65)     # Green
    COLOR_WARNING = RGBColor(190, 90, 0)      # Amber

    # Document Title Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(4)
    title_p.paragraph_format.space_after = Pt(2)
    run_tag = title_p.add_run("PROJETO DE EXTENSÃO UNIVERSITÁRIA I")
    run_tag.font.name = "Arial"
    run_tag.font.size = Pt(9.5)
    run_tag.font.bold = True
    run_tag.font.color.rgb = COLOR_SECONDARY

    h1_p = doc.add_paragraph()
    h1_p.paragraph_format.space_before = Pt(2)
    h1_p.paragraph_format.space_after = Pt(4)
    run_h1 = h1_p.add_run("Plataforma Interativa de Treinamento e Assistência em Segurança Digital")
    run_h1.font.name = "Arial"
    run_h1.font.size = Pt(20)
    run_h1.font.bold = True
    run_h1.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    run_sub = sub_p.add_run("Documento Oficial de Planejamento e Detalhamento das Sprints (Sprint 1 a 10)")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = COLOR_MUTED

    # Meta card / Callout Box
    table_meta = doc.add_table(rows=1, cols=1)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_meta = table_meta.rows[0].cells[0]
    cell_meta.width = Inches(6.9)
    set_cell_background(cell_meta, "F0F4FA")
    set_cell_borders(cell_meta, top="1E5FAF", bottom="1E5FAF", left="1E5FAF", right="1E5FAF", sz="12")
    set_cell_margins(cell_meta, top=140, bottom=140, left=180, right=180)

    p_meta = cell_meta.paragraphs[0]
    p_meta.paragraph_format.space_after = Pt(2)
    r1 = p_meta.add_run("🎯 Lógica Central do Sistema: ")
    r1.bold = True
    r1.font.name = "Arial"
    r1.font.size = Pt(10)
    r1.font.color.rgb = COLOR_PRIMARY

    r2 = p_meta.add_run("RECEBI → PAREI → DESCONFIEI → VERIFIQUEI → CONFIRMEI → AJA\n")
    r2.bold = True
    r2.font.name = "Arial"
    r2.font.size = Pt(10)
    r2.font.color.rgb = COLOR_SUCCESS

    r3 = p_meta.add_run("• Público Prioritário: Pessoas idosas (com foco pleno em acessibilidade multimodal, áudio, linguagem simples e autonomia).\n• Metodologia Pedagógica: Vivência prática, Erro Seguro ('Susto Seguro' acolhedor) e transferência de competências de verificação.\n• Arquitetura Técnica: PWA (Progressive Web App) desenvolvido em React 18, TypeScript, Tailwind CSS e Web Speech API.")
    r3.font.name = "Arial"
    r3.font.size = Pt(9.5)
    r3.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1: Roadmap Overview
    h2_road = doc.add_paragraph()
    h2_road.paragraph_format.space_before = Pt(12)
    h2_road.paragraph_format.space_after = Pt(6)
    r_road = h2_road.add_run("1. Visão Geral do Roadmap de Sprints")
    r_road.font.name = "Arial"
    r_road.font.size = Pt(14)
    r_road.font.bold = True
    r_road.font.color.rgb = COLOR_PRIMARY

    # Overview Table
    sprints_summary_data = [
        ("Sprint 1", "Primeira Simulação & Interface de Mensagens", "🟢 Concluído", "Fundação do projeto, chat estilo WhatsApp com número desconhecido, cenário Falso Familiar, acessibilidade por áudio (TTS) e botões grandes."),
        ("Sprint 2", "Golpe Interativo (Links & Páginas Web Falsas)", "🟢 Concluído", "Navegação em links recebidos no chat, simulação de site falso com barra de URL suspeita, formulário/Pix fictício seguro."),
        ("Sprint 3", "Mecanismo do Erro Seguro & Aprendizagem (MVP)", "⚪ Próxima (MVP)", "Tela '🚨 PARE! Simulação de Golpe', acolhimento empático imediato, Raio-X dos sinais de risco, desconstrução dos gatilhos e rota segura."),
        ("Sprint 4", "Ensinar a Verificar Antes de Agir", "⚪ Não Iniciado", "Habilidades transferíveis: inspeção de links/domínios, busca de canais oficiais, telefone do verso do cartão e confirmação de identidade."),
        ("Sprint 5", "Inclusão e Acessibilidade Multimodal (DOSVOX / NVDA / Pessoas Cegas)", "⚪ Em Planejamento", "Narração em voz alta de 100% dos fluxos, suporte assistivo para pessoas cegas (DOSVOX, NVDA, TalkBack), navegação sonora por teclado numérico e alto contraste WCAG AAA."),
        ("Sprint 6", "Assistente Consultivo ('Estou em Dúvida')", "⚪ Não Iniciado", "Área de apoio para mensagens reais do cotidiano, relato por texto/áudio, classificação de risco (🟢🟡🔴) e orientações preventivas."),
        ("Sprint 7", "Aprendizagem Personalizada e Perfil", "⚪ Não Iniciado", "Painel 'Meu Nível de Segurança', mapeamento de matriz de competências e algoritmo de recomendação de treinos sob medida."),
        ("Sprint 8", "Hiperlocalização de Cenários", "⚪ Não Iniciado", "Treinamentos contextualizados com a realidade regional (concessionárias locais de energia/água e golpes locais reportados)."),
        ("Sprint 9", "Estrutura de Contas e Aplicação Completa", "⚪ Não Iniciado", "Cadastro simplificado e acessível sem barreiras, persistência de progresso em nuvem e sincronização de preferências do usuário."),
        ("Sprint 10", "Painel Familiar e Rede de Apoio (Futuro)", "⚪ Futuro", "Acompanhamento familiar com autorização explícita, visualização de áreas de atenção e dicas pedagógicas para apoio à autonomia.")
    ]

    table_sum = doc.add_table(rows=len(sprints_summary_data) + 1, cols=4)
    table_sum.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths = [Inches(1.0), Inches(2.2), Inches(1.1), Inches(2.6)]

    # Headers
    headers = ["Sprint", "Foco Principal", "Status", "Escopo Resumido"]
    for i, h_text in enumerate(headers):
        cell = table_sum.rows[0].cells[i]
        cell.width = col_widths[i]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=120, bottom=120, left=100, right=100)
        set_cell_borders(cell, top="1E3A8A", bottom="1E3A8A", left="1E3A8A", right="1E3A8A")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i in [0, 2] else WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h_text)
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    # Rows
    for row_idx, data in enumerate(sprints_summary_data, start=1):
        bg = "FFFFFF" if row_idx % 2 != 0 else "F8FAFC"
        for col_idx, text in enumerate(data):
            cell = table_sum.rows[row_idx].cells[col_idx]
            cell.width = col_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=90, bottom=90, left=100, right=100)
            set_cell_borders(cell, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = cell.paragraphs[0]
            if col_idx in [0, 2]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(text)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_PRIMARY
            elif col_idx == 2:
                r.font.bold = True
                if "Concluído" in text:
                    r.font.color.rgb = COLOR_SUCCESS
                elif "Próxima" in text:
                    r.font.color.rgb = COLOR_WARNING
                else:
                    r.font.color.rgb = COLOR_MUTED
            else:
                r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Section 2: Detailed Sprints
    h2_detail = doc.add_paragraph()
    h2_detail.paragraph_format.space_before = Pt(16)
    h2_detail.paragraph_format.space_after = Pt(6)
    r_detail = h2_detail.add_run("2. Detalhamento Técnico e Funcional de Cada Sprint")
    r_detail.font.name = "Arial"
    r_detail.font.size = Pt(14)
    r_detail.font.bold = True
    r_detail.font.color.rgb = COLOR_PRIMARY

    # Full data for each sprint
    sprints_full = [
        {
            "id": "Sprint 1",
            "name": "Primeira Simulação e Interface de Mensagens",
            "status": "🟢 Concluído",
            "objetivo": "Construir a fundação tecnológica da aplicação e viabilizar a primeira experiência de simulação conversacional (estilo WhatsApp) com o cenário do 'Falso Familiar', suportado por recursos nativos de acessibilidade (leitura em voz alta e fontes ampliadas).",
            "historias": [
                ("US01", "Iniciar uma simulação", "🔴 Obrigatório", "Permite que o usuário selecione e inicie uma prática a partir do catálogo inicial."),
                ("US02", "Visualizar conversa simulada", "🔴 Obrigatório", "Interface fidedigna de aplicativo de mensagens (WhatsApp), com balões de conversa, scroll e avatar."),
                ("US03", "Interagir com a conversa", "🔴 Obrigatório", "Painel de tomada de decisão com opções em botões grandes e ramificações da história."),
                ("US04", "Vivenciar um golpe realista", "🔴 Obrigatório", "Roteiro verossímil da troca de número pelo filho, solicitação urgente de transferência bancária."),
                ("US19/US21", "Acessibilidade por Áudio e Botões", "🔴 Obrigatório", "Narração em voz alta de todas as mensagens (TTS pt-BR), barra de fontes em 3 níveis e alto contraste.")
            ],
            "o_que_sera_feito": [
                "Configuração da stack React 18, TypeScript, Vite e Tailwind CSS.",
                "Criação dos tipos de dados de cenários (Scenario, MessageNode, UserChoice, RiskSignal, ManipulationTactic).",
                "Desenvolvimento da interface de chat com cabeçalho exibindo número puro desconhecido (+55 65 99841-3320) para máxima fidelidade ao golpe real.",
                "Desenvolvimento do Painel de Decisões acessível e motor de estados do diálogo.",
                "Criação do serviço de Text-to-Speech (audioService.ts) em português brasileiro acolhedor e pausado.",
                "Modais educativos preliminares de alerta seguro e reforço positivo ao identificar a fraude."
            ],
            "casos_de_uso": [
                "Usuário abre a plataforma, seleciona 'Golpe do Falso Familiar' e ouve a mensagem introdutória.",
                "Usuário visualiza a mensagem suspeita vinda de um número desconhecido e escolhe como responder.",
                "Ao escolher responder ou questionar, o diálogo avança realisticamente.",
                "Usuário altera tamanho da fonte ou ativa alto contraste para melhor legibilidade a qualquer momento."
            ],
            "criterios_aceite": [
                "Aplicação compila sem erros de tipagem com TypeScript em modo estrito.",
                "O usuário consegue vivenciar a conversa completa, interagir e acionar os recursos de áudio e acessibilidade."
            ]
        },
        {
            "id": "Sprint 2",
            "name": "Golpe Interativo — Links, Navegador Simulado e Ações de Risco",
            "status": "🟢 Concluído",
            "objetivo": "Expandir o simulador para além do aplicativo de mensagens, permitindo que o usuário clique em links suspeitos recebidos, visualize páginas web falsas em um navegador simulado interno e execute ações de risco fictícias (como preencher dados ou tentar fazer um Pix falso) de forma 100% segura.",
            "historias": [
                ("US06", "Acessar link recebido na simulação", "🔴 Obrigatório", "O usuário clica em links contidos na mensagem e é conduzido para uma página simulada sem sair do app."),
                ("US07", "Visualizar página web simulada", "🔴 Obrigatório", "Interface que imita um navegador web móvel, com barra de endereços exibindo domínios suspeitos (ex: banco-seguro-login.xyz)."),
                ("US08", "Tomar decisão dentro do fluxo web", "🔴 Obrigatório", "O usuário decide se preenche seus dados, fecha a página, clica em botões ou retorna ao aplicativo seguro."),
                ("US09", "Realizar ação de risco simulada", "🔴 Obrigatório", "Simulação de envio de formulário com dados confidenciais ou tela de confirmação de Pix fictício.")
            ],
            "o_que_sera_feito": [
                "Criação do componente WebBrowserContainer: navegador interno simulado com barra de URL customizada, cadeado falso ou ausente, botão de recarregar e voltar.",
                "Implementação do Cenário 2 (ex: Falso Aviso de Bloqueio de Conta Bancária / Falsa Notificação dos Correios sobre Taxa de Entrega Pendente).",
                "Renderização de links clicáveis com pré-visualização realista dentro dos balões de mensagem do chat.",
                "Desenvolvimento de telas fictícias de login bancário ou rastreio de encomenda, com logotipos imitados e campos de entrada simplificados.",
                "Desenvolvimento da tela de Pix Simulado com chave, valor e botão 'Confirmar Pagamento'.",
                "Mecanismo de interceptação de segurança no momento do clique de envio/pagamento para proteger o usuário e preparar o gatilho pedagógico."
            ],
            "casos_de_uso": [
                "Caso 1: O usuário recebe SMS/WhatsApp de 'Seu Banco': 'Sua conta será bloqueada hoje! Atualize seu cadastro: https://banco-seguro-login.xyz'.",
                "Caso 2: O usuário clica no link e é levado ao navegador simulado, onde observa a URL e decide se digita seus dados ou fecha a aba.",
                "Caso 3: O usuário tenta clicar em 'Confirmar Dados' ou 'Pagar Taxa Pix' e a operação é interceptada com segurança pelo sistema."
            ],
            "criterios_aceite": [
                "Nenhum link externo real é acessado; toda a navegação ocorre no ambiente simulado interno.",
                "O usuário experimenta a ilusão verossímil da página falsa, percebendo elementos visuais típicos de engenharia social."
            ]
        },
        {
            "id": "Sprint 3",
            "name": "Mecanismo do Erro Seguro e Aprendizagem Pedagógica (MVP)",
            "status": "⚪ Não Iniciado (Marco MVP)",
            "objetivo": "Implementar o núcleo pedagógico transformador da plataforma: o conceito do 'Erro Seguro' ('Susto Seguro' acolhedor). O usuário que cai na simulação é acolhido imediatamente, compreende exatamente quais técnicas de manipulação foram utilizadas contra ele e aprende a rota segura para nunca cair na vida real.",
            "historias": [
                ("US10", "Descobrir que caiu no golpe (Alerta Acolhedor)", "🔴 Obrigatório", "Tela imediata de impacto visual ('🚨 PARE!'), seguida de alívio instantâneo ('Fique tranquilo, foi só um treino')."),
                ("US11", "Visualizar os sinais do golpe (Raio-X de Risco)", "🔴 Obrigatório", "Linha do tempo interativa destacando cada sinal suspeito que passou despercebido."),
                ("US12", "Entender os gatilhos psicológicos da fraude", "🔴 Obrigatório", "Explicação das táticas usadas: Urgência, Medo, Falsa Autoridade, Confiança Familiar, Recompensa ou Isolamento."),
                ("US13", "Aprender a rota segura ('O que fazer')", "🔴 Obrigatório", "Guia passo a passo prático de como proceder de forma segura na próxima ocorrência."),
                ("US14", "Tentar novamente em situação correlata", "🔴 Obrigatório", "Opção de aplicar o conhecimento imediatamente em um novo treino similar para fixação.")
            ],
            "o_que_sera_feito": [
                "Desenvolvimento do componente RaioXModal / DeconstructView: reconstrução visual da conversa e da página web com marcações coloridas nos pontos de risco.",
                "Implementação da biblioteca de Gatilhos de Manipulação Psicológica explicados em linguagem leiga e acolhedora.",
                "Criação do cartão interativo 'Onde você deveria ter parado?'.",
                "Criação do fluxograma interativo da rota segura oficial (ex: Ligar no telefone impresso no cartão, entrar pelo app oficial instalado).",
                "Integração do motor de repetição: reiniciar com dicas ou experimentar variação do golpe.",
                "Leitura em áudio completa e sincronizada de todas as etapas de explicação do erro."
            ],
            "casos_de_uso": [
                "O usuário tenta transferir dinheiro na simulação; a tela congela e exibe o alerta protetor com áudio narrado.",
                "O usuário visualiza a tela de Raio-X com 3 cartões didáticos: 1) Troca repentina de número; 2) Senso de urgência e afobação; 3) Pix em nome de terceiro desconhecido.",
                "O usuário lê/ouve a explicação do gatilho de 'Afeto e Urgência' e clica em 'Tentar Novamente'."
            ],
            "criterios_aceite": [
                "Fechamento do ciclo completo do MVP: Recebi → Interagi → Errei com Segurança → Entendi o Mecanismo → Aprendi o Procedimento Seguro → Tentei de Novo.",
                "A experiência elimina qualquer sentimento de culpa ou constrangimento no usuário idoso, promovendo acolhimento e aprendizado."
            ]
        },
        {
            "id": "Sprint 4",
            "name": "Ensinar a Verificar Antes de Agir (Habilidades Transferíveis)",
            "status": "⚪ Não Iniciado",
            "objetivo": "Capacitar o usuário na competência fundamental de verificação independente: em vez de tentar adivinhar se uma mensagem é verdadeira, aprender a buscar ativamente a fonte oficial por meios próprios (regra do canal independente).",
            "historias": [
                ("US15", "Identificar links suspeitos e domínios", "🔴 Obrigatório", "Exercício prático de comparação entre URLs legítimas e imitações maliciosas."),
                ("US16", "Encontrar o canal oficial da instituição", "🔴 Obrigatório", "Aprender a acessar bancos e serviços digitando o endereço ou buscando o app na loja oficial."),
                ("US17", "Confirmar informação por outro canal", "🔴 Obrigatório", "Prática da checagem via telefone do cartão físico, atendimento presencial ou SAC confiável."),
                ("US18", "Confirmar identidade de familiar ou contato", "🔴 Obrigatório", "Métodos práticos: ligar de volta no número original, chamada de vídeo ou combinação prévia de pergunta-chave.")
            ],
            "o_que_sera_feito": [
                "Módulo interativo 'Laboratório de Links': jogo educativo de arrastar ou selecionar diferenças em links (ex: www.bb.com.br vs www.banco-do-brasil-seguranca.com).",
                "Simulador de Verificação Oficial: interface onde o usuário é desafiado a achar o número verdadeiro de uma empresa em uma simulação de verso de cartão de crédito.",
                "Árvore de decisão focada na regra: 'Dúvida = Pausa + Verificação Independente'.",
                "Criação de cartilhas interativas com passos práticos para salvar no dispositivo ou imprimir."
            ],
            "casos_de_uso": [
                "Usuário recebe link e aciona a ferramenta de inspeção para entender por que o final '.xyz' ou o traço no domínio indica risco.",
                "Usuário pratica encontrar o contato oficial de suporte sem usar nenhum botão ou telefone enviado pelo suposto atendente."
            ],
            "criterios_aceite": [
                "O usuário compreende e demonstra que nunca deve confirmar uma fraude usando o canal fornecido pelo próprio golpista."
            ]
        },
        {
            "id": "Sprint 5",
            "name": "Inclusão Profunda e Acessibilidade Multimodal (DOSVOX, NVDA & Pessoas Cegas)",
            "status": "⚪ Em Planejamento",
            "objetivo": "Eliminar integralmente as barreiras de acesso para garantir que pessoas cegas, com baixa visão severa, idosos e pessoas em processo de alfabetização possam utilizar a plataforma com total autonomia, sem depender de olhar para a tela ou usar o mouse.",
            "historias": [
                ("US19", "Ouvir mensagens da simulação (Refinamento TTS)", "🔴 Obrigatório", "Controles aprimorados de áudio: pausa, repetição e ajuste de velocidade de fala."),
                ("US20", "Ouvir explicações e feedbacks", "🔴 Obrigatório", "Narração em voz alta de 100% dos relatórios de feedback e explicações pedagógicas."),
                ("US21", "Botões grandes e interface tátil acolhedora", "🔴 Obrigatório", "Áreas de toque mínimas de 56px, espaçamento ergonômico e contraste WCAG AAA."),
                ("US22", "Revisão de linguagem simples e empática", "🔴 Obrigatório", "Eliminação de termos técnicos e estrangeirismos ('phishing', 'malware', 'spoofing'), substituídos por conceitos claros."),
                ("US23", "Interação por voz (Protótipo STT)", "🟠 Importante", "Permitir ao usuário responder ou navegar falando com a plataforma."),
                ("US23-B", "Compatibilidade com DOSVOX e Leitores de Tela Assistivos", "🔴 Obrigatório", "Suporte a pessoas cegas via DOSVOX, NVDA e TalkBack: navegação sonora por teclado numérico (teclas 1, 2, 3), marcação semântica ARIA Live para anúncio imediato de mensagens e audiodescrição de imagens e comprovantes.")
            ],
            "o_que_sera_feito": [
                "Auditoria completa de acessibilidade seguindo diretrizes WCAG 2.1 (níveis AA e AAA).",
                "Compatibilidade com o ecossistema assistivo brasileiro (DOSVOX e NVDA), com navegação orientada a teclado numérico e atalhos de áudio.",
                "Implementação de player de áudio flutuante com controle de velocidade (0.75x, 1.0x, 1.25x) e repetição automática.",
                "Marcação semântica ARIA Live (role='log', aria-live='polite') para que leitores de tela anunciem novas mensagens em tempo real.",
                "Refatoração textual de todas as telas em 'Linguagem Simples' (Plain Language) aprovada para público sênior.",
                "Audiodescrição em texto alternativo para elementos visuais (comprovantes falsos, fotos de perfil e links disfarçados).",
                "Integração experimental com Web Speech Recognition API para comandos de voz básicos ('Avançar', 'Ouvir', 'Ajuda').",
                "Suporte aprimorado para leitores de tela móveis (TalkBack no Android e VoiceOver no iOS/macOS)."
            ],
            "casos_de_uso": [
                "Pessoa cega utiliza a aplicação auxiliada por DOSVOX ou NVDA, ouvindo as falas do golpista e tomando decisões seguras usando apenas o teclado numérico.",
                "Usuário com catarata ou baixa visão navega exclusivamente por comandos visuais de alto contraste e narração em áudio.",
                "Usuário não alfabetizado conclui um treinamento ouvindo cada opção e tocando em ícones autoexplicativos."
            ],
            "criterios_aceite": [
                "100% dos textos da plataforma contam com alternativa auditiva correspondente.",
                "Pessoas cegas conseguem concluir uma simulação de golpe usando somente o teclado e o retorno em áudio.",
                "Interface atinge pontuação máxima no Lighthouse de acessibilidade."
            ]
        },
        {
            "id": "Sprint 6",
            "name": "Assistente de Segurança em Tempo Real ('Estou em Dúvida')",
            "status": "⚪ Não Iniciado",
            "objetivo": "Disponibilizar uma ferramenta de assistência preventiva para o mundo real: quando o usuário recebe uma mensagem, boleto ou ligação suspeita no seu cotidiano, ele pode consultar o assistente para receber orientação imediata antes de tomar qualquer atitude.",
            "historias": [
                ("US24", "Acesso rápido ao 'Estou em Dúvida'", "🟠 Importante", "Botão de emergência acolhedora em destaque na tela inicial do sistema."),
                ("US25", "Relatar situação por texto ou áudio", "🟠 Importante", "O usuário descreve o que recebeu digitando ou gravando uma mensagem de voz."),
                ("US26", "Receber orientação preventiva passo a passo", "🟠 Importante", "O assistente responde com calma orientando a não pagar, não clicar e verificar pela fonte oficial."),
                ("US27", "Visualizar indicação do nível de risco", "🟠 Importante", "Classificador visual semafórico (🟢 Seguro | 🟡 Suspeito | 🔴 Alto Risco)."),
                ("US28", "Análise de print/foto da mensagem (Bônus)", "🟡 Desejável", "Envio de captura de tela para identificação automática dos sinais de risco.")
            ],
            "o_que_sera_feito": [
                "Criação do módulo EstouEmDuvidaView com interface acolhedora e sem alarmismos.",
                "Engenharia de prompts para modelo de linguagem (LLM) especializado em proteção digital com salvaguardas éticas estritas.",
                "Regra de ouro no assistente: nunca tomar decisões pelo usuário, mas incentivar a pausa, a respiração e a checagem oficial.",
                "Indicador visual de semáforo de risco com explicação dos fatores que elevaram o alerta.",
                "Guia interativo imediato: 'O que fazer agora'."
            ],
            "casos_de_uso": [
                "Idoso recebe SMS dizendo que seu CPF está irregular na Receita Federal e abre o assistente.",
                "O idoso diz por voz: 'Recebi uma mensagem dizendo que meu CPF vai ser cancelado se eu não pagar 50 reais'.",
                "O assistente tranquiliza: 'Fique tranquilo! A Receita Federal não cobra taxas por SMS. Isso é um golpe comum. Não pague nada'."
            ],
            "criterios_aceite": [
                "O assistente prioriza a segurança e o acolhimento do idoso, orientando sempre a busca de canais oficiais e nunca solicitando dados bancários ou senhas."
            ]
        },
        {
            "id": "Sprint 7",
            "name": "Aprendizagem Personalizada e Perfil de Competências",
            "status": "⚪ Não Iniciado",
            "objetivo": "Mapear as forças e vulnerabilidades individuais de cada usuário, apresentando seu progresso de forma estimulante e recomendando treinamentos específicos focados nos tipos de golpes onde ele tem mais dificuldade.",
            "historias": [
                ("US29", "Visualizar evolução e progresso", "🟠 Importante", "Painel com medalhas, treinamentos concluídos e índice de decisões seguras."),
                ("US30", "Identificar matriz de dificuldades", "🟠 Importante", "Diagnóstico visual das competências (ex: Reconhecer Urgência, Identificar Links, Lidar com Falsos Bancos)."),
                ("US31", "Recomendação automática de cenários", "🟠 Importante", "O sistema sugere o próximo treinamento com base nas decisões anteriores do usuário."),
                ("US32", "Desafios adaptativos", "🟡 Desejável", "Cenários dinâmicos que variam elementos de acordo com o aprendizado recente.")
            ],
            "o_que_sera_feito": [
                "Criação do painel 'Meu Nível de Segurança Digital' com gráficos simplificados e intuitivos.",
                "Matriz de competências digitais avaliadas (Pausa reflexiva, Reconhecimento de manipulação emocional, Análise de links, Busca oficial).",
                "Mecanismo de recomendação algorítmica de novos treinos.",
                "Sistema de incentivo positivo (reforço de autoestima e autonomia, sem rankings competitivos tóxicos)."
            ],
            "casos_de_uso": [
                "Usuário erra mais em cenários com pressão de urgência; o sistema recomenda cenários com contagem regressiva para treinar a pausa.",
                "Usuário acompanha seu crescimento de 20% para 90% de decisões seguras após 2 semanas de prática."
            ],
            "criterios_aceite": [
                "O usuário compreende facilmente sua evolução e sente satisfação com o progresso de sua própria segurança."
            ]
        },
        {
            "id": "Sprint 8",
            "name": "Hiperlocalização e Realidade Regional de Fraudes",
            "status": "⚪ Não Iniciado",
            "objetivo": "Conectar a plataforma ao contexto comunitário e geográfico do usuário, apresentando simulações baseadas em concessionárias de serviços públicos locais, órgãos governamentais estaduais/municipais e fraudes típicas da região.",
            "historias": [
                ("US33", "Praticar situações da própria região", "🟠 Importante", "Cenários utilizando nomes de companhias de luz, água e transporte da localidade do usuário."),
                ("US34", "Selecionar estado / município", "🟡 Desejável", "Configuração simples de região geográfica no aplicativo."),
                ("US35", "Cenários baseados em golpes locais reais", "🟠 Importante", "Biblioteca de cenários inspirados em boletins de ocorrência e alertas de Procons regionais.")
            ],
            "o_que_sera_feito": [
                "Criação do seletor geográfico no perfil ou na inicialização.",
                "Desenvolvimento de cenários específicos (ex: Falsa cobrança de corte de luz da concessionária estadual, falso agendamento de benefício do INSS local).",
                "Estruturação de banco de dados com variáveis regionais dinâmicas nos scripts de mensagens."
            ],
            "casos_de_uso": [
                "Usuário de Mato Grosso vivencia simulação com a concessionária de energia Energisa MT.",
                "Usuário de São Paulo vivencia simulação com Enel ou Sabesp, reconhecendo a proximidade com seu cotidiano."
            ],
            "criterios_aceite": [
                "Aumentar a aderência e a eficácia pedagógica aproximando a experiência da realidade tangível do aluno."
            ]
        },
        {
            "id": "Sprint 9",
            "name": "Estrutura de Contas, Sincronização em Nuvem e App Completo",
            "status": "⚪ Não Iniciado",
            "objetivo": "Fornecer infraestrutura robusta de contas e persistência de dados em nuvem, mantendo o processo de cadastro extremamente simples e acessível para evitar abandono por idosos.",
            "historias": [
                ("US40", "Criar conta simplificada", "🟠 Importante", "Cadastro sem senhas complexas, permitindo login via link mágico por e-mail ou código via WhatsApp/SMS."),
                ("US41", "Login e sincronização de dados", "🟠 Importante", "Acesso aos treinos e histórico a partir de qualquer celular, tablet ou computador."),
                ("US42", "Visualizar e editar perfil", "🟡 Desejável", "Gerenciamento de dados pessoais de forma transparente e aderente à LGPD."),
                ("US43", "Configurar preferências permanentes", "🟡 Desejável", "Manter salvas configurações de tamanho de fonte, velocidade de áudio e contrastes.")
            ],
            "o_que_sera_feito": [
                "Modelagem de banco de dados e APIs de autenticação sem atrito (Passwordless / Magic Link / OTP).",
                "Sincronização do estado de treinamento local para banco na nuvem.",
                "Empacotamento PWA aprimorado com manifesto de instalação offline parcial.",
                "Políticas estritas de conformidade com a LGPD e privacidade de dados de idosos."
            ],
            "casos_de_uso": [
                "Usuário troca de aparelho celular, faz login simples com seu número e recupera todo o histórico de treinamentos já concluídos."
            ],
            "criterios_aceite": [
                "O fluxo de entrada não gera frustração e é concluído em menos de 2 etapas por pessoas idosas."
            ]
        },
        {
            "id": "Sprint 10",
            "name": "Rede de Apoio Familiar Integrada (Evolução Futura)",
            "status": "⚪ Futuro (Fase de Escala)",
            "objetivo": "Criar uma ponte de apoio saudável entre o idoso e familiares de confiança (filhos, netos, cuidadores), permitindo que a família acompanhe o progresso e ajude a proteger sem invadir a privacidade ou desrespeitar a autonomia do idoso.",
            "historias": [
                ("US36", "Autorizar pessoa de confiança", "⚪ Futuro", "O idoso autoriza explicitamente um familiar por meio de código seguro ou convite simples."),
                ("US37", "Visualizar áreas de atenção do familiar", "⚪ Futuro", "O familiar vê em quais temas o idoso precisa de mais conversa e apoio (sem ver respostas íntimas)."),
                ("US38", "Acompanhar evolução e engajamento", "⚪ Futuro", "Visualização da frequência de treinamento e evolução da segurança digital do familiar."),
                ("US39", "Guia pedagógico de apoio para familiares", "⚪ Futuro", "Dicas para a família de como conversar sobre segurança com empatia e criar senhas verbais familiares.")
            ],
            "o_que_sera_feito": [
                "Módulo 'Painel Familiar' com interface dedicada para o filho/cuidador.",
                "Mecanismo de consentimento mútuo e revogação imediata a qualquer momento pelo idoso.",
                "Elaboração do Guia da Família Segura: como orientar sem repreender, criação de palavras-código em família para casos de emergência real."
            ],
            "casos_de_uso": [
                "O filho acessa o painel e nota que a mãe tem dúvida sobre falsos SMS de entrega; em vez de dar bronca, senta com ela e conversa amigavelmente sobre o tema."
            ],
            "criterios_aceite": [
                "A ferramenta preserva a dignidade e a independência do idoso, fortalecendo os laços familiares de proteção."
            ]
        }
    ]

    for sprint in sprints_full:
        # Sprint Header Block
        h3_s = doc.add_paragraph()
        h3_s.paragraph_format.space_before = Pt(16)
        h3_s.paragraph_format.space_after = Pt(2)
        r_sid = h3_s.add_run(f"{sprint['id']} — {sprint['name']}")
        r_sid.font.name = "Arial"
        r_sid.font.size = Pt(12.5)
        r_sid.font.bold = True
        r_sid.font.color.rgb = COLOR_PRIMARY

        # Status badge line
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(0)
        p_st.paragraph_format.space_after = Pt(4)
        r_st_l = p_st.add_run("Status: ")
        r_st_l.bold = True
        r_st_l.font.size = Pt(9.5)
        r_st_v = p_st.add_run(f"{sprint['status']}")
        r_st_v.font.size = Pt(9.5)
        r_st_v.bold = True
        if "Concluído" in sprint['status']:
            r_st_v.font.color.rgb = COLOR_SUCCESS
        elif "Próxima" in sprint['status']:
            r_st_v.font.color.rgb = COLOR_WARNING
        else:
            r_st_v.font.color.rgb = COLOR_MUTED

        # Objetivo
        p_obj = doc.add_paragraph()
        p_obj.paragraph_format.space_before = Pt(2)
        p_obj.paragraph_format.space_after = Pt(6)
        r_obj_t = p_obj.add_run("Objetivo Estratégico: ")
        r_obj_t.bold = True
        r_obj_t.font.name = "Arial"
        r_obj_t.font.size = Pt(9.5)
        r_obj_t.font.color.rgb = COLOR_SECONDARY
        r_obj_c = p_obj.add_run(sprint['objetivo'])
        r_obj_c.font.name = "Arial"
        r_obj_c.font.size = Pt(9.5)
        r_obj_c.font.color.rgb = COLOR_DARK

        # Histórias Relacionadas Table
        p_htitle = doc.add_paragraph()
        p_htitle.paragraph_format.space_before = Pt(4)
        p_htitle.paragraph_format.space_after = Pt(2)
        r_ht = p_htitle.add_run("Histórias de Usuário Vinculadas:")
        r_ht.font.name = "Arial"
        r_ht.font.size = Pt(9.5)
        r_ht.font.bold = True
        r_ht.font.color.rgb = COLOR_DARK

        t_us = doc.add_table(rows=len(sprint['historias']) + 1, cols=4)
        t_us.alignment = WD_TABLE_ALIGNMENT.CENTER
        t_col_w = [Inches(0.9), Inches(2.2), Inches(1.1), Inches(2.7)]

        us_headers = ["ID", "Título da História", "Prioridade", "Objetivo / Descrição"]
        for ci, ch in enumerate(us_headers):
            c = t_us.rows[0].cells[ci]
            c.width = t_col_w[ci]
            set_cell_background(c, "E2E8F0")
            set_cell_margins(c, top=80, bottom=80, left=80, right=80)
            set_cell_borders(c, top="CBD5E1", bottom="CBD5E1", left="CBD5E1", right="CBD5E1")
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if ci in [0, 2] else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(ch)
            r.font.name = "Arial"
            r.font.size = Pt(8.5)
            r.font.bold = True
            r.font.color.rgb = COLOR_PRIMARY

        for ri, h_data in enumerate(sprint['historias'], start=1):
            for ci, val in enumerate(h_data):
                c = t_us.rows[ri].cells[ci]
                c.width = t_col_w[ci]
                set_cell_background(c, "FFFFFF" if ri % 2 != 0 else "F8FAFC")
                set_cell_margins(c, top=60, bottom=60, left=80, right=80)
                set_cell_borders(c, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
                p = c.paragraphs[0]
                if ci in [0, 2]:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(val)
                r.font.name = "Arial"
                r.font.size = Pt(8.5)
                if ci == 0:
                    r.font.bold = True
                    r.font.color.rgb = COLOR_SECONDARY
                elif ci == 2:
                    r.font.bold = True
                    if "Obrigatório" in val:
                        r.font.color.rgb = RGBColor(180, 40, 40)
                    elif "Importante" in val:
                        r.font.color.rgb = RGBColor(200, 100, 20)
                    else:
                        r.font.color.rgb = COLOR_MUTED
                else:
                    r.font.color.rgb = COLOR_DARK

        doc.add_paragraph().paragraph_format.space_after = Pt(2)

        # O que será feito / Tasks Técnicas
        p_oq = doc.add_paragraph()
        p_oq.paragraph_format.space_before = Pt(4)
        p_oq.paragraph_format.space_after = Pt(2)
        r_oq = p_oq.add_run("Tarefas e Implementações Técnicas ('O que será feito'):")
        r_oq.font.name = "Arial"
        r_oq.font.size = Pt(9.5)
        r_oq.font.bold = True
        r_oq.font.color.rgb = COLOR_PRIMARY

        for item in sprint['o_que_sera_feito']:
            bp = doc.add_paragraph(style='List Bullet')
            bp.paragraph_format.space_before = Pt(1)
            bp.paragraph_format.space_after = Pt(1)
            r = bp.add_run(item)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            r.font.color.rgb = COLOR_DARK

        # Casos de Uso
        p_cu = doc.add_paragraph()
        p_cu.paragraph_format.space_before = Pt(4)
        p_cu.paragraph_format.space_after = Pt(2)
        r_cu = p_cu.add_run("Casos de Uso e Fluxos Práticos:")
        r_cu.font.name = "Arial"
        r_cu.font.size = Pt(9.5)
        r_cu.font.bold = True
        r_cu.font.color.rgb = COLOR_PRIMARY

        for cu in sprint['casos_de_uso']:
            bp = doc.add_paragraph(style='List Bullet')
            bp.paragraph_format.space_before = Pt(1)
            bp.paragraph_format.space_after = Pt(1)
            r = bp.add_run(cu)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            r.font.color.rgb = COLOR_DARK

        # Critérios de Aceite
        p_ca = doc.add_paragraph()
        p_ca.paragraph_format.space_before = Pt(4)
        p_ca.paragraph_format.space_after = Pt(2)
        r_ca = p_ca.add_run("Critérios de Aceite da Sprint:")
        r_ca.font.name = "Arial"
        r_ca.font.size = Pt(9.5)
        r_ca.font.bold = True
        r_ca.font.color.rgb = COLOR_PRIMARY

        for ca in sprint['criterios_aceite']:
            bp = doc.add_paragraph(style='List Bullet')
            bp.paragraph_format.space_before = Pt(1)
            bp.paragraph_format.space_after = Pt(2)
            r = bp.add_run(ca)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            r.font.color.rgb = COLOR_DARK

        # Horizontal separator line
        p_sep = doc.add_paragraph()
        p_sep.paragraph_format.space_before = Pt(4)
        p_sep.paragraph_format.space_after = Pt(10)
        r_sep = p_sep.add_run("—" * 55)
        r_sep.font.color.rgb = RGBColor(210, 215, 225)
        r_sep.font.size = Pt(8)

    # Final Footer Note
    p_end = doc.add_paragraph()
    p_end.paragraph_format.space_before = Pt(10)
    p_end.paragraph_format.space_after = Pt(4)
    r_end = p_end.add_run("Documento de Gestão Ágil do Projeto de Extensão I • Atualizado continuamente por Sprints.")
    r_end.font.name = "Arial"
    r_end.font.size = Pt(8.5)
    r_end.font.italic = True
    r_end.font.color.rgb = COLOR_MUTED

    doc.save(output_path)
    print(f"Documento gerado com sucesso em: {output_path}")

if __name__ == "__main__":
    out_dir = r"f:\Projeto Extensao I\docs"
    out_file = os.path.join(out_dir, "04_ROADMAP_E_SPRINTS_DETALHADO.docx")
    build_sprints_docx(out_file)
    
    # Also save a copy in root folder for easy access
    root_file = r"f:\Projeto Extensao I\Roadmap_e_Sprints.docx"
    build_sprints_docx(root_file)
