# Especificação da Render Engine — Thinker Terminal UI

> **Documento Arquitetural do Sistema de Renderização**
> Versão: 1.0
> Status: Aprovado
> Classificação: Fonte Única de Verdade
> Dependências: `terminal_ui_spec.md`, `design_system.md`, `layout_engine_spec.md`

---

## Índice

1. [Objetivos](#1-objetivos)
2. [Pipeline de Renderização](#2-pipeline-de-renderização)
3. [Responsabilidades](#3-responsabilidades)
4. [Render Tree](#4-render-tree)
5. [Paint System](#5-paint-system)
6. [ANSI Engine](#6-ansi-engine)
7. [Unicode Engine](#7-unicode-engine)
8. [Text Engine](#8-text-engine)
9. [Border Engine](#9-border-engine)
10. [Buffer](#10-buffer)
11. [Performance](#11-performance)
12. [Casos Extremos](#12-casos-extremos)
13. [Invariantes](#13-invariantes)
14. [Anti-padrões](#14-anti-padrões)
15. [Fluxo Completo](#15-fluxo-completo)
16. [Checklist](#16-checklist)

---

## 1. Objetivos

### 1.1 Responsabilidades

| # | Responsabilidade | Descrição |
|---|-----------------|-----------|
| 1 | **Converter Render Tree em saída visual** | Receber uma árvore imutável de nós posicionados e produzir caracteres ANSI no console. |
| 2 | **Aplicar cores semânticas** | Mapear tokens de cor do Design System para sequências ANSI 24-bit. |
| 3 | **Renderizar bordas box-drawing** | Desenhar molduras de painéis usando caracteres Unicode U+2500-257F com junções corretas. |
| 4 | **Gerenciar buffer duplo** | Manter dois buffers (front/back) para evitar flicker e permitir diff. |
| 5 | **Aplicar fallback Unicode** | Substituir caracteres não-suportados por equivalentes ASCII. |
| 6 | **Truncar e alinhar texto** | Aplicar padding, alinhamento (left/center/right) e ellipsis. |
| 7 | **Produzir saída idempotente** | Mesma Render Tree + mesmo viewport → mesma saída. Sempre. |
| 8 | **Gerenciar regiões sujas** | Apenas redesenhar áreas que mudaram entre frames. |

### 1.2 Não-responsabilidades

| # | Não-responsabilidade | Justificativa |
|---|---------------------|---------------|
| 1 | **Calcular posições ou dimensões** | É responsabilidade exclusiva da Layout Engine. A Render Engine recebe x, y, w, h prontos. |
| 2 | **Medir texto** | A medição já foi feita no Measure Pass. A Render Engine apenas desenha. |
| 3 | **Conhecer regras de negócio** | A Render Engine não sabe o que é uma tarefa, um repositório Git, ou um servidor. |
| 4 | **Criar componentes** | Componentes são criados pelo Dashboard Engine e convertidos pela Layout Engine. |
| 5 | **Alterar dados** | Dados são somente leitura. A Render Engine nunca modifica o conteúdo que recebe. |
| 6 | **Gerenciar estado de UI** | Estado (loading, empty, error) é recebido como meta. A Render Engine não altera estado. |
| 7 | **Decidir o que renderizar** | A Render Tree já contém apenas o que deve ser exibido. A Render Engine não filtra. |
| 8 | **Ler entrada do usuário** | Input é responsabilidade do Input Handler. A Render Engine apenas escreve. |
| 9 | **Executar comandos** | Comandos são processados pelo Workspace Engine. A Render Engine não interpreta nada. |
| 10 | **Fazer logging** | Logging é feito por um sistema separado. A Render Engine não loga eventos. |

### 1.3 Filosofia

```
DETERMINISMO
  Para a mesma Render Tree, a saída é sempre idêntica.
  Não há randomização, não há timing, não há estado global.
  Render Engine é uma função pura: RenderTree + Viewport → Buffer.

SEPARAÇÃO TOTAL
  A Render Engine não conhece Layout, não conhece Dados, não conhece Domínio.
  Ela recebe coordenadas e conteúdo. Ela produz caracteres e ANSI.
  Nada mais.

IDEMPOTÊNCIA
  Render pode ser chamada 1 vez ou 100 vezes com a mesma entrada.
  O resultado é sempre o mesmo.
  O buffer final é sempre o mesmo.

UMA ÚNICA PASSADA
  A Render Engine percorre a Render Tree uma vez.
  Para cada nó, ela:
    1. Posiciona o cursor (x, y)
    2. Aplica cores (ANSI foreground + background)
    3. Escreve o conteúdo (texto, borda, símbolo)
    4. Avança para o próximo nó
  Não há retrocesso. Não há recálculo.

NENHUMA LÓGICA DE APRESENTAÇÃO
  A Render Engine não decide como algo aparece.
  Ela recebe instruções prontas (cor, estilo, posição) e executa.
  Toda decisão visual é tomada upstream.

SEGURANÇA
  A Render Engine nunca falha.
  ANSI inválido → ignorado.
  Unicode inválido → fallback.
  Coordenada fora da tela → ignorada (clip).
```

### 1.4 Performance

```
TEMPOS ESPERADOS:
  Render Tree com 50 nós:    < 100μs
  Render Tree com 200 nós:   < 500μs
  Render Tree com 1000 nós:  < 2ms (raro)

REGRAS DE PERFORMANCE:
  1. Nunca alocar memória no hot path (uso de pool).
  2. Nunca concatenar strings — usar String Builder.
  3. Buffer duplo com diff: apenas caracteres alterados são enviados ao console.
  4. Cores ANSI são pré-compiladas em sequências fixas (cache de tokens).
  5. Unicode fallback é pré-resolvido (tabela hash).
```

---

## 2. Pipeline de Renderização

### 2.1 Diagrama do Pipeline

```
┌──────────────┐
│  LAYOUT TREE  │   (Layout Engine — árvore medida + posicionada)
└──────┬───────┘
       │ Remove nós de layout puro (VStack, HStack, Spacer, etc.)
       ▼
┌──────────────┐
│  RENDER TREE  │   (somente nós visuais: Panel borders, Labels, Icons, Badges, etc.)
└──────┬───────┘
       │ Paint Pass: converter cada nó em operações de pintura
       ▼
┌──────────────┐
│  PAINT QUEUE  │   (lista plana de PaintOp: {x, y, text, fg, bg, bold, ...})
└──────┬───────┘
       │ ANSI Encoding: aplicar sequências ANSI a cada PaintOp
       ▼
┌──────────────┐
│  ANSI BUFFER  │   (buffer bidimensional com células ANSI)
└──────┬───────┘
       │ UTF-8 Encoding: converter caracteres para bytes
       ▼
┌──────────────┐
│  CONSOLE BUF  │   (buffer de bytes pronto para stdout)
└──────┬───────┘
       │ Flush: escrever no console (apenas diferenças)
       ▼
┌──────────────┐
│   TERMINAL    │   (Windows Terminal / PowerShell 7)
└──────────────┘
```

### 2.2 Etapa 1: Layout Tree → Render Tree

**Responsabilidade:** Filtrar nós de layout puro, manter apenas nós visuais.

**Processamento:**
- Percorrer a Layout Tree em pré-ordem.
- Remover nós dos tipos: `vstack`, `hstack`, `section`, `spacer`, `columns` (estes são nós de layout puro — não produzem caracteres).
- Preservar nós visuais: `panel`, `label`, `badge`, `icon`, `divider`, `progress_bar`, `empty_state`, `status_indicator`, `header`, `footer`, `list`, `task_list`, `table`, `tree`, `timeline`.
- Preservar nós de borda gerados pelo Panel: `panel_border_top`, `panel_border_bottom`, `panel_border_left`, `panel_border_right`, `panel_corner_tl`, `panel_corner_tr`, `panel_corner_bl`, `panel_corner_br`, `panel_divider`.

**Regras de flatten:**
```
Layout Tree:
  Panel (x:0, y:0, w:40, h:5)
  └── VStack (x:1, y:1, w:38, h:3)    ← removido
      ├── Label (x:1, y:1, w:38, h:1)  ← preservado
      └── Label (x:1, y:2, w:38, h:1)  ← preservado

  Render Tree (plana, em ordem de pintura):
  1. Panel_Corner_TL     (x:0, y:0)
  2. Panel_Border_Top    (x:1, y:0, w:38)
  3. Panel_Corner_TR     (x:39, y:0)
  4. Panel_Border_Left   (x:0, y:1, h:3)
  5. Label               (x:1, y:1, content: "Item 1")
  6. Label               (x:1, y:2, content: "Item 2")
  7. Panel_Border_Right  (x:39, y:1, h:3)
  8. Panel_Corner_BL     (x:0, y:4)
  9. Panel_Border_Bottom (x:1, y:4, w:38)
  10. Panel_Corner_BR    (x:39, y:4)
```

### 2.3 Etapa 2: Paint Pass

**Responsabilidade:** Converter cada RenderNode em operações de pintura atômicas.

**Processamento:**
para cada nó na Render Tree (em ordem):
```
se nó.type == "label":
    PaintOp { x, y, text: nó.content, fg: nó.meta.color, bg: null, bold: nó.meta.bold }

se nó.type == "badge":
    PaintOp { x, y, text: " " + nó.content + " ", fg: nó.meta.color, bg: nó.meta.bg, bold: true }

se nó.type == "icon":
    PaintOp { x, y, text: nó.symbol, fg: nó.meta.color, bg: null, bold: false }

se nó.type == "panel_border_top":
    PaintOp { x, y, text: "─" × nó.width, fg: "border", bg: null }

se nó.type == "panel_border_vertical":
    PaintOp { x, y, text: "│", fg: "border", bg: null }

// etc. para cada tipo
```

**Saída:** `PaintOp[]` — lista plana de operações.

### 2.4 Etapa 3: Paint Queue

**Estrutura de PaintOp:**
```
PaintOp {
    x: number              // posição horizontal (caractere)
    y: number              // posição vertical (linha)
    text: string           // conteúdo a escrever
    fg: ColorToken         // cor do foreground (token semântico)
    bg: ColorToken | null  // cor do background (token semântico)
    bold: boolean          // negrito?
    dim: boolean           // dim/dark?
    reverse: boolean       // reverse video?
    underline: boolean     // sublinhado?
    skip_ansi: boolean     // true = texto já contém ANSI codes
}
```

**Regras:**
- PaintOps estão em ordem de pintura (top-to-bottom, left-to-right).
- PaintOps podem se sobrepor parcialmente (último vence, exceto para bg).
- PaintOps nunca ultrapassam os limites do viewport (já clipados).
- A Paint Queue é plana — não há hierarquia.

### 2.5 Etapa 4: ANSI Encoding

**Responsabilidade:** Converter PaintOp em string ANSI.

**Processamento:**
```
encode(paintOp):
    ansi = ""
    if paintOp.fg:
        ansi += fg_ansi(paintOp.fg)
    if paintOp.bg:
        ansi += bg_ansi(paintOp.bg)
    if paintOp.bold:
        ansi += ANSI_BOLD
    if paintOp.dim:
        ansi += ANSI_DIM
    if paintOp.reverse:
        ansi += ANSI_REVERSE
    if paintOp.underline:
        ansi += ANSI_UNDERLINE

    return ansi + paintOp.text + ANSI_RESET
```

**Posicionamento:**
```
set_cursor(x, y):
    return ANSI_CUP + (y+1) + ";" + (x+1) + "H"
    // ANSI CUP (Cursor Position) é 1-based
```

**Saída:** String ANSI + texto + reset.

### 2.6 Etapa 5: UTF-8 Encoding

**Responsabilidade:** Converter string ANSI em bytes UTF-8.

**Processamento:**
```
encode_utf8(ansi_string):
    return utf8_encode(ansi_string)
    // Toda string ANSI já é UTF-8 válida
    // A saída é um array de bytes pronto para stdout
```

**Saída:** `byte[]` — buffer de bytes UTF-8.

### 2.7 Etapa 6: Console Buffer

**Responsabilidade:** Manter buffer bidimensional do estado atual do terminal.

**Estrutura:**
```
ConsoleBuffer {
    cells: Cell[width][height]
    cursor_x: number
    cursor_y: number
}

Cell {
    char: string           // 1 caractere
    fg: string | null      // ANSI escape code para foreground
    bg: string | null      // ANSI escape code para background
    bold: boolean
}
```

**Operações:**
```
write(buffer, x, y, text, fg, bg, bold):
    para cada caractere c em text:
        buffer.cells[y][x] = Cell { char: c, fg, bg, bold }
        x++

flush(buffer, console):
    diff = diff_buffers(previous_buffer, current_buffer)
    para cada cell em diff:
        escrever ANSI de posicionamento + ANSI de estilo + caractere
    previous_buffer = current_buffer
```

### 2.8 Etapa 7: Terminal

**Responsabilidade:** Exibir os caracteres.

**Processamento final:**
```
stdout.write(console_buffer.to_ansi_string())
```

---

## 3. Responsabilidades

### 3.1 O que a Render Engine PODE Fazer

```
✅ APLICAR CORES
  - Converter ColorToken "success" em sequência ANSI 24-bit.
  - Aplicar foreground e background.
  - Resetar cores após cada operação.

✅ POSICIONAR CURSOR
  - Mover cursor para (x, y) usando ANSI CUP.
  - Apenas quando necessário (otimização: pular se posição já está correta).

✅ ESCREVER TEXTO
  - Escrever caracteres no terminal na posição atual do cursor.
  - Aplicar truncamento (se o texto excede a largura disponível).
  - Aplicar padding e alinhamento (left/center/right).

✅ DESENHAR BORDAS
  - Usar caracteres box-drawing (U+2500-257F).
  - Conectar cantos e junções corretamente.
  - Manter espessura de 1 caractere.

✅ APLICAR FALLBACK UNICODE
  - Substituir caracteres não-suportados por fallback ASCII.
  - Usar tabela de fallback predefinida.

✅ GERENCIAR BUFFER DUPLO
  - Manter front buffer e back buffer.
  - Comparar buffers para detectar regiões sujas.
  - Apenas escrever diferenças no console.

✅ CLIPPING
  - Ignorar PaintOps com x, y fora do viewport.
  - Truncar texto que excede viewport.width.
  - Omitir linhas que excedem viewport.height.

✅ RESETAR ESTILOS
  - Aplicar ANSI_RESET após cada PaintOp.
  - Garantir que estilos não vazem entre operações.
```

### 3.2 O que a Render Engine NUNCA Pode Fazer

```
❌ CALCULAR POSIÇÕES
  Exemplo proibido:
    if text.length > 10:
        x = 2   // ← a Render Engine não pode decidir posições
  Correto:
    Recebe x da Render Tree. Apenas posiciona o cursor lá.

❌ MEDIR TEXTO
  Exemplo proibido:
    width = measure_text(text)
    if width > container_w:
        truncate(text)
  Correto:
    A medição já foi feita no Measure Pass.
    A Render Engine recebe o texto já truncado.

❌ CONHECER REGRAS DE NEGÓCIO
  Exemplo proibido:
    if task.status == "done":
        color = "green"   // ← regra de negócio na Render Engine
    if git_branch == "main":
        color = "blue"    // ← regra de negócio
  Correto:
    A Render Engine recebe color: "success" da meta do nó.
    Ela apenas aplica o token semântico.

❌ CRIAR COMPONENTES
  Exemplo proibido:
    if panel_needs_border:
        create_border_node()  // ← criar nós na Render Engine
  Correto:
    A Render Tree já contém todos os nós de borda.
    A Render Engine apenas desenha o que está na árvore.

❌ ALTERAR DADOS
  Exemplo proibido:
    text = text.to_upper()    // ← transformação de dados
    text = text.replace(" ", "·")  // ← transformação
  Correto:
    A Render Engine recebe o texto já formatado.
    Ela apenas escreve o que recebe.

❌ GERENCIAR ESTADO
  Exemplo proibido:
    if this.is_loading:
        draw_spinner()      // ← estado gerenciado na Render Engine
    this.frame_count++      // ← estado interno
  Correto:
    Estado é recebido como meta do nó (state: "loading").
    A Render Engine desenha o spinner porque está na Render Tree.

❌ DECIDIR O QUE RENDERIZAR
  Exemplo proibido:
    if node.type == "panel" and node.y > 100:
        skip()  // ← decisão de visibilidade
  Correto:
    Se um nó está na Render Tree, ele DEVE ser renderizado.
    Se não deve ser visto, ele não está na Render Tree.
```

---

## 4. Render Tree

### 4.1 Estrutura

```
RenderNode {
    // Posição (absoluta, já calculada pela Layout Engine)
    x: number
    y: number
    width: number
    height: number

    // Tipo visual
    type: RenderNodeType
    // "label" | "badge" | "icon" | "divider" | "progress_bar"
    // "empty_state" | "status_indicator"
    // "panel_border_top" | "panel_border_bottom"
    // "panel_border_left" | "panel_border_right"
    // "panel_corner_tl" | "panel_corner_tr"
    // "panel_corner_bl" | "panel_corner_br"
    // "panel_divider" | "panel_header"
    // "list_item" | "table_cell" | "tree_node"
    // "timeline_event" | "scroll_indicator"

    // Conteúdo
    content: string
    symbol: string | null     // para icons, status indicators

    // Meta (instruções de renderização)
    meta: {
        fg: ColorToken
        bg: ColorToken | null
        bold: boolean
        dim: boolean
        reverse: boolean
        underline: boolean
        truncate: "none" | "end" | "middle"
        align: "left" | "center" | "right"
        pad_left: number
        pad_right: number
        unicode: string | null
        unicode_fallback: string | null
        border_char: string | null   // para nós de borda
    }
}
```

### 4.2 Tipos de Nó

```
RENDER NODE TYPES:

BORDAS DE PAINEL:
  panel_border_top      → "─" × width
  panel_border_bottom   → "─" × width
  panel_border_left     → "│" × height
  panel_border_right    → "│" × height
  panel_corner_tl       → "┌"
  panel_corner_tr       → "┐"
  panel_corner_bl       → "└"
  panel_corner_br       → "┘"
  panel_divider         → "├" + "─" × (width-2) + "┤"
  panel_header          → "│" + icon + title + spacer + actions + "│"

TEXTO:
  label                 → text content
  badge                 → " " + text + " "
  stat                  → label: value
  empty_state           → message text

SÍMBOLOS:
  icon                  → 1 Unicode char
  status_indicator      → ● ou ○
  scroll_indicator      → ▲ ou ▼

ESTRUTURAS:
  divider               → "─" × width  (ou "─" + label + "─")
  progress_bar          → "▓" × filled + "░" × empty + " N%"
  list_item             → marker + " " + text
  table_cell            → aligned text
  tree_node             → indent + connector + text
  timeline_event        → timestamp + " " + icon + " " + text
```

### 4.3 Ordem

A Render Tree é armazenada em **ordem de pintura**:

```
REGRAS DE ORDEM:
1. Top-to-bottom (menor y primeiro)
2. Left-to-right (menor x primeiro, para mesmo y)
3. Background antes de foreground (bordas antes de texto)
4. Containers externos antes de internos

ORDEM PARA UM PANEL TÍPICO:
  1. panel_corner_tl      (0, 0)  — canto superior esquerdo
  2. panel_border_top     (1, 0)  — borda superior
  3. panel_corner_tr      (W, 0)  — canto superior direito
  4. panel_border_left    (0, 1)  — borda esquerda (vertical)
  5. panel_border_right   (W, 1)  — borda direita (vertical)
  6. panel_header         (1, 1)  — header (se existe)
  7. panel_divider        (0, 2)  — divider (se header existe)
  8. conteúdo interno     (1, 3)  — labels, icons, etc.
  9. panel_corner_bl      (0, H)  — canto inferior esquerdo
  10. panel_border_bottom (1, H)  — borda inferior
  11. panel_corner_br     (W, H)  — canto inferior direito
```

### 4.4 Traversal

A Render Engine percorre a Render Tree UMA ÚNICA VEZ, em ordem.

```
render(render_tree, viewport):
    for node in render_tree (sorted by y, then x):
        if node.x > viewport.width or node.y > viewport.height:
            continue           // clip: fora da tela
        if node.x + node.width < 0 or node.y + node.height < 0:
            continue           // clip: fora da tela

        paint(node)
```

**Comportamento por tipo de traversal:**
- **Pré-ordem:** Não se aplica (a árvore já está plana).
- **Uma passada:** Cada nó é visitado exatamente uma vez.
- **Sem retrocesso:** A engine nunca volta a um nó já processado.

### 4.5 Buffers

A Render Engine mantém dois buffers de ConsoleBuffer:

```
FRONT BUFFER:
  - Representa o estado ATUAL do terminal.
  - É lido para detectar regiões sujas.
  - É atualizado APÓS o flush bem-sucedido.

BACK BUFFER:
  - Representa o estado DESEJADO do terminal.
  - É construído durante o Paint Pass.
  - Substitui o front buffer após o flush.

CICLO:
  1. Render Tree chega
  2. Paint Pass → Back Buffer
  3. Diff: Front Buffer vs Back Buffer
  4. Apenas células diferentes são escritas no console
  5. Front Buffer = Back Buffer
  6. Back Buffer é descartado (recriado no próximo ciclo)
```

### 4.6 Composição

A composição na Render Engine é **por substituição**.

```
REGRAS DE COMPOSIÇÃO:
1. Cada célula do buffer contém exatamente 1 caractere.
2. Se dois PaintOps escrevem na mesma célula:
   - O SEGUNDO vence (substitui o primeiro).
   - Exceto para background: backgrounds são compostos (acumulados).
3. Background composto:
   - Se op1 escreve bg=blue na célula (x,y)
   - E op2 escreve bg=red na mesma célula (x,y)
   - O bg final é red (o último vence, também).

NUNCA:
  - Blend/transparência de caracteres (terminal não suporta)
  - Sobreposição de texto (um caractere substitui o outro)
  - Mesclagem de cores (não há alpha blending)
```

### 4.7 Flatten

O flatten é o processo de **remover nós de layout puro** da árvore.

```
REGRAS DE FLATTEN:
1. Remover nós dos tipos: vstack, hstack, section, spacer, columns.
2. Remover nós com type="container" (genérico).
3. Remover nós vazios (content="" e sem filhos visuais).
4. Os filhos desses nós são promovidos para o nível do pai.
5. A ordem dos filhos é preservada.
6. Nós de borda gerados por Panel são inseridos na sequência correta.

REGRAS DE ANCESTRALIDADE:
  Nós removidos são simplesmente ignorados.
  Seus filhos mantêm as coordenadas absolutas (x, y) — não precisam de ajuste.

EXEMPLO DE FLATTEN:
  Antes:
    Panel (x:0, y:0)
    └── VStack (x:1, y:1)
        ├── Label (x:1, y:1)
        └── Label (x:1, y:2)

  Depois:
    panel_corner_tl     (x:0, y:0)
    panel_border_top    (x:1, y:0)
    panel_corner_tr     (x:9, y:0)
    panel_border_left   (x:0, y:1)
    Label               (x:1, y:1)
    Label               (x:1, y:2)
    panel_border_right  (x:9, y:1)
    panel_corner_bl     (x:0, y:3)
    panel_border_bottom (x:1, y:3)
    panel_corner_br     (x:9, y:3)
```

---

## 5. Paint System

### 5.1 Paint Pass

O Paint Pass converte a Render Tree plana em um **ConsoleBuffer**.

```
paint_pass(render_tree, viewport):
    buffer = new ConsoleBuffer(viewport.width, viewport.height)

    for node in render_tree:
        if node is outside viewport:
            continue

        switch node.type:
            case "label":            paint_label(buffer, node)
            case "badge":            paint_badge(buffer, node)
            case "icon":             paint_icon(buffer, node)
            case "divider":          paint_divider(buffer, node)
            case "progress_bar":     paint_progress_bar(buffer, node)
            case "status_indicator": paint_status_indicator(buffer, node)
            case "panel_border_*":   paint_border(buffer, node)
            case "panel_corner_*":   paint_corner(buffer, node)
            case "panel_divider":    paint_panel_divider(buffer, node)
            case "panel_header":     paint_panel_header(buffer, node)
            case "empty_state":      paint_empty_state(buffer, node)
            case "scroll_indicator": paint_scroll_indicator(buffer, node)
            // ... outros tipos

    return buffer
```

### 5.2 Paint Order

```
1. BACKGROUNDS primeiro:
   - bg de Panel inteiro
   - bg de badges
   - Células sem foreground explícito

2. BORDAS segundo:
   - Cantos (┌┐└┘)
   - Linhas horizontais (─)
   - Linhas verticais (│)
   - Divisores (├┤)
   - Junções (┼)

3. TEXTO terceiro:
   - Labels
   - Badges (bg já foi pintado)
   - Icons
   - Headers
   - Empty states

4. DESTAQUES quarto:
   - Scroll indicators (▲▼)
   - Selection highlights
   - Focus indicators
```

### 5.3 Background

```
paint_background(buffer, x, y, width, height, bg_color):
    for row in y..y+height:
        for col in x..x+width:
            buffer.set_cell(col, row, {
                char: ' ',
                fg: null,
                bg: bg_color,
                bold: false
            })
```

**Regras:**
- Background é pintado como células de espaço com bg color.
- Background nunca sobrepõe foreground (foreground vem depois).
- Background sem foreground definido é transparente (herda do terminal).
- Cores de background são tokens semânticos convertidos para ANSI.

### 5.4 Foreground

```
paint_foreground(buffer, x, y, text, fg_color, bold):
    for i, char in enumerate(text):
        buffer.set_cell(x + i, y, {
            char: char,
            fg: fg_color,
            bg: buffer.get_cell(x + i, y).bg,  // preserva bg
            bold: bold
        })
```

**Regras:**
- Foreground preserva o background existente na célula.
- Foreground substitui o caractere existente.
- Se a célula está vazia (bg = null), o bg do terminal é usado.

### 5.5 Borders

As bordas são pintadas como caracteres individuais usando box-drawing.

```
BORDER CHARS MAP:
  horizontal:            "─" (U+2500)
  vertical:              "│" (U+2502)
  corner_tl:             "┌" (U+250C)
  corner_tr:             "┐" (U+2510)
  corner_bl:             "└" (U+2514)
  corner_br:             "┘" (U+2518)
  divider_left:          "├" (U+251C)
  divider_right:         "┤" (U+2524)
  divider_down:          "┬" (U+252C)
  divider_up:            "┴" (U+2534)
  cross:                 "┼" (U+253C)

DOUBLE BORDERS (reservado, não usar por enquanto):
  horizontal_double:     "═" (U+2550)
  vertical_double:       "║" (U+2551)
  corner_tl_double:      "╔" (U+2554)
  corner_tr_double:      "╗" (U+2557)
  corner_bl_double:      "╚" (U+255A)
  corner_br_double:      "╝" (U+255D)
```

### 5.6 Text

```
paint_text(buffer, x, y, text, fg, bold, align, pad_left, pad_right):
    // Aplicar padding
    padded = " " * pad_left + text + " " * pad_right

    // Aplicar alinhamento interno
    if align == "center":
        total_pad = available_width - len(padded)
        left_pad = total_pad / 2
        right_pad = total_pad - left_pad
        padded = " " * left_pad + padded + " " * right_pad
    elif align == "right":
        total_pad = available_width - len(padded)
        padded = " " * total_pad + padded

    // Escrever no buffer
    paint_foreground(buffer, x, y, padded, fg, bold)
```

### 5.7 Unicode

```
paint_unicode(buffer, x, y, symbol, fg, fallback):
    if terminal_supports(symbol):
        text = symbol
    else:
        text = fallback ?? "?"

    paint_foreground(buffer, x, y, text, fg, false)
```

### 5.8 Highlights

```
paint_highlight(buffer, x, y, width, height, fg, bg):
    for row in y..y+height:
        for col in x..x+width:
            cell = buffer.get_cell(col, row)
            if cell.char != ' ':
                // Preservar caractere, inverter cores
                buffer.set_cell(col, row, {
                    char: cell.char,
                    fg: bg,
                    bg: fg,
                    bold: true
                })
            else:
                // Célula vazia: preencher com bg
                buffer.set_cell(col, row, {
                    char: ' ',
                    fg: null,
                    bg: bg,
                    bold: false
                })
```

### 5.9 Selection

```
REGRAS DE SELEÇÃO:
1. Selection é um retângulo (x1, y1, x2, y2).
2. Células selecionadas têm fg invertido com bg.
3. Selection é pintado DEPOIS de todo o texto.
4. Selection NUNCA altera o conteúdo — apenas as cores.
5. Apenas uma região de seleção por vez.

paint_selection(buffer, sel_x1, sel_y1, sel_x2, sel_y2):
    for row in sel_y1..sel_y2:
        for col in sel_x1..sel_x2:
            cell = buffer.get_cell(col, row)
            buffer.set_cell(col, row, {
                char: cell.char,
                fg: cell.bg ?? "background",
                bg: "selection",
                bold: cell.bold
            })
```

### 5.10 Layers

```
A Render Engine TEM DUAS CAMADAS:

CAMADA 0 — BASE:
  - Backgrounds
  - Bordas
  - Texto
  - Badges (com bg)
  - Tudo que não é sobreposto

CAMADA 1 — OVERLAY:
  - Scroll indicators (▲▼)
  - Selection highlight
  - Focus indicator
  - Tooltips (futuro)

A Camada 1 é pintada DEPOIS da Camada 0.
A Camada 1 NUNCA é salva no buffer permanente — é temporária.
A Camada 1 NUNCA afeta o layout (não ocupa espaço).

IMPLEMENTAÇÃO:
  layer0 = ConsoleBuffer (pintura normal)
  layer1 = ConsoleBuffer (apenas overlays)
  final = composite(layer0, layer1)
  flush(final)

  composite(l0, l1):
      for each cell in l1:
          if l1.cell.char != ' ':
              l0.cells[y][x] = l1.cells[y][x]
      return l0
```

---

## 6. ANSI Engine

### 6.1 Paleta

A ANSI Engine mantém um **cache de tokens de cor** para evitar alocações repetidas.

```
ANSI TOKEN CACHE (pré-compilado):

Token               → ANSI Escape Sequence
──────────────────────────────────────────────────────────
Color.primary       → \033[38;2;224;224;224m
Color.secondary     → \033[38;2;136;136;136m
Color.muted         → \033[38;2;85;85;85m
Color.border        → \033[38;2;51;51;51m
Color.background    → \033[48;2;13;13;13m
Color.surface       → \033[48;2;26;26;26m
Color.accent        → \033[38;2;0;255;136m
Color.success       → \033[38;2;0;255;136m
Color.danger        → \033[38;2;255;85;85m
Color.warning       → \033[38;2;255;200;87m
Color.info          → \033[38;2;88;166;255m
Color.highlight     → \033[48;2;0;255;136m
Color.disabled      → \033[38;2;85;85;85m
Color.selection     → \033[48;2;0;255;136m

ESCAPE CODES:
  ANSI_RESET          → \033[0m
  ANSI_BOLD           → \033[1m
  ANSI_DIM            → \033[2m
  ANSI_ITALIC         → \033[3m
  ANSI_UNDERLINE      → \033[4m
  ANSI_REVERSE        → \033[7m
  ANSI_CUP            → \033[{row};{col}H
```

### 6.2 Foreground

```
fg_ansi(token):
    return token_cache[token].fg
    // Exemplo: token_cache["success"].fg = "\033[38;2;0;255;136m"

REGRAS:
  1. Apenas 24-bit (true color). NUNCA 8-bit ou 4-bit para cores da interface.
  2. Exceção: fallback para terminal que não suporta 24-bit (§6.10).
  3. O foreground é SEMPRE resetado após cada PaintOp.
```

### 6.3 Background

```
bg_ansi(token):
    return token_cache[token].bg
    // Exemplo: token_cache["surface"].bg = "\033[48;2;26;26;26m"

REGRAS:
  1. Background é opcional (padrão: nenhum = herdar do terminal).
  2. Background é resetado após cada PaintOp.
  3. Background usa 24-bit true color.
```

### 6.4 Reset

```
RESET:
  enforced: SIM, após CADA PaintOp.

SEQUÊNCIA CORRETA PARA CADA PAINTOP:
  output = ANSI_CUP(y+1, x+1) + fg_ansi(token) + bg_ansi(token) + text + ANSI_RESET
  // Posiciona, aplica estilo, escreve texto, reseta.

NUNCA:
  output = ANSI_CUP + text + fg_ansi  // ← ordem errada, fg não será aplicado
  output = text + ANSI_RESET           // ← sem posicionamento
```

### 6.5 Bold

```
BOLD:
  ativado:  \033[1m
  desativado: \033[22m (ou incluído no reset)

USO:
  - Badges:  sempre bold
  - Títulos: sempre bold
  - Labels:  apenas se meta.bold = true
  - Icon:    nunca bold

NUNCA:
  - Bold em texto que precisa caber em largura exata (bold pode ser mais largo em alguns terminais)
  - Bold em bordas (não faz sentido)
```

### 6.6 Dim

```
DIM:
  ativado:  \033[2m
  desativado: \033[22m (ou incluído no reset)

USO:
  - Texto desabilitado (state: "disabled")
  - Placeholders
  - Metadados de baixa prioridade
```

### 6.7 Italic

```
ITALIC:
  ativado:  \033[3m

USO:
  - NÃO USAR EM INTERFACE DE TERMINAL.
  - A maioria dos terminais não suporta itálico monoespaçado.
  - Reservado para futuro, se necessário.
```

### 6.8 Underline

```
UNDERLINE:
  ativado:  \033[4m
  desativado: \033[24m

USO:
  - Links (futuro)
  - Comandos sugeridos em EmptyState
  - NUNCA em texto comum (confunde com hyperlink)

NUNCA:
  - Underline em headers ou títulos
  - Underline em badges
```

### 6.9 Reverse

```
REVERSE (video reverso):
  ativado:  \033[7m

USO:
  - Seleção de texto
  - Item selecionado em lista
  - Focus indicator

EFEITO:
  - Inverte foreground e background.
  - Equivalente a trocar fg ↔ bg.
```

### 6.10 Blink

```
BLINK: PROIBIDO.
  \033[5m (slow blink)
  \033[6m (rapid blink)

MOTIVOS:
  1. ANSI blink não é suportado na maioria dos terminais modernos.
  2. blink é considerado anti-acessibilidade (pode causar convulsões).
  3. Não há caso de uso válido para blink em interface de ferramenta profissional.

ALTERNATIVA:
  - Para indicar atenção: usar cor danger (vermelho) + bold.
  - Para indicar carregamento: usar LoadingSpinner com caracteres rotativos.
```

### 6.11 24-bit (True Color)

```
FORMATO:
  \033[38;2;R;G;Bm   → foreground
  \033[48;2;R;G;Bm   → background

R, G, B: 0-255 (valores decimais)

EXEMPLO:
  Color.success: \033[38;2;0;255;136m
  Color.surface: \033[48;2;26;26;26m

REQUISITO MÍNIMO:
  Windows Terminal suporta true color desde 2019.
  PowerShell 7 suporta true color nativamente.
  NUNCA usar 4-bit (ANSI padrão) para as cores da interface.

EXCEÇÃO:
  Se o terminal reportar que não suporta true color,
  a Render Engine faz fallback para 256 cores aproximadas (§6.13).
```

### 6.12 256 Cores

```
FORMATO:
  \033[38;5;Nºm   → foreground (N: 0-255)
  \033[48;5;Nºm   → background (N: 0-255)

MAPA DE FALLBACK (true color → 256):
  #0D0D0D  → 232 (black)
  #1A1A1A  → 235 (dark gray)
  #262626  → 236 (darker gray)
  #333333  → 237 (gray)
  #E0E0E0  → 255 (white)
  #888888  → 244 (light gray)
  #555555  → 240 (medium gray)
  #00FF88  → 2 (green)
  #58A6FF  → 4 (blue)
  #FFC857  → 3 (yellow)
  #FF5555  → 1 (red)
  #C586C0  → 5 (magenta)
  #00E5FF  → 6 (cyan)
  #FF9922  → 202 (orange)
  #A277FF  → 141 (purple)
```

### 6.13 Fallback (Terminal Antigo)

```
DETECÇÃO:
  - Se variável de ambiente COLORTERM=truecolor → 24-bit.
  - Se TERM=xterm-256color → 256 cores.
  - Se TERM=xterm → 16 cores (ANSI padrão).
  - Caso contrário → 16 cores (fallback seguro).

FALLBACK 16 CORES:
  Token            → ANSI 4-bit
  ─────────────────────────────────
  Color.primary    → \033[97m  (bright white)
  Color.success    → \033[92m  (bright green)
  Color.danger     → \033[91m  (bright red)
  Color.warning    → \033[93m  (bright yellow)
  Color.info       → \033[94m  (bright blue)
  Color.muted      → \033[90m  (dark gray)
  Color.border     → \033[90m  (dark gray)

NESTE MODO:
  - A interface perde refinamento visual, mas permanece funcional.
  - Todas as informações ainda são distinguíveis.
  - Nenhuma informação depende de cor 24-bit específica.
```

### 6.14 Compatibilidade

```
TESTES DE COMPATIBILIDADE (a Render Engine DEVE passar):

1. Windows Terminal (versão 1.18+) → 24-bit, UTF-8, true color
2. Windows Terminal (versão 1.12-1.17) → 256 cores, UTF-8
3. PowerShell 7 (Integrated Console) → 24-bit, UTF-8
4. Windows Console (legado) → 16 cores, UTF-8 (limitado)
5. VS Code Integrated Terminal → 24-bit, UTF-8
6. ConEmu → 24-bit, UTF-8
7. Windows Terminal Preview → 24-bit, UTF-8

CADA TESTE DEVE VERIFICAR:
  - Cores corretas (dentro do fallback do terminal)
  - Box-drawing sem gaps
  - Unicode sem quebra de layout
  - Reset apropriado após cada PaintOp
  - Sem vazamento de ANSI codes para o prompt
```

---

## 7. Unicode Engine

### 7.1 Caracteres Permitidos

```
FAIXAS UNICODE AUTORIZADAS:

U+0020-007E    → ASCII imprimível (espaço, letras, números, pontuação)
U+00A0-00FF    → Latin-1 Supplement (acentos comuns, ©, ®)
U+2500-257F    → Box Drawing (bordas, linhas)
U+2580-259F    → Block Elements (metades de bloco, █▄▀)
U+25A0-25FF    → Geometric Shapes (●○■□◆◇)
U+2600-26FF    → Miscellaneous Symbols (☀★☑⚡⚠)
U+2700-27BF    → Dingbats (✂✉✓✗✘)
U+2190-21FF    → Arrows (←↑→↓↔↕)
U+23F0-23F3    → ⏰⏱⏲⏳ (clocks)
U+2B06-2B07    → ⬆⬇ (Git arrows)

FAIXAS PROIBIDAS:
  U+1F300-1F9FF  → Emoji (📋⚠🚫 — usar fallback)
  U+2000-206F    → General Punctuation (usar com cautela)
  U+0300-036F    → Combining Diacritical Marks (proibido — quebra monoespaço)
  U+FE00-FE0F    → Variation Selectors (proibido)
  U+E0000-E007F  → Tags (proibido)
```

### 7.2 Box Drawing (U+2500-257F)

```
CARACTERES ESSENCIAIS:

Linhas:
  ─ U+2500  → horizontal
  │ U+2502  → vertical
  ━ U+2501  → horizontal bold (reservado)
  ┃ U+2503  → vertical bold (reservado)

Cantos:
  ┌ U+250C  → corner down-right
  ┐ U+2510  → corner down-left
  └ U+2514  → corner up-right
  ┘ U+2518  → corner up-left

Junções T:
  ├ U+251C  → T right
  ┤ U+2524  → T left
  ┬ U+252C  → T down
  ┴ U+2534  → T up

Cruz:
  ┼ U+253C  → cross

REGRAS:
  1. Todos os cantos de Panel usam U+250C, U+2510, U+2514, U+2518.
  2. Todas as linhas de Panel usam U+2500 (horizontal) e U+2502 (vertical).
  3. Divisores de Panel (quando há header) usam U+251C e U+2524.
  4. A espessura é sempre 1 caractere (simple, não bold).
  5. NUNCA use double borders (═║╔╗╚╝) a menos que explicitamente configurado.
```

### 7.3 Braille (U+2800-28FF)

```
BRAILLE:
  USO: PROIBIDO na interface principal.
  RESERVADO PARA: gráficos de dados (sparklines) no futuro.
  Se usado, deve ter fallback para block elements (▁▂▃▄▅▆▇█).
```

### 7.4 Block Elements (U+2580-259F)

```
CARACTERES:

  █ U+2588  → full block
  ▉ U+2589  → left 7/8 block
  ▊ U+258A  → left 3/4 block
  ▋ U+258B  → left 5/8 block
  ▌ U+258C  → left half block
  ▍ U+258D  → left 3/8 block
  ▎ U+258E  → left 1/4 block
  ▏ U+258F  → left 1/8 block
  ▀ U+2580  → upper half block
  ▄ U+2584  → lower half block
  ▐ U+2590  → right half block
  ▔ U+2594  → upper one eighth block
  ▕ U+2595  → right one eighth block

USO:
  █ → ProgressBar preenchido
  ░ → ProgressBar vazio (U+2591)
  ▀▄ → WeekChart (barras de gráfico)

FALLBACK:
  █ → "█" (ASCII não tem equivalente — preservar)
  ░ → "░" (idem)
  Em terminal sem block elements: usar "#" para █ e "-" para ░
```

### 7.5 Powerline

```
POWERLINE:
  Caracteres: U+E0A0-U+E0A2, U+E0B0-U+E0B3
  USO: PROIBIDO.
  MOTIVO: Powerline glyphs são privados da Nerd Font.
  Não são universais. Quebram em terminais sem Nerd Font.

ALTERNATIVA:
  Usar box-drawing ou ASCII para separação visual.
  Exemplo: "─" ou "│" em vez de powerline separators.
```

### 7.6 Símbolos

```
SÍMBOLOS APROVADOS (com fallback):

Símbolo      Unicode    Fallback    Uso
────────────────────────────────────────────
●            U+25CF     (O)         Status on
○            U+25CB     (o)         Status off
■            U+25A0     (#)         Tarefa ativa
□            U+25A1     (.)         Tarefa pendente
✓            U+2713     (v)         Sucesso
✗            U+2717     (x)         Erro
✘            U+2718     (X)         Erro fatal
★            U+2605     (*)         Favorito
☆            U+2606     (*)         Não favorito
◆            U+25C6     (<>)        Destaque
▪            U+25AA     (#)         Bullet pequeno
▫            U+25AB     (-)         Bullet vazio
▲            U+25B2     (^)         Scroll up
▼            U+25BC     (v)         Scroll down
◄            U+25C4     (<)         Navegação esq
►            U+25BA     (>)         Navegação dir
▶            U+25B6     (>)         Play
■            U+25A0     (#)         Stop
⏸            U+23F8     (||)        Pause
⏹            U+23F9     (#)         Stop
⏺            U+23FA     (o)         Record
⏳            U+23F3     (@)         Loading
⌛            U+231B     (%)         Timer
⚡            U+26A1     (~)         Server
⚠            U+26A0     (!)         Warning
ℹ            U+2139     (i)         Info
♻            U+267B     ($)         Refresh
⚙            U+2699     (#)         Config
★            U+2605     (*)         Star
☐            U+2610     ( )         Checkbox vazio
☑            U+2611     (v)         Checkbox cheio
☒            U+2612     (x)         Checkbox erro
↑            U+2191     (^)         Git ahead
↓            U+2193     (v)         Git behind
↕            U+2195     (|)         Git both
→            U+2192     (->)        Seta direita
←            U+2190     (<-)        Seta esquerda
↔            U+2194     (<->)       Seta ambos
↵            U+21B5     ($)         Enter
⌘            U+2318     (#)         Cmd (Mac)
⌥            U+2325     (#)         Option (Mac)
⇧            U+21E7     (^)         Shift
⌃            U+2303     (^)         Ctrl
```

### 7.7 Fallback

```
FALLBACK AUTOMÁTICO:

1. TODO símbolo Unicode DEVE ter um fallback ASCII definido.
2. O fallback é usado quando:
   a. O terminal não suporta o caractere (testado na inicialização).
   b. O usuário configurou "unicode: false" nas preferências.
3. O fallback NUNCA pode ter mais de 2 caracteres.
4. Se o fallback tem 2 caracteres, a largura é contada como 2.

TABELA DE FALLBACK:
  📋  (U+1F4CB) → "[#]"   (3 chars, largura 3)
  📜  (U+1F4DC) → "[&]"   (3 chars)
  🎯  (U+1F3AF) → "[*]"   (3 chars)
  🔐  (U+1F510) → "[!]"   (3 chars)
  📁  (U+1F4C1) → "[D]"   (3 chars)
  🔒  (U+1F512) → "[L]"   (3 chars)
  🚫  (U+1F6AB) → "[X]"   (3 chars)
  ❤   (U+2764)  → "<3"    (2 chars)
  👁   (U+1F441) → "(I)"   (3 chars)

NOTA:
  Símbolos na faixa U+2500-27BF NÃO precisam de fallback.
  São suportados por virtualmente todos os terminais modernos.
```

### 7.8 Largura

```
CÁLCULO DE LARGURA:

  A Largura de caracteres é determinada pela categoria Unicode:

  Categoria    Largura    Exemplos
  ────────────────────────────────────
  Narrow       1 célula   A-Z, 0-9, ─│┌┐, ●○■□, ✓✗
  Wide         2 células  📋📜🎯🔐, CJK ideographs
  Fullwidth    2 células  ＡＢＣ (U+FF21-FF5A)
  Neutral      1 célula   Símbolos comuns, pontuação

  REGRA:
    A Render Engine pergunta ao terminal a largura de cada caractere.
    Se o terminal reporta "wide" (2 células), o caractere ocupa 2 colunas.
    Se o terminal reporta "narrow" (1), ocupa 1 coluna.
    A Render Engine ajusta o cursor de acordo.

  OTIMIZAÇÃO:
    Tabela de largura pré-computada para todos os símbolos usados.
    Consulta O(1) — lookup em hash table.
```

### 7.9 East Asian Width

```
EAST ASIAN WIDTH:

  Caracteres CJK (Chinese/Japanese/Korean) têm largura 2 em terminais.
  Eles NÃO SÃO USADOS na interface do Thinker Terminal.
  Se aparecerem em dados do usuário (nomes de arquivo, commits):
    - São medidos com largura 2.
    - O layout engine já contou como largura 1 (regra de segurança).
    - A Render Engine ajusta a posição final.
    - Se houver diferença, o Render Engine reporta ao Layout Engine.

  REGRA:
    A Render Engine nunca decide a largura de um caractere.
    Ela pergunta ao terminal: GetConsoleScreenBufferInfo ou similar.
    Se o terminal não consegue informar, assume 1.
```

### 7.10 Combining Characters

```
COMBINING CHARACTERS (U+0300-036F):

  USO: PROIBIDO.

  MOTIVO:
    Combining characters (acentos combinados: a + ́ = á) quebram o layout
    monoespaçado. Eles ocupam zero largura mas adicionam glifo sobre o
    caractere anterior. Isso faz com que o cursor avance 1 posição mas o
    glifo apareça sobre o caractere anterior — quebra o grid.

  REGRA:
    Se um combining character é detectado no texto:
    1. Tentar decompor para o pré-composto (NFC normalization).
    2. Se não for possível: remover o combining character.
    3. Aviso: log de compatibilidade.

  EXCEÇÃO:
    NUNCA. Combining characters são proibidos na interface.
```

### 7.11 Emoji (Proibido)

```
EMOJI: PROIBIDO na interface.

MOTIVOS:
  1. Largura variável (1 ou 2 células, dependendo do terminal).
  2. Renderização inconsistente entre terminais.
  3. Alto custo de renderização (alguns terminais têm lag com emoji).
  4. Aparência não-profissional.

EXCEÇÃO:
  NENHUMA. Todo emoji tem um símbolo Unicode substituto (U+2600-27BF)
  ou um fallback ASCII.

  📋  U+1F4CB  → usar ☰ (U+2630) ou fallback "[#]"
  ⚡  U+26A1  → permitido (está na faixa U+2600-26FF)
  🔐  U+1F510 → fallback "[!]"
  🎯  U+1F3AF → fallback "[*]"

LISTA DE SÍMBOLOS SUBSTITUTOS:
  Emoji original    → Substituto    → Fallback ASCII
  📋 (tasks)        → ☰ (U+2630)   → "[#]"
  📜 (log)          → ☷ (U+2637)   → "[&]"
  🎯 (engine)       → ◎ (U+25CE)   → "[*]"
  🔐 (admin)        → ⚷ (U+26B7)   → "[!]"
  📁 (folder)       → ▣ (U+25A3)   → "[D]"
  🔒 (locked)       → ⏎ (U+23CE)   → "[L]"
```

---

## 8. Text Engine

### 8.1 Padding

```
PADDING DE TEXTO:

  padding_left:   número de espaços ANTES do texto
  padding_right:  número de espaços DEPOIS do texto

  O padding é aplicado na PaintOp, não no conteúdo.
  O texto armazenado no buffer não contém padding explícito.

  CÁLCULO:
    text_visual = " " * pad_left + text + " " * pad_right
    // O padding é desenhado como caracteres de espaço.
    // O padding tem a mesma cor de foreground do texto.
```

### 8.2 Alignment

A Render Engine suporta 3 alinhamentos de texto dentro de uma largura disponível.

```
LEFT (padrão):
  text_x = x + pad_left
  O texto começa na posição x + padding.

CENTER:
  espaço_restante = available_width - len(text) - pad_left - pad_right
  left_pad = espaço_restante / 2
  right_pad = espaço_restante - left_pad
  text_visual = " " * left_pad + texto + " " * right_pad

RIGHT:
  espaço_restante = available_width - len(text) - pad_left - pad_right
  text_visual = " " * espaço_restante + texto + " " * pad_right

REGRAS:
  1. O alinhamento é calculado dentro da largura disponível do nó.
  2. A largura disponível é node.width - pad_left - pad_right.
  3. Se o texto é maior que a largura disponível, o alinhamento é ignorado
     e o texto é truncado (comportamento de overflow).
```

### 8.3 Justify (Proibido)

```
JUSTIFY: PROIBIDO.

MOTIVO:
  Justificar texto (distribuir espaços entre palavras para preencher a linha)
  não faz sentido em terminal monoespaçado.
  O resultado é visualmente feio e difícil de ler.

ALTERNATIVA:
  Usar left align para texto. Se precisar de preenchimento visual,
  use tabelas (Table) com colunas de largura fixa.
```

### 8.4 Wrapping

```
WRAPPING:

  A Render Engine NÃO faz wrapping de texto.
  O wrapping é responsabilidade da Layout Engine (Measure Pass).

  Se a Render Engine recebe texto que excede a largura do nó:
    1. Verificar se meta.truncate está configurado.
    2. Se sim: truncar (comportamento de ellipsis).
    3. Se não: o texto extravasa (overflow: visible).

  A Render Engine nunca quebra linha no meio do texto.
  O Layout Engine já quebrou o texto em múltiplos nós de label,
  cada um com sua própria posição (x, y).
```

### 8.5 Ellipsis

```
ELLIPSIS (truncamento):

  TRUNCATE END (padrão):
    Se text.length > available_width:
        visible = text[0:available_width-1] + "…"
    "…" (U+2026) tem largura 1.

  TRUNCATE MIDDLE:
    Se text.length > available_width:
        left = text[0:available_width/2 - 1]
        right = text[text.length - available_width/2 + 1:]
        visible = left + "…" + right
    Usado para paths e nomes de branch.

  TRUNCATE NONE:
    O texto não é truncado.
    Se excede a largura, ele extravasa (overflow: visible).

REGRAS:
  1. O "…" NUNCA é contado como parte do texto original.
  2. O "…" está sempre na última posição visível.
  3. Se available_width = 0: não desenhar nada.
  4. Se available_width = 1: desenhar "…".
```

### 8.6 Clipping

```
CLIPPING:

  A Render Engine aplica clipping em 3 níveis:

  NÍVEL 1 — VIEWPORT:
    Se node.x > viewport.width: ignorar nó inteiro.
    Se node.y > viewport.height: ignorar nó inteiro.
    Se node.x + node.width < 0: ignorar nó inteiro.
    Se node.y + node.height < 0: ignorar nó inteiro.

  NÍVEL 2 — LINHA:
    Se text_x > viewport.width: não escrever nada.
    Se text_x + text_len > viewport.width:
        visible_len = viewport.width - text_x
        text = text[0:visible_len]

  NÍVEL 3 — CARACTERE (raramente necessário):
    Se uma célula individual está fora do viewport:
        não escrever aquela célula.

REGRAS:
  1. Clipping é sempre aplicado antes de qualquer operação de escrita.
  2. Clipping nunca modifica dados. Apenas ignora células fora da tela.
  3. Se o nó inteiro está fora do viewport, ele é ignorado por completo.
```

### 8.7 Whitespace

```
WHITESPACE:
  Espaços são caracteres como qualquer outro.
  Eles ocupam 1 célula e têm foreground/bg como qualquer caractere.

REGRAS:
  1. Espaços no final do texto são preservados.
  2. Múltiplos espaços consecutivos são permitidos.
  3. Tabulações (\t) NÃO SÃO PERMITIDAS no texto.
  4. Se um \t aparece no texto, substituir por 4 espaços.
  5. A Render Engine nunca adiciona ou remove espaços do conteúdo.
```

### 8.8 Controle de Largura Visível

```
LARGURA VISÍVEL:

  A largura visível de um texto é o número de células que ele ocupa no terminal.
  Isso é DIFERENTE de len(text) para caracteres de largura 2.

  CÁLCULO:
    visible_width = 0
    for char in text:
        visible_width += char_width(char)

  ONDE char_width():
    - Consulta tabela de largura pré-computada
    - 1 para ASCII e box-drawing
    - 2 para emoji e CJK
    - Fallback: 1

  USO:
    - O truncamento usa visible_width, não len(text).
    - O alinhamento usa visible_width para centralizar.
    - O padding é aplicado em células, não em caracteres.
```

---

## 9. Border Engine

### 9.1 Tipos de Borda

```
SINGLE (padrão — sempre usar):
  ┌───┐
  │   │
  └───┘

DOUBLE (reservado — nunca usar no momento):
  ╔═══╗
  ║   ║
  ╚═══╝

ROUNDED (proibido — não existe em terminal):
  ╭───╮
  │   │
  ╰───╯
  (U+256D-U+2570 existe, mas não use — inconsistente entre terminais)
```

### 9.2 Quando Usar

```
USAR BORDA SIMPLES (SINGLE):
  - Panel (todo painel tem borda)
  - Tabelas (como moldura)
  - Containers que precisam de separação visual explícita

NÃO USAR BORDA:
  - Section (usa divider, não borda)
  - VStack / HStack (não têm borda)
  - Dashboard (não tem borda própria)
  - Header / Footer (barra de 1 linha, sem borda)
  - List / TaskList (usa marcadores, não borda)
```

### 9.3 Junções

```
JUNÇÕES DE BORDA:

  Quando um divider encontra a borda de um Panel:
    ├────────────────────┤

  Caracteres usados:
    ├ = U+251C (T pointing right)
    ┤ = U+2524 (T pointing left)
    ─ = U+2500 (horizontal)

  Quando duas bordas verticais se encontram (raro):
    │
    ├  ← junção T
    │

  QUANDO USAR CADA JUNÇÃO:
    ├  → divider com continuação para baixo
    ┤  → divider com continuação para baixo (lado direito)
    ┬  → T invertida (divider vindo de cima)
    ┴  → T para cima (divider com conteúdo abaixo)
    ┼  → cruzamento de bordas (evitar — repensar layout)
```

### 9.4 Cantos

```
CANTOS DE BORDA:

  ┌ U+250C  → canto superior esquerdo
  ┐ U+2510  → canto superior direito
  └ U+2514  → canto inferior esquerdo
  ┘ U+2518  → canto inferior direito

  CÁLCULO DE POSIÇÃO:
    canto_tl: (panel.x, panel.y)
    canto_tr: (panel.x + panel.width - 1, panel.y)
    canto_bl: (panel.x, panel.y + panel.height - 1)
    canto_br: (panel.x + panel.width - 1, panel.y + panel.height - 1)

  REGRAS:
    1. Cantos são SEMPRE os primeiros elementos do Panel a serem pintados.
    2. Cantos são SEMPRE pintados antes das linhas.
    3. As linhas conectam aos cantos — não há gap.
    4. Se o Panel tem altura < 2 ou largura < 2: não renderizar borda.
```

### 9.5 Divisores

```
DIVISORES:

  DIVISOR DE HEADER (quando Panel tem título):
    ├────────────────────┤
    ↑ O header text fica ENTRE o ├ e o ┤

  DIVISOR DE SEÇÃO (Section):
    ──────── Título ────────
    ↑ A linha é composta de ─ com um label no centro

  REGRAS:
    1. O divisor de Panel tem ├ na esquerda, ┤ na direita.
    2. O divisor de Section tem ─ puro (sem extremidades).
    3. A altura do divisor é sempre 1 linha.
    4. O divisor ocupa toda a largura do conteúdo.
```

### 9.6 Regras de Borda

```
REGRAS GLOBAIS DE BORDA:

  1. Toda borda de Panel é composta de exatamente 4 cantos + 4 linhas.
  2. A espessura de toda borda é exatamente 1 caractere.
  3. Bordas nunca se tocam (dois Panel lado a lado têm 1 caractere de gutter).
  4. Bordas nunca têm cor diferente de Color.border (a menos que estado erro).
  5. Bordas em estado "error" usam Color.danger.
  6. Bordas nunca são animadas.
  7. Bordas nunca são clicáveis.
  8. Bordas nunca contêm texto (com exceção do header divider).

  PROIBIDO:
    - Bordas arredondadas (╭╮╰╯)
    - Bordas duplas (╔╗╚╝)
    - Bordas com cores diferentes dentro do mesmo Panel
    - Bordas com mais de 1 caractere de espessura
    - Cantos estilizados (ex: usando + para canto)
```

---

## 10. Buffer

### 10.1 Double Buffer

```
DOUBLE BUFFER:

  A Render Engine mantém dois buffers de ConsoleBuffer:

  FRONT BUFFER (anterior):
    - Representa o que está atualmente no terminal.
    - É lido, nunca escrito (exceto na troca de buffers).
    - Usado para calcular diferenças (diff).

  BACK BUFFER (novo):
    - Representa o que DEVE estar no terminal.
    - Construído durante o Paint Pass.
    - Comparado com o Front Buffer.

  CICLO:
    1. Paint Pass → Back Buffer
    2. Diff: percorrer Back Buffer célula por célula
    3. Para cada célula diferente de Front Buffer:
         gerar ANSI CUP + estilo + caractere
    4. Apenas células diferentes são enviadas ao console
    5. Swap: Front = Back
    6. Back = novo buffer vazio (reutilizado, não realocado)
```

### 10.2 Estrutura do Buffer

```
ConsoleBuffer {
    width: number              // largura do viewport
    height: number             // altura do viewport
    cells: Cell[][]            // [y][x]
}

Cell {
    char: string               // 1 caractere (pode ser string de 1 runa)
    fg: string | null          // sequência ANSI para foreground
    bg: string | null          // sequência ANSI para background
    bold: boolean
    dim: boolean
    reverse: boolean
    dirty: boolean             // marca para diff
}
```

### 10.3 Dirty Regions

```
DIRTY REGIONS:

  Em vez de comparar célula por célula (O(width × height)),
  a Render Engine usa dirty regions.

  UMA REGIÃO SUJA É:
    Um retângulo (x1, y1, x2, y2) onde pelo menos uma célula mudou.

  ALGORITMO:
    Durante o Paint Pass, cada PaintOp marca sua área como dirty:
        buffer.mark_dirty(op.x, op.y, op.x + op.text.length, op.y + 1)

    Ao final do Paint Pass:
        dirty_regions = buffer.get_dirty_regions()
        // Regiões sobrepostas são mescladas em uma região maior.

    Para cada dirty region:
        flush_region(region)  // escrever apenas aquela região no console

  COMPLEXIDADE:
    - Marcar dirty: O(1) por PaintOp.
    - Mesclar dirty regions: O(R), onde R é o número de regiões.
    - Flush: O(células alteradas), não O(tela inteira).
```

### 10.4 Incremental Paint

```
INCREMENTAL PAINT:

  A Render Engine pinta de forma incremental: ela só envia para o console
  as células que efetivamente mudaram desde o último frame.

  ISSO É POSSÍVEL PORQUE:
    1. O Front Buffer mantém o estado anterior.
    2. O Back Buffer é comparado célula por célula (via dirty regions).
    3. Apenas células marcadas como dirty são verificadas.
    4. Apenas células efetivamente diferentes são enviadas.

  ECONOMIA ESPERADA:
    - Atualização de timer (1s): 1 célula alterada → 1 célula enviada.
    - Atualização de git status: ~10 células alteradas → ~10 enviadas.
    - Redesenho completo (resize): tela inteira → todas as células.
    - Frame típico: 1-5% das células alteradas → 95-99% de economia.

  QUANDO NÃO USAR INCREMENTAL:
    - Se o número de dirty regions > 30% do viewport: flush completo.
    - Se o Front Buffer não existe (primeiro frame): flush completo.
```

### 10.5 Full Paint

```
FULL PAINT:

  Um full paint escreve TODAS as células do Back Buffer no console.

  QUANDO OCORRE:
    1. Primeiro frame após inicialização.
    2. Redimensionamento do terminal.
    3. Alternância de breakpoint (Compact → Normal → Expanded).
    4. Mais de 30% do viewport está dirty.
    5. Comando :redraw ou Ctrl+L.

  COMPORTAMENTO:
    - Limpar console (ANSI ERASE_DISPLAY: \033[2J).
    - Reposicionar cursor em (0,0).
    - Escrever buffer inteiro, linha por linha.
    - Front Buffer = Back Buffer (completo).
```

### 10.6 Frame

```
FRAME:

  Um frame é UMA EXECUÇÃO COMPLETA do pipeline de renderização.

  DURAÇÃO DE UM FRAME:
    1. Paint Pass: converter Render Tree em Back Buffer.
    2. Dirty Regions: detectar células alteradas.
    3. Flush: enviar alterações ao console.
    4. Swap: Front = Back.

  FREQUÊNCIA DE FRAMES:
    - Timers: 1 frame por segundo (atualização de elapsed_seconds).
    - Eventos de dados: 1 frame por evento (git status, tasks).
    - Redimensionamento: 1 frame por evento de resize.
    - Input: 1 frame por comando.

  MÁXIMO TEÓRICO: 60 frames por segundo (limitado pelo console).
  MÍNIMO PRÁTICO: 1 frame por segundo (apenas timer).
```

### 10.7 Flush

```
FLUSH:

  O flush é o ato de escrever as células alteradas no console.

  flush_region(region):
      for y in region.y1..region.y2:
          for x in region.x1..region.x2:
              cell = back_buffer.cells[y][x]
              prev = front_buffer.cells[y][x]

              if cell != prev:
                  output += ANSI_CUP(y+1, x+1)
                  if cell.fg != prev.fg:
                      output += cell.fg
                  if cell.bg != prev.bg:
                      output += cell.bg
                  if cell.bold != prev.bold:
                      output += cell.bold ? ANSI_BOLD : ANSI_RESET_BOLD
                  output += cell.char
                  output += ANSI_RESET

      console.write(output)
      front_buffer.update(region, back_buffer)

  OTIMIZAÇÃO:
    - Se várias células consecutivas na mesma linha têm o mesmo estilo:
      mesclar em uma única escrita: ANSI_CUP + estilo + texto.
    - Se uma linha inteira mudou: escrever linha inteira de uma vez.
```

### 10.8 Redraw

```
REDRAW:

  Um redraw é solicitado quando:
    1. O buffer está corrompido (detectado por checksum).
    2. O usuário força com :redraw ou Ctrl+L.
    3. O terminal foi limpo externamente (cls, clear).

  COMPORTAMENTO:
    - Full paint (não incremental).
    - Limpar console primeiro.
    - Escrever buffer inteiro.
    - Resetar Front Buffer.

  DETECÇÃO DE CORRUPÇÃO:
    - Checksum opcional do buffer (não implementar por enquanto).
    - Se o usuário reporta caracteres estranhos: redraw manual.
```

---

## 11. Performance

### 11.1 Complexidade

| Operação | Complexidade | Notas |
|----------|-------------|-------|
| Flatten (Layout → Render) | O(n) | n = nós na Layout Tree |
| Paint Pass | O(m) | m = nós na Render Tree |
| Dirty Regions | O(w × h) | pior caso (full paint) |
| Dirty Regions | O(d) | caso médio (d = dirty cells) |
| Flush | O(d) | apenas células alteradas |
| Full Paint | O(w × h) | w = viewport width, h = viewport height |

**Tempos esperados (viewport 120×40 = 4.800 células):**

| Cenário | Nós | Dirty | Tempo |
|---------|-----|-------|-------|
| Timer update | 1 | 1 célula | < 10μs |
| Git status | 10 | ~20 células | < 50μs |
| Widget toggle | 20 | ~200 células | < 100μs |
| Resize (full) | 100 | 4.800 células | < 2ms |
| Primeiro frame | 100 | 4.800 células | < 2ms |

### 11.2 Alocação

```
Onde ocorre alocação:
  1. Criação do Back Buffer: 1 vez por frame (ou reutilizado)
  2. PaintOps: 1 por nó da Render Tree (pooled)
  3. Dirty regions: lista de retângulos (pré-alocada)

ONDE NÃO OCORRE ALOCAÇÃO:
  1. Conversão de cores (cache de tokens — precompilado)
  2. Unicode fallback (hash table — pré-carregada)
  3. String builder (reutilizado entre frames)

REGRAS:
  1. NUNCA alocar no hot path do flush.
  2. Pool de PaintOps: reutilizar objetos entre frames.
  3. Buffer de células: alocado uma vez, reutilizado.
  4. String builder: clear + rebuild, sem nova alocação.
```

### 11.3 Concatenação

```
CONCATENAÇÃO DE STRINGS: PROIBIDA.

  Em vez de:
    output = ""
    for cell in dirty_cells:
        output += ANSI_CUP  + cell.fg + cell.char  // ← O(n²)

  Use StringBuilder:
    builder = StringBuilder(capacity: 4096)
    for cell in dirty_cells:
        builder.append(ANSI_CUP)
        builder.append(cell.fg)
        builder.append(cell.char)
    output = builder.toString()

  REGRAS:
    1. StringBuilder com capacidade inicial estimada (evitar realocações).
    2. Capacidade inicial: dirty_cells * 20 (20 bytes por célula ANSI).
    3. Reutilizar o mesmo StringBuilder entre frames (clear).
```

### 11.4 Pooling

```
POOLING:

  O que deve ser pooled:
    1. PaintOp objects
    2. DirtyRegion objects
    3. StringBuilder
    4. Back Buffer (reutilizado, não recriado)

  O que NÃO deve ser pooled:
    1. Render Tree (criada pela Layout Engine, consumida pela Render Engine)
    2. ANSI escape strings (constantes, pré-alocadas)
    3. Unicode fallback table (carregada uma vez, imutável)

  IMPLEMENTAÇÃO DO POOL:
    paint_op_pool = Stack<PainOp>(capacity: 200)
    get_op(): pool.isEmpty() ? new PaintOp() : pool.pop()
    return_op(op): pool.push(op.reset())
```

### 11.5 Caching

```
CACHING NA RENDER ENGINE:

  1. ANSI Token Cache:
     - Mapa: ColorToken → ANSI escape string
     - Prê-compilado na inicialização
     - O(1) lookup, sem alocação
     - Exemplo: cache["success"] → "\033[38;2;0;255;136m"

  2. Unicode Width Cache:
     - Mapa: char → largura (1 ou 2)
     - Prê-carregado para todos os símbolos usados
     - O(1) lookup

  3. Unicode Fallback Cache:
     - Mapa: char → fallback string
     - Prê-carregado
     - O(1) lookup

  4. Cell ANSI Cache (futuro):
     - Se a mesma célula é escrita repetidamente com o mesmo estilo,
       cachear a string ANSI completa (posição + estilo + caractere).
     - Implementar apenas se profiling mostrar ganho significativo.
```

### 11.6 Garbage

```
GARBAGE COLLECTION:

  A Render Engine deve minimizar a pressão no GC.

  ESTRATÉGIAS:
    1. Pooling de objetos (evitar alloc por frame).
    2. StringBuilder reutilizado (evitar strings temporárias).
    3. Buffers pré-alocados (evitar alloc por redimensionamento).
    4. Constantes pré-compiladas (ANSI tokens, fallback maps).
    5. NUNCA criar strings temporárias no hot path.

  META:
    - 0 alocações no hot path (flushing cells).
    - < 5 alocações por frame (paint pass).
    - < 100 alocações no primeiro frame.
```

### 11.7 String Builder

```
STRING BUILDER ESPECIFICADO:

  StringBuilder {
      buffer: char[]      // array de caracteres
      length: number      // posição atual

      append(s: string): void
          // copiar caracteres de s para buffer[length..]
          // se buffer.length < length + s.length: dobrar capacidade

      append(s: string, start: number, end: number): void
          // append parcial

      clear(): void
          // length = 0 (não realocar)

      toString(): string
          // new string(buffer[0:length])
  }

  CAPACIDADE INICIAL: 4096 caracteres.
  CRITÉRIO DE CRESCIMENTO: dobrar.
```

### 11.8 Atualizações Parciais

```
ATUALIZAÇÕES PARCIAIS:

  Em vez de re-renderizar a tela inteira:

  CENÁRIO: Timer de tarefa incrementa 1 segundo.
    - PaintOp: FocusWidget recebe novo texto "00:12:35" em vez de "00:12:34".
    - Dirty region: apenas a área do timer (ex: x=50, y=0, w=8, h=1).
    - Flush: escrever apenas aquelas 8 células.
    - Economia: 8 células em vez de 4.800 células (99,8% de economia).

  CENÁRIO: Status do servidor muda de online para offline.
    - PaintOp: StatusIndicator muda de ● verde para ● vermelho.
    - Dirty region: apenas a área do indicador (ex: x=30, y=2, w=15, h=1).
    - Flush: escrever apenas aquelas 15 células.
    - Economia: 15 células em vez de 4.800.

  REGRA: Toda atualização é parcial POR PADRÃO.
  Full paint só ocorre quando explicitamente solicitado.
```

---

## 12. Casos Extremos

### 12.1 ANSI Inválido

```
Problema:
  O texto do usuário (não o da interface) contém códigos ANSI.
  Exemplo: um Label com text = "\033[31mhello\033[0m" vindo de dados externos.

Regras:
  1. A Render Engine DEVE escapar códigos ANSI no texto do usuário.
  2. Códigos ANSI no texto do usuário são INVISÍVEIS (removidos).
  3. A interface (bordas, status, labels do sistema) pode conter ANSI.
  4. A distinção é: texto da interface vs texto do usuário.
  5. Meta: meta.skip_ansi = true → texto NÃO é escapado.
     Meta: meta.skip_ansi = false (padrão) → texto É escapado.

Escapamento:
  \033 → "␛" (U+241B, símbolo ESC) ou "[ESC]"
  \x1b → "␛"
  Qualquer sequência ANSI → substituir por representação visível
```

### 12.2 Unicode Inválido

```
Problema:
  O texto contém uma runa Unicode inválida ou não-decodificável.

Regras:
  1. Se a runa é inválida (U+FFFD, replacement character):
     renderizar como "?" (U+003F).
  2. Se a runa está em faixa proibida (emoji, combining):
     aplicar fallback da tabela.
  3. Se a runa é desconhecida (não está na tabela de fallback):
     renderizar como "?".
  4. A Render Engine NUNCA falha (crash) por Unicode inválido.
```

### 12.3 Terminal Antigo

```
Problema:
  Terminal não suporta true color, UTF-8 limitado, ou box-drawing.

Detecção:
  - TERM=dumb → fallback total (apenas ASCII)
  - TERM=xterm → suporta UTF-8 e box-drawing
  - TERM=xterm-256color → suporta 256 cores
  - COLORTERM=truecolor → suporta 24-bit

Comportamento por nível:

  NÍVEL 0 — DUMB:
    - Apenas ASCII (7-bit)
    - Sem cores
    - Sem box-drawing
    - Sem posicionamento de cursor
    - Saída linear (linha por linha, sem refresh)
    - Estado: mínimo funcional

  NÍVEL 1 — 16 CORES:
    - ANSI 4-bit
    - UTF-8 (se suportado)
    - Box-drawing (se UTF-8)
    - UI funcional, sem refinamento visual

  NÍVEL 2 — 256 CORES:
    - ANSI 8-bit
    - UTF-8
    - Box-drawing
    - UI completa com aproximação de cores

  NÍVEL 3 — TRUE COLOR (padrão):
    - ANSI 24-bit
    - UTF-8
    - Box-drawing
    - UI completa com cores exatas
```

### 12.4 Sem UTF-8

```
Problema:
  Terminal em modo ASCII (sem UTF-8).

Comportamento:
  1. TODO caractere fora de ASCII (0x00-0x7F) é convertido para fallback.
  2. Box-drawing (U+2500-257F) é substituído por caracteres ASCII:
       ─ → "-"
       │ → "|"
       ┌ → "+"
       ┐ → "+"
       └ → "+"
       ┘ → "+"
       ├ → "+"
       ┤ → "+"
  3. Símbolos (U+25A0-25FF): fallback conforme tabela §7.6.
  4. A interface permanece funcional, mas visualmente inferior.
```

### 12.5 Janela Redimensionada

```
Problema:
  Terminal é redimensionado durante a renderização.

Comportamento:
  1. O sistema operacional envia evento de resize.
  2. O evento é recebido pelo Input Handler.
  3. O Input Handler notifica o Dashboard Engine.
  4. Dashboard Engine recalcula breakpoint.
  5. Layout Engine recalcula tudo.
  6. Render Engine recebe nova Render Tree.
  7. Full paint com novo viewport.

SEGURANÇA:
  - Se o resize ocorre DURANTE um flush:
    - O flush em andamento é cancelado.
    - Novo frame é iniciado.
    - O buffer antigo é descartado.
  - Se viewport encolheu:
    - Clipping remove células fora da nova área.
    - Nenhuma célula antiga permanece visível fora da área.
  - Se viewport cresceu:
    - Novas células são inicializadas como vazias (espaço, sem cor).
    - Apenas células com conteúdo são escritas.
```

### 12.6 Texto Gigante

```
Problema:
  Label com texto de 100.000 caracteres.

Comportamento:
  1. A Layout Engine já truncou para viewport.width (§14.5 da Layout Engine Spec).
  2. A Render Engine recebe no MÁXIMO viewport.width caracteres.
  3. Se mesmo assim o texto é maior que node.width:
     truncar para node.width.
  4. NUNCA iterar sobre o texto completo se ele é maior que o necessário.
  5. "Preguiça": apenas os primeiros N caracteres são processados.

SEGURANÇA:
  Se text.length > 10.000: truncar para 10.000 antes de qualquer operação.
  (Se o texto chega aqui com 100.000 caracteres, é bug da Layout Engine.)
```

### 12.7 Milhares de Linhas

```
Problema:
  Render Tree com 10.000 nós (lista gigante, timeline enorme).

Comportamento:
  1. A Layout Engine já limitou por max_items (§14.7 da Layout Engine Spec).
  2. A Render Tree tem no máximo algumas centenas de nós.
  3. Se mesmo assim chegam 10.000 nós:
     a. Processar em lotes de 100.
     b. A cada 100 nós, flush parcial.
     c. Se o tempo total excede 100ms, interromper e retomar no próximo frame.
  4. UI nunca deve travar por excesso de nós.

LIMITE DE SEGURANÇA:
  Render Tree com > 1.000 nós: log de alerta.
  Render Tree com > 5.000 nós: ignorar nós excedentes (overflow para lote seguinte).
```

### 12.8 Viewport Pequeno

```
Problema:
  Terminal redimensionado para 20×5 (20 caracteres de largura, 5 linhas).

Comportamento:
  1. Breakpoint xs é ativado (estado Compacto).
  2. Z0 e Z4 são as únicas zonas visíveis (1 linha cada).
  3. A área útil é de 3 linhas.
  4. Todo texto é truncado agressivamente.
  5. Nomes de branch: máx 10 caracteres.
  6. Timers: formato "MM:SS" em vez de "HH:MM:SS".
  7. Metadados removidos: apenas branch + task ativa.

SEGURANÇA:
  - Nenhum PaintOp com x > 19 ou y > 4 é processado.
  - Clipping remove tudo que não cabe.
  - A interface nunca "quebra" — apenas omite.
```

---

## 13. Invariantes

### 13.1 Invariantes de Separação

| # | Invariante | Violação |
|---|------------|----------|
| 1 | A Render Engine NUNCA calcula posições (x, y, width, height). | Qualquer operação de layout na Render Engine. |
| 2 | A Render Engine NUNCA mede texto. | Chamada a measure_text, len(text) para decisão de layout. |
| 3 | A Render Engine NUNCA conhece regras de negócio. | Condicional if task.status, if git_branch, etc. |
| 4 | A Render Engine NUNCA cria componentes. | New Panel(), new VStack() na Render Engine. |
| 5 | A Render Engine NUNCA altera dados. | Modificação de text, color, etc. |
| 6 | A Render Engine NUNCA gerencia estado de UI. | Variável is_loading, frame_count, etc. |
| 7 | A Render Engine NUNCA decide o que renderizar. | Pular nó porque "não é importante". |
| 8 | A Render Engine NUNCA faz logging. | Console.Write para debug. |
| 9 | A Render Engine NUNCA lê entrada do usuário. | Leitura de stdin, teclas, etc. |
| 10 | A Render Engine NUNCA executa comandos. | Invocação de git, npm, etc. |

### 13.2 Invariantes de Render Tree

| # | Invariante | Violação |
|---|------------|----------|
| 11 | A Render Tree é sempre plana (sem aninhamento). | RenderNode com children não-vazio (exceto containers de borda). |
| 12 | A Render Tree nunca contém nós de layout puro (VStack, HStack, Spacer). | Nó type="vstack" na Render Tree. |
| 13 | A Render Tree está sempre em ordem top-to-bottom, left-to-right. | Nó com y=2 antes de nó com y=1. |
| 14 | Todo RenderNode tem type definido. | RenderNode.type = null ou undefined. |
| 15 | Todo RenderNode tem x, y, width, height definidos como inteiros ≥ 0. | Coordenada negativa ou fracionária. |
| 16 | Nenhum RenderNode tem width < 1 (exceto se vazio). | Nó com width = 0 e conteúdo não-vazio. |

### 13.3 Invariantes de Buffer

| # | Invariante | Violação |
|---|------------|----------|
| 17 | O Back Buffer tem exatamente viewport.width × viewport.height células. | Buffer com dimensões diferentes do terminal. |
| 18 | Toda célula do buffer tem um char definido (mínimo: espaço ' '). | Célula com char = null ou undefined. |
| 19 | O Front Buffer e o Back Buffer têm as mesmas dimensões. | Buffers de tamanhos diferentes. |
| 20 | Após o flush, Front Buffer = Back Buffer. | Discrepância entre buffers após flush. |
| 21 | Nenhuma célula fora de [0, viewport.width) × [0, viewport.height) é escrita. | Escrita em x = viewport.width. |
| 22 | Células não-escritas são inicializadas como espaço sem cor. | Lixo de memória em células não-escritas. |

### 13.4 Invariantes de ANSI

| # | Invariante | Violação |
|---|------------|----------|
| 23 | Toda PaintOp é seguida por ANSI_RESET. | Estilo vazando entre operações. |
| 24 | Cores são sempre tokens semânticos, nunca ANSI codes diretos. | Código ANSI hardcoded no PaintOp. |
| 25 | ANSI codes no texto do usuário são escapados. | Código ANSI não-escapado visível como cor. |
| 26 | NUNCA usar ANSI blink (\033[5m, \033[6m). | Blink na saída. |
| 27 | A sequência ANSI_RESET (\033[0m) é sempre a última coisa escrita. | Caractere após reset sem novo estilo. |

### 13.5 Invariantes de Paint

| # | Invariante | Violação |
|---|------------|----------|
| 28 | Toda PaintOp é atômica (uma operação de escrita, sem interrupção). | PaintOp interrompida por outra operação. |
| 29 | A ordem de pintura é sempre background → border → text → overlay. | Texto pintado antes do background. |
| 30 | Nenhuma PaintOp pode falhar. | Exceção lançada durante paint. |
| 31 | PaintOps nunca se sobrepõem no mesmo caractere (exceto overlay). | Dois PaintOps escrevendo no mesmo (x,y) na camada base. |
| 32 | Toda PaintOp respeita clipping (nunca escreve fora do viewport). | Caractere escrito em x=-1 ou y=100. |

### 13.6 Invariantes de Unicode

| # | Invariante | Violação |
|---|------------|----------|
| 33 | Todo caractere Unicode tem fallback definido. | Símbolo sem fallback. |
| 34 | NUNCA usar emoji (U+1F300-1F9FF). | Emoji na saída. |
| 35 | NUNCA usar combining characters (U+0300-036F). | Combining char na saída. |
| 36 | Box-drawing (U+2500-257F) é sempre usado para bordas. | Borda com + ou - em vez de ┌─┐. |
| 37 | Caracteres de largura 2 são ajustados corretamente. | Cursor posicionado no meio de um caractere wide. |

### 13.7 Invariantes de Performance

| # | Invariante | Violação |
|---|------------|----------|
| 38 | NUNCA concatenar strings com + (usar StringBuilder). | Concatenação no hot path. |
| 39 | PaintOps são pooled, não alocados por frame. | New PaintOp() a cada frame. |
| 40 | O flush envia APENAS células alteradas (diff). | Todas as células escritas a cada frame. |
| 41 | NUNCA alocar no hot path do flush. | Alocação durante a escrita no console. |
| 42 | ANSI tokens são pré-compilados, não gerados por frame. | Geração de ANSI escape a cada uso. |

### 13.8 Invariantes de Consistência

| # | Invariante | Violação |
|---|------------|----------|
| 43 | A saída é determinística (mesma entrada → mesma saída). | Variação entre execuções. |
| 44 | A saída é idempotente (render 1× = render N×). | Mudança na saída após múltiplas renderizações. |
| 45 | A Render Engine nunca modifica a Render Tree de entrada. | Alteração de nó recebido. |
| 46 | A Render Engine nunca acessa o Layout Engine. | Chamada a função de layout. |
| 47 | A Render Engine nunca acessa o Dashboard Engine. | Chamada a função de dashboard. |
| 48 | A Render Engine nunca acessa o sistema de arquivos. | Leitura de arquivo. |

---

## 14. Anti-padrões

### 14.1 Concatenação Manual

```
✗ PROIBIDO:
    output = ""
    for cell in cells:
        output += cell.char  // O(n²)

✓ CORRETO:
    builder = StringBuilder(capacity=4096)
    for cell in cells:
        builder.append(cell.char)
```

### 14.2 Padding Manual

```
✗ PROIBIDO:
    text = "  " + title + "  "      // padding manual
    label = " " + status + " "      // padding manual

✓ CORRETO:
    Usar pad_left e pad_right do PaintOp.
    A Render Engine aplica padding automaticamente.
```

### 14.3 Write-Host ou Console.Write Espalhados

```
✗ PROIBIDO:
    // Em qualquer lugar que não seja a Render Engine:
    Console.WriteLine("Servidor online")     // ← fora da Render Engine
    Write-Host "Tarefa concluída"            // ← fora da Render Engine

✓ CORRETO:
    TODO output visual passa pela Render Engine.
    Nada escreve no console fora do método flush().
```

### 14.4 ANSI Fora da Render Engine

```
✗ PROIBIDO:
    // No Dashboard Engine:
    label = "\033[32mOnline\033[0m"   // ← ANSI fora da Render Engine

    // No Workspace Engine:
    output = "\033[31mErro\033[0m"    // ← ANSI fora da Render Engine

✓ CORRETO:
    Cores são tokens semânticos (ColorToken).
    A Render Engine converte tokens para ANSI.
    Ninguém mais conhece ANSI.
```

### 14.5 Unicode Fora da Unicode Engine

```
✗ PROIBIDO:
    // No Layout Engine:
    border = "┌───┐"                  // ← Unicode fora da Render Engine

    // No Dashboard Engine:
    icon = "●"                         // ← Unicode fora da Render Engine

✓ CORRETO:
    Todo caractere Unicode é renderizado pela Render Engine.
    A Render Engine decide fallback, largura, e posicionamento.
    As camadas superiores usam tokens e metadados.
```

### 14.6 Misturar Layout com Render

```
✗ PROIBIDO:
    // Na Render Engine:
    if text.length > 20:
        x = x + 2                    // ← lógica de layout

✓ CORRETO:
    A Render Engine recebe x pronto.
    Ela apenas posiciona o cursor lá.
```

### 14.7 Misturar Data com Render

```
✗ PROIBIDO:
    // Na Render Engine:
    if task.status == "done":
        color = Color.success         // ← lógica de dados

✓ CORRETO:
    A Render Engine recebe color = Color.success no meta do nó.
    Ela apenas aplica a cor.
```

### 14.8 Tabela de Anti-padrões

| # | Anti-padrão | Severidade | Onde Detecta |
|---|-------------|------------|--------------|
| 1 | Concatenação de strings | blocker | Buscar `+=` em loops |
| 2 | Padding manual no texto | blocker | Buscar `" " +` para alinhamento |
| 3 | ANSI codes fora da Render Engine | blocker | Buscar `\033[` fora do ANSI Engine |
| 4 | Unicode fora da Render Engine | blocker | Buscar box-drawing fora do Border Engine |
| 5 | Lógica de layout na Render Engine | blocker | Buscar `x =`, `y =`, `width =` |
| 6 | Lógica de dados na Render Engine | blocker | Buscar `task.`, `git.`, `status.` |
| 7 | Escrita direta no console | blocker | Buscar `Console.Write` / `Write-Host` |
| 8 | Emoji na interface | major | Buscar U+1F3xx-U+1F9xx |
| 9 | Combining characters | major | Buscar U+0300-036F |
| 10 | Blink ANSI | blocker | Buscar `\033[5m` e `\033[6m` |
| 11 | Criação de componente na Render | blocker | Buscar `new Panel`, `new VStack` |
| 12 | Alocação no hot path | major | Buscar `new` dentro de loops de flush |

---

## 15. Fluxo Completo

### 15.1 Diagrama de Fluxo

```
┌──────────────────────────────────────────────────────────────────┐
│                          THEME ENGINE                             │
│  Responsabilidade: definir tokens visuais (cores, bordas, fontes) │
│                                                                   │
│  - Define ColorToken → valores ANSI                               │
│  - Define BorderToken → caracteres box-drawing                    │
│  - Define SpacingToken → valores numéricos                        │
│  - Define TypeToken → pesos, transformações                       │
│                                                                   │
│  Saída: ThemeContext (tokens compilados)                          │
└──────────────────────┬───────────────────────────────────────────┘
                       │ ThemeContext
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                         LAYOUT ENGINE                             │
│  Responsabilidade: calcular posições e dimensões                  │
│  (especificado em layout_engine_spec.md)                          │
│                                                                   │
│  - Recebe Component Tree + Viewport                               │
│  - Measure Pass + Layout Pass                                     │
│  - Produz Render Tree (nós com x, y, w, h, meta)                 │
│                                                                   │
│  Saída: Render Tree + ThemeContext                                │
└──────────────────────┬───────────────────────────────────────────┘
                       │ Render Tree + ThemeContext
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                         RENDER ENGINE                             │
│  Responsabilidade: converter Render Tree em caracteres no console │
│                                                                   │
│  1. FLATTEN: Layout Tree → Render Tree (remover nós de layout)   │
│  2. PAINT PASS: Render Tree → Back Buffer (PaintOps)             │
│  3. TEXT ENGINE: aplicar padding, align, truncate, ellipsis      │
│  4. BORDER ENGINE: desenhar bordas box-drawing                   │
│  5. UNICODE ENGINE: aplicar fallback, ajustar largura            │
│  6. ANSI ENGINE: converter ColorToken → ANSI escape sequences    │
│  7. DIFF: comparar Back Buffer com Front Buffer                  │
│  8. FLUSH: escrever apenas células alteradas no console          │
│  9. SWAP: Front Buffer = Back Buffer                             │
│                                                                   │
│  Saída: ANSI bytes → Console                                     │
└──────────────────────┬───────────────────────────────────────────┘
                       │ stdout (bytes UTF-8 ANSI)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                           CONSOLE                                 │
│  Windows Terminal / PowerShell 7 / VS Code Integrated Terminal   │
│                                                                   │
│  - Recebe bytes UTF-8 com ANSI escape sequences                  │
│  - Interpreta ANSI codes                                         │
│  - Renderiza caracteres na tela                                   │
│  - Gerencia cursor, scroll, clipboard                            │
└──────────────────────────────────────────────────────────────────┘
```

### 15.2 Papel de Cada Camada

```
THEME ENGINE:
  input:  configuração do usuário (cores, fonte, tema claro/escuro)
  output: ThemeContext (tokens compilados para lookup O(1))
  estado: imutável durante a sessão (recarregado com :theme reload)
  contém: mapeamento ColorToken → ANSI, BorderToken → Unicode, etc.

LAYOUT ENGINE:
  input:  Component Tree + Viewport + ThemeContext
  output: Render Tree + ThemeContext
  estado: nenhum (stateless, determinístico)
  contém: Measure Pass, Layout Pass, algoritmo de grid, flex, etc.

RENDER ENGINE:
  input:  Render Tree + ThemeContext
  output: bytes ANSI UTF-8 → stdout
  estado: Front Buffer (para diff entre frames)
  contém: Paint Pass, ANSI Engine, Unicode Engine, Text Engine,
          Border Engine, Buffer Manager

CONSOLE:
  input:  bytes ANSI UTF-8
  output: pixels na tela
  estado: buffer de tela, cursor, scroll history
  gerenciado por: Windows Terminal, PowerShell, etc.
```

### 15.3 Ordem de Execução (Frame Completo)

```
1. THEME ENGINE (uma vez, na inicialização)
   a. Carregar configuração de tema
   b. Compilar tokens de cores em ANSI escapes
   c. Compilar tabela de fallback Unicode
   d. Fornecer ThemeContext

2. WORKSPACE ENGINE (contínuo)
   a. Detectar mudanças no diretório de trabalho
   b. Atualizar Git status
   c. Atualizar tarefas
   d. Fornecer dados estruturados

3. DASHBOARD ENGINE (a cada evento)
   a. Receber novos dados
   b. Aplicar breakpoints
   c. Decidir widgets visíveis
   d. Construir Component Tree
   e. Enviar para Layout Engine

4. LAYOUT ENGINE (a cada nova Component Tree)
   a. Converter Component Tree em Layout Tree
   b. Measure Pass (pós-ordem)
   c. Layout Pass (pré-ordem)
   d. Flatten: Layout Tree → Render Tree
   e. Enviar Render Tree para Render Engine

5. RENDER ENGINE (a cada nova Render Tree)
   a. Receber Render Tree + ThemeContext
   b. Paint Pass → Back Buffer
   c. Aplicar Text Engine (padding, align, truncate)
   d. Aplicar Border Engine (box-drawing)
   e. Aplicar Unicode Engine (fallback, largura)
   f. Aplicar ANSI Engine (cores, estilos)
   g. Detectar dirty regions (diff)
   h. Flush: escrever apenas dirty cells no console
   i. Swap: Front = Back

6. CONSOLE (imediato)
   a. Receber bytes ANSI UTF-8
   b. Renderizar na tela
```

### 15.4 Segurança do Pipeline

```
GARANTIAS DO PIPELINE:
  1. Theme Engine nunca falha (tokens têm fallback para tudo).
  2. Layout Engine nunca produz coordenadas inválidas (invariantes §13).
  3. Render Engine nunca falha (clipping, fallback, escape).
  4. Console nunca recebe ANSI inválido (escapado ou ignorado).

SE ALGO DER ERRADO:
  1. Render Engine ignora (clipping, fallback, escape).
  2. Se o erro é grave: log de alerta (sem crash).
  3. Se o console está corrompido: usuário faz :redraw.
  4. NUNCA: crash, frozen UI, loop infinito.
```

---

## 16. Checklist

### 16.1 Checklist de Pipeline

- [ ] A Render Tree foi flattenada (removidos nós de layout puro)?
- [ ] O Paint Pass produziu um Back Buffer completo?
- [ ] O diff foi calculado entre Front Buffer e Back Buffer?
- [ ] Apenas dirty cells foram escritas no console?
- [ ] O Front Buffer foi atualizado após o flush?
- [ ] A ordem de pintura está correta (background → border → text → overlay)?
- [ ] Nenhum caractere foi escrito fora do viewport?

### 16.2 Checklist de ANSI

- [ ] Toda cor usa token semântico, não ANSI code direto?
- [ ] ANSI_RESET foi aplicado após cada PaintOp?
- [ ] ANSI no texto do usuário foi escapado?
- [ ] Nenhum blink (\033[5m, \033[6m) está presente?
- [ ] O modo de cor (24-bit / 256 / 16) foi detectado corretamente?
- [ ] O fallback de cor foi ativado quando necessário?
- [ ] Bold, dim, reverse, underline foram aplicados corretamente?

### 16.3 Checklist de Unicode

- [ ] Todo símbolo Unicode tem fallback ASCII definido?
- [ ] Nenhum emoji (U+1F300-1F9FF) está presente na interface?
- [ ] Nenhum combining character (U+0300-036F) está presente?
- [ ] Box-drawing usa apenas caracteres da faixa U+2500-257F?
- [ ] Cantos de borda estão conectados sem gaps?
- [ ] Caracteres de largura 2 foram ajustados corretamente?
- [ ] Fallback foi ativado em terminal sem suporte Unicode?

### 16.4 Checklist de Texto

- [ ] Padding foi aplicado corretamente (pad_left, pad_right)?
- [ ] Alinhamento (left/center/right) está correto?
- [ ] Truncamento com "…" foi aplicado quando necessário?
- [ ] "…" está na posição correta (end ou middle)?
- [ ] Nenhum texto excede a largura do nó sem truncamento?
- [ ] Espaços em branco foram preservados?
- [ ] Tabulações foram convertidas para espaços?

### 16.5 Checklist de Bordas

- [ ] Todas as bordas usam caracteres box-drawing (U+2500-257F)?
- [ ] Cantos estão nos lugares corretos (x, y, x+w-1, y+h-1)?
- [ ] Linhas horizontais e verticais conectam perfeitamente aos cantos?
- [ ] Divisores de Panel usam ├ e ┤?
- [ ] Nenhuma borda arredondada (╭╮╰╯) foi usada?
- [ ] Nenhuma borda dupla (╔╗╚╝) foi usada sem autorização?
- [ ] Bordas em estado error estão em vermelho?

### 16.6 Checklist de Buffer

- [ ] Back Buffer tem as mesmas dimensões do viewport?
- [ ] Front Buffer tem as mesmas dimensões do viewport?
- [ ] Células não-escritas são espaço sem cor?
- [ ] Dirty regions foram detectadas corretamente?
- [ ] Apenas dirty cells foram enviadas no flush?
- [ ] Após o flush, Front = Back?

### 16.7 Checklist de Casos Extremos

- [ ] Terminal com 20×5 funciona sem crash?
- [ ] Terminal com 300×100 funciona sem layout quebrado?
- [ ] Unicode inválido (U+FFFD) mostra "?"?
- [ ] ANSI no texto do usuário é escapado?
- [ ] Terminal sem UTF-8 (ASCII mode) funciona com fallback?
- [ ] Redimensionamento durante flush não corrompe o buffer?
- [ ] Texto com 10.000 caracteres não trava?
- [ ] Render Tree com 1.000 nós não excede 100ms?

### 16.8 Checklist de Invariantes

- [ ] Todos os 48 invariantes (§13) foram verificados?
- [ ] Nenhum invariante foi violado?
- [ ] Em caso de violação, a engine reportou erro?
- [ ] A saída final satisfaz todos os invariantes?

### 16.9 Checklist de Anti-padrões

- [ ] Nenhum anti-padrão (§14) está presente?
- [ ] Nenhuma concatenação de strings no hot path?
- [ ] Nenhum ANSI code hardcoded fora da ANSI Engine?
- [ ] Nenhum caractere Unicode hardcoded fora da Unicode Engine?
- [ ] Nenhuma lógica de layout ou dados na Render Engine?
- [ ] Nenhuma alocação no hot path do flush?

### 16.10 Checklist de Performance

- [ ] O Paint Pass é O(n) onde n = nós na Render Tree?
- [ ] O diff é O(d) onde d = dirty cells?
- [ ] O flush é O(d) onde d = dirty cells?
- [ ] Nenhuma alocação ocorre durante o flush?
- [ ] ANSI tokens são pré-compilados?
- [ ] Unicode fallback é pré-carregado?
- [ ] StringBuilder é reutilizado entre frames?
- [ ] PaintOps são pooled?

### 16.11 Checklist de Separação

- [ ] A Render Engine não importa/acessa o Layout Engine?
- [ ] A Render Engine não importa/acessa o Dashboard Engine?
- [ ] A Render Engine não importa/acessa o Workspace Engine?
- [ ] A única entrada é Render Tree + ThemeContext?
- [ ] A única saída é bytes ANSI UTF-8?
- [ ] Nenhum efeito colateral além de escrever no console?

### 16.12 Decisão Final

- [ ] A saída é determinística (mesma entrada → mesma saída)?
- [ ] A saída é idempotente (1× = N×)?
- [ ] A saída respeita todos os invariantes?
- [ ] A saída está livre de anti-padrões?
- [ ] A saída passa em todos os casos extremos?
- [ ] A saída é visualmente consistente com terminal_ui_spec.md?

Se todas as respostas são **SIM** → **Renderização aprovada.**
Se alguma resposta é **NÃO** → **Renderização rejeitada. Corrigir antes de exibir.**

---

## Apêndice A — Glossário

| Termo | Definição |
|-------|-----------|
| **Render Engine** | Camada responsável por converter Render Tree em caracteres ANSI no console. |
| **Render Tree** | Árvore plana de nós visuais com posições (x, y) e dimensões (w, h) já calculadas. |
| **Paint Pass** | Processo de converter Render Tree em um buffer bidimensional de células. |
| **PaintOp** | Operação atômica de pintura: escrever texto em (x, y) com cor e estilo. |
| **Back Buffer** | Buffer que representa o estado desejado do terminal (construído a cada frame). |
| **Front Buffer** | Buffer que representa o estado atual do terminal (usado para diff). |
| **Dirty Region** | Área retangular do buffer que contém células alteradas. |
| **Flush** | Ato de escrever células alteradas no console (apenas dirty regions). |
| **Full Paint** | Escrever todas as células do buffer no console (sem diff). |
| **Double Buffer** | Técnica de usar dois buffers (front/back) para evitar flicker. |
| **ANSI Escape** | Sequência de bytes começando com \033[ que controla cor, posição, estilo. |
| **24-bit (True Color)** | Cores com 8 bits por canal (R, G, B) — \033[38;2;R;G;Bm. |
| **ColorToken** | Identificador semântico de cor (ex: Color.success) mapeado para ANSI. |
| **Box-drawing** | Caracteres Unicode U+2500-257F para desenhar bordas em terminal. |
| **Fallback** | Caractere ou cor substituta quando o recurso original não está disponível. |
| **Clipping** | Ignorar PaintOps ou caracteres que estão fora do viewport. |
| **Viewport** | Área visível do terminal (largura × altura em caracteres). |

---

## Apêndice B — Histórico de Revisão

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-07-11 | Lead Software Architect + Lead UX Engineer | Documento inicial — especificação completa da Render Engine |

---

> **Este documento, em conjunto com `terminal_ui_spec.md`, `design_system.md` e `layout_engine_spec.md`, completa a especificação arquitetural completa do Thinker Terminal.**
>
> A Render Engine é a ÚNICA camada autorizada a produzir saída visual.
> Nenhuma outra camada pode conhecer ANSI, Unicode, caracteres de borda ou Console.
>
> Qualquer implementação que desrespeite estas regras deve ser rejeitada em code review.
> Qualquer dúvida não coberta por este documento deve ser levada ao arquiteto antes da implementação.
>
> **A TRILOGIA ARQUITETURAL ESTÁ COMPLETA:**
> 1. `terminal_ui_spec.md` — O QUÊ (interface, UX, wireframes)
> 2. `design_system.md` — COM O QUÊ (componentes, tokens, composição)
> 3. `layout_engine_spec.md` — ONDE (posições, dimensões, grid, flex)
> 4. `render_engine_spec.md` — COMO (cores, bordas, texto, console)
>
> Nenhuma IA precisará tomar decisões de design ou arquitetura.
> Toda implementação deve seguir exclusivamente estes documentos.
