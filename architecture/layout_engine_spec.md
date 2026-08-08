# Especificação da Layout Engine — Thinker Terminal UI

> **Documento Arquitetural do Sistema de Layout**
> Versão: 1.0
> Status: Aprovado
> Classificação: Fonte Única de Verdade
> Dependências: `terminal_ui_spec.md`, `design_system.md`

---

## Índice

1. [Objetivos da Layout Engine](#1-objetivos-da-layout-engine)
2. [Pipeline Completo](#2-pipeline-completo)
3. [Estrutura da Layout Tree](#3-estrutura-da-layout-tree)
4. [Sistema de Medição (Measure Pass)](#4-sistema-de-medição-measure-pass)
5. [Sistema de Posicionamento (Layout Pass)](#5-sistema-de-posicionamento-layout-pass)
6. [Algoritmo de Layout](#6-algoritmo-de-layout)
7. [Sistema de Containers](#7-sistema-de-containers)
8. [Sistema Flex](#8-sistema-flex)
9. [Grid](#9-grid)
10. [Responsividade](#10-responsividade)
11. [Overflow](#11-overflow)
12. [Regras de Espaçamento](#12-regras-de-espaçamento)
13. [Layout Invariants](#13-layout-invariants)
14. [Casos Extremos](#14-casos-extremos)
15. [Performance](#15-performance)
16. [Anti-padrões](#16-anti-padrões)
17. [Fluxo Completo](#17-fluxo-completo)
18. [Checklist de Validação](#18-checklist-de-validação)

---

## 1. Objetivos da Layout Engine

### 1.1 Responsabilidades

| # | Responsabilidade | Descrição |
|---|-----------------|-----------|
| 1 | **Construir Layout Tree** | Receber dados estruturados do Dashboard Engine e transformar em uma árvore de nós de layout. |
| 2 | **Medir (Measure Pass)** | Percorrer a árvore calculando o tamanho intrínseco, mínimo, máximo e preferido de cada nó. |
| 3 | **Posicionar (Layout Pass)** | Atribuir coordenadas (x, y) e dimensões (width, height) finais para cada nó. |
| 4 | **Resolver Conflitos** | Mediar disputas entre filhos que solicitam mais espaço do que o disponível. |
| 5 | **Aplicar Responsividade** | Recalcular layout com base no breakpoint atual do terminal. |
| 6 | **Produzir Render Tree** | Entregar uma árvore de nós imutável, totalmente medida e posicionada, para o Render Engine. |
| 7 | **Gerenciar Overflow** | Decidir quando truncar, wrap, scroll ou ocultar conteúdo excedente. |

### 1.2 Não-responsabilidades

| # | Não-responsabilidade | Justificativa |
|---|---------------------|---------------|
| 1 | **Renderizar texto ou símbolos** | É responsabilidade do Render Engine. A Layout Engine trabalha apenas com coordenadas e dimensões. |
| 2 | **Aplicar cores ANSI** | Cor é um atributo do Render Tree node, mas a aplicação é do Render Engine. |
| 3 | **Buscar ou processar dados** | A Layout Engine recebe dados prontos. Não busca, não transforma, não valida. |
| 4 | **Gerenciar estado de componentes** | Estado (loading, empty, error) é recebido como prop. A Layout Engine não altera estado. |
| 5 | **Animar transições** | Não há animações no layout. Transições são instantâneas. |
| 6 | **Gerenciar entrada do usuário** | Input é tratado pelo Input Handler, não pela Layout Engine. |
| 7 | **Persistir configurações** | Configuração é recebida, não armazenada. |

### 1.3 Filosofia

```
DETERMINISMO
  Para a mesma árvore de entrada + mesma viewport, a saída é sempre idêntica.
  Não há randomização, não há timing, não há estado global.

DUAS PASSAGENS
  Measure → Layout. Nenhum nó é posicionado antes de ser medido.
  Nenhum nó é medido sem conhecer as restrições do pai.

IMUTABILIDADE
  A Layout Tree de entrada é imutável. O Measure Pass produz uma nova árvore.
  O Layout Pass produz a Render Tree. Nada é modificado in-place.

COMPOSIÇÃO PURA
  O layout de um container é função exclusiva do layout de seus filhos.
  Container não conhece o conteúdo dos filhos, apenas suas dimensões.

ZERO LÓGICA DE DOMÍNIO
  A Layout Engine não sabe o que é uma tarefa, um repositório Git, ou um servidor.
  Ela trabalha apenas com nós, dimensões, posições e constraints.

UMA ÚNICA PASSADA (IDEAL)
  O algoritmo DEVE ser O(n) para o caso médio (árvore balanceada).
  O pior caso é O(n²) para resolução de conflitos em containers flex.
```

### 1.4 Separação entre DATA, LAYOUT e RENDER

```
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  (Dashboard Engine / Workspace Engine)                       │
│  Responsabilidade: produzir dados estruturados               │
│  Exemplo: Task[] com título, status, prioridade             │
│  Saída: Component Tree (design_system.md)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Component Tree
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      LAYOUT ENGINE                           │
│  Responsabilidade: calcular posições e dimensões             │
│  Entrada: Component Tree + Viewport (terminal width/height) │
│  Saída: Render Tree (nós com x, y, width, height)           │
└──────────────────────┬──────────────────────────────────────┘
                       │ Render Tree
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      RENDER ENGINE                           │
│  Responsabilidade: desenhar caracteres no terminal           │
│  Entrada: Render Tree                                        │
│  Saída: Buffer de caracteres + cores → Console              │
└─────────────────────────────────────────────────────────────┘
```

### 1.5 Restrições

| # | Restrição | Origem |
|---|-----------|--------|
| 1 | Largura total da saída = largura do terminal | `terminal_ui_spec` §8 |
| 2 | Altura total da saída ≤ altura do terminal | `terminal_ui_spec` §8 |
| 3 | Grid de 12 colunas com larguras válidas: 1, 2, 3, 4, 6, 12 | `terminal_ui_spec` §4 |
| 4 | Gutter de exatamente 1 caractere entre colunas | `terminal_ui_spec` §4 |
| 5 | Coluna mínima = 4 caracteres | `terminal_ui_spec` §4 |
| 6 | Breakpoints: xs < 80, sm = 80-99, md = 100-139, lg = 140-179, xl ≥ 180 | `terminal_ui_spec` §10 |
| 7 | Z0 e Z4 têm exatamente 1 linha de altura | `terminal_ui_spec` §8 |
| 8 | Painel lateral no estado Normal = 16% (C1-2) | `terminal_ui_spec` §5 |
| 9 | Painel lateral expandido = 25% (C1-3) | `terminal_ui_spec` §5 |
| 10 | Componentes devem respeitar tokens de espaçamento | `design_system` §5 |

---

## 2. Pipeline Completo

### 2.1 Diagrama do Pipeline

```
┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌───────────┐     ┌──────────┐
│  DADOS    │     │  COMPONENT   │     │  LAYOUT    │     │  RENDER   │     │          │
│  CRUOS    │────▶│  TREE        │────▶│  TREE      │────▶│  TREE     │────▶│  CONSOLE │
│          │     │  (Design Sys)│     │  (Medida)  │     │  (Posição) │     │          │
└──────────┘     └──────────────┘     └────────────┘     └───────────┘     └──────────┘
      │                 │                   │                  │                │
      │                 │                   │                  │                │
      ▼                 ▼                   ▼                  ▼                ▼
  Task[]           Panel > VStack >    Node {w,h}        Node {x,y,w,h}    Caracteres
  GitStatus        Label > Label       constraints       absolute pos      + cores
  ServerStatus                                               ANSI codes
```

### 2.2 Etapa 1: Component Tree

**Entrada:** Dados estruturados do Dashboard Engine + Workspace Engine.

**Processamento:**
- Os dados são mapeados para componentes do Design System (`design_system.md` §3).
- Esta etapa é _fora_ da Layout Engine. A Layout Engine recebe a Component Tree já montada.

**Exemplo de saída:**
```
Panel {
    title: "Tarefas",
    icon: "📋",
    width: 4,
    state: "normal"
}
└── VStack {
        gap: "sm",
        padding: "sm"
    }
    ├── Label { text: "Refatorar UX", variant: "primary" }
    └── Label { text: "Bug #42", variant: "secondary" }
```

### 2.3 Etapa 2: Layout Tree (Conversão)

**Entrada:** Component Tree.

**Processamento:**
- Cada componente da Component Tree é convertido em um `LayoutNode`.
- LayoutNodes contêm apenas informações relevantes para layout: tipo do container, propriedades de espaçamento, constraints, e filhos.
- Toda informação visual não-geométrica (cores, variantes, ícones) é preservada como metadado para o Render Engine.

**Regras de conversão:**
```
Component Tree Node                                  LayoutNode
─────────────────────────                           ──────────
Panel { width: 4 }       ─────▶  ContainerNode { type: "panel",      cols: 4 }
VStack { gap: "sm" }     ─────▶  ContainerNode { type: "vstack",     gap: 2 }
HStack { gap: "xs" }     ─────▶  ContainerNode { type: "hstack",     gap: 1 }
Label { text: "Olá" }    ─────▶  LeafNode      { type: "label",      content: "Olá" }
Spacer { }               ─────▶  LeafNode      { type: "spacer",     flex: 1 }
Divider { }              ─────▶  LeafNode      { type: "divider" }
Columns { }              ─────▶  ContainerNode { type: "columns",    gutter: 1 }
Row { width: 6 }         ─────▶  ContainerNode { type: "row",        cols: 6 }
Section { }              ─────▶  ContainerNode { type: "section" }
```

**Saída:** Layout Tree — árvore imutável de LayoutNodes.

### 2.4 Etapa 3: Measure Pass

**Entrada:** Layout Tree + Viewport (terminal width, terminal height).

**Processamento:**
- Percorre a árvore em **pós-ordem** (filhos primeiro).
- Cada nó calcula seus tamanhos: mínimo, máximo, preferido, intrínseco.
- O resultado é anexado ao nó: o nó original não é modificado — um novo nó medido é criado.

**Algoritmo de medida:**
```
measure(node, constraints):
    if node is Leaf:
        node.intrinsic = measure_leaf(node.content)
        node.min_width  = constraints.min_width  ?? node.intrinsic
        node.max_width  = constraints.max_width  ?? node.intrinsic
        node.pref_width = clamp(node.intrinsic, node.min_width, node.max_width)
        node.height     = 1  (a menos que seja multi-linha)

    if node is Container:
        children_constraints = compute_children_constraints(node, constraints)
        for each child in node.children:
            measured_child = measure(child, children_constraints)
        node.intrinsic = sum_of_children + gaps + padding
        node.min_width  = constraints.min_width  ?? node.intrinsic
        node.max_width  = constraints.max_width  ?? node.intrinsic
        node.pref_width = resolve_container_width(node, children)
        node.height     = max(children.height) + gaps_vertical + padding_vertical
```

**Saída:** Layout Tree Medida — cada nó agora contém `intrinsic`, `min_width`, `max_width`, `pref_width`, `height`.

### 2.5 Etapa 4: Layout Pass

**Entrada:** Layout Tree Medida + Viewport.

**Processamento:**
- Percorre a árvore em **pré-ordem** (pai primeiro).
- Atribui coordenadas (x, y) e dimensões finais (width, height) a cada nó.
- Resolve alinhamento, gaps, wrap, e overflow.

**Algoritmo de posicionamento:**
```
layout(node, x, y, available_width, available_height):
    node.x = x + node.padding_left
    node.y = y + node.padding_top
    node.width  = resolve_width(node, available_width)
    node.height = resolve_height(node, available_height)

    if node is Container:
        cursor_x = node.x
        cursor_y = node.y
        for each child in node.children (respeitando wrap/flow):
            child_width  = child.pref_width
            child_height = child.height
            layout(child, cursor_x, cursor_y, child_width, child_height)
            cursor_x += child_width + node.gap
            if wrap and cursor_x + next_child > node.x + node.width:
                cursor_x = node.x
                cursor_y += child_height + node.gap_vertical
```

**Saída:** Render Tree — cada nó agora contém `x`, `y`, `width`, `height`.

### 2.6 Etapa 5: Render Tree

**Entrada:** Layout Tree com posições (Layout Tree + coordenadas).

**Estrutura:**
```
RenderNode {
    type: "panel" | "vstack" | "hstack" | "label" | "badge" | "icon" | ...
    x: number              // posição horizontal absoluta (caracteres)
    y: number              // posição vertical absoluta (linhas)
    width: number          // largura em caracteres
    height: number         // altura em linhas
    content: string        // texto a ser renderizado (leaf nodes)
    children: RenderNode[] // sub-nós
    meta: {
        color: ColorToken        // cor do texto
        bg: ColorToken | null    // cor de fundo
        bold: boolean
        truncate: TruncateMode
        unicode_fallback: string | null
        state: NodeState         // normal, disabled, etc.
    }
}
```

**Regras:**
- Nós do tipo container (VStack, HStack, Panel) têm `content: ""` e podem ou não ter filhos visuais.
- Nós container que não contribuem visualmente (apenas organizam layout) são **removidos** da Render Tree.
- Apenas nós que produzem caracteres visuais ou bordas chegam à Render Tree.

**Exemplo de Render Tree:**
```
RenderNode(type: "panel", x: 0, y: 0, w: 40, h: 5)
├── RenderNode(type: "header", x: 1, y: 0, w: 38, h: 1)
│   └── RenderNode(type: "text", x: 1, y: 0, w: 10, h: 1, content: "📋 Tarefas (3)")
├── RenderNode(type: "vstack_border", x: 0, y: 1, w: 1, h: 3, content: "│")
├── RenderNode(type: "vstack_border", x: 39, y: 1, w: 1, h: 3, content: "│")
├── RenderNode(type: "divider", x: 0, y: 4, w: 40, h: 1)
└── RenderNode(type: "label", x: 2, y: 2, w: 20, h: 1, content: "Refatorar UX")
```

### 2.7 Etapa 6: Render Engine → Console

**Entrada:** Render Tree.

**Responsabilidade do Render Engine (fora do escopo deste documento):**
- Converter cada RenderNode em caracteres ANSI no buffer do terminal.
- Aplicar cores, estilos (bold), e fallback Unicode.
- Escrever o buffer no console.

---

## 3. Estrutura da Layout Tree

### 3.1 Tipos de Nó

```
LayoutNode
├── ContainerNode  (tem filhos, gerencia layout)
│   ├── type: "panel" | "vstack" | "hstack" | "columns" | "row"
│   │         | "section" | "dashboard" | "header" | "footer"
│   └── children: LayoutNode[]
│
├── LeafNode      (não tem filhos, exibe conteúdo)
│   ├── type: "label" | "badge" | "icon" | "spacer" | "divider"
│   │         | "progress_bar" | "empty_state" | "status_indicator"
│   │         | "loading_spinner" | "stat"
│   └── content: string
│
└── DataNode      (aceita dados, gera filhos internamente)
    ├── type: "list" | "task_list" | "table" | "tree" | "timeline"
    └── data: object
```

### 3.2 Anatomia de um LayoutNode

```
LayoutNode {
    // Identificação
    id: string                          // único na árvore
    type: string                        // tipo do componente
    category: "container" | "leaf" | "data"

    // Layout tree (árvore)
    parent: LayoutNode | null
    children: LayoutNode[]              // vazio para leaf/data

    // Constraints (definidos pelo pai)
    constraints: {
        min_width: number | null
        max_width: number | null
        pref_width: number | null
        min_height: number | null
        max_height: number | null
    }

    // Medidas (preenchidos no Measure Pass)
    intrinsic: {
        width: number
        height: number
    }
    min_width: number
    max_width: number
    pref_width: number

    // Posição (preenchidos no Layout Pass)
    x: number
    y: number
    width: number
    height: number

    // Layout props
    layout: {
        padding: { top: number, right: number, bottom: number, left: number }
        gap: number                     // gap entre filhos (horizontal/vertical)
        wrap: boolean
        expand: boolean
        align_h: "left" | "center" | "right"
        align_v: "top" | "center" | "bottom"
        flex: number | null             // flex-grow (spacer, stretch)
        cols: number | null             // colunas do grid (Panel, Row)
        gutter: number                  // gutter entre colunas (Columns)
        max_width: number | null        // constraint de largura máxima
        max_height: number | null       // constraint de altura máxima
    }

    // Overflow
    overflow: {
        x: "visible" | "hidden" | "truncate" | "wrap" | "scroll"
        y: "visible" | "hidden" | "truncate" | "scroll"
    }

    // Meta (passado para Render Engine)
    meta: {
        color: string                   // token semântico
        bg: string | null
        bold: boolean
        truncate: "none" | "end" | "middle"
        unicode: string | null          // símbolo original
        unicode_fallback: string | null
        state: "normal" | "disabled" | "error" | "loading"
        border: boolean                 // se o nó tem borda (Panel)
    }

    // Data (para data nodes)
    data: object | null
}
```

### 3.3 Hierarquia e Lifecycle

```
CRIAÇÃO:
1. Component Tree é recebida do Dashboard Engine.
2. Layout Engine converte em Layout Tree.
3. Cada LayoutNode recebe um id único.
4. Pais e filhos são conectados. Root é o nó top-level (Dashboard ou Z0).

MEDIÇÃO (Measure Pass):
5. Pós-ordem: filhos são medidos antes dos pais.
6. Constraints fluem para baixo.
7. Intrinsic sizes fluem para cima.

POSICIONAMENTO (Layout Pass):
8. Pré-ordem: pais são posicionados antes dos filhos.
9. Coordenadas fluem para baixo.
10. Larguras/alturas finais são atribuídas.

DESTRUIÇÃO:
11. Render Tree é consumida pelo Render Engine.
12. Layout Tree é descartada.
13. Ciclo recomeça no próximo frame/evento.
```

### 3.4 Imutabilidade

```
REGRAS DE IMUTABILIDADE:
─────────────────────────
1. A Layout Tree de entrada NUNCA é modificada.
2. O Measure Pass produz uma NOVA árvore (Layout Tree Medida).
3. O Layout Pass produz uma NOVA árvore (Render Tree).
4. Nenhum nó tem seu estado alterado após ser criado.
5. Se uma prop muda, uma NOVA árvore é criada do zero.
6. Não existe "atualização parcial" de um nó.
7. A árvore inteira é substituída a cada ciclo de layout.
```

### 3.5 Responsabilidades por Tipo

```
CONTAINER NODE:
- Conhece o tipo de container (vstack, hstack, panel, etc.)
- Conhece o algoritmo de layout para aquele tipo
- Distribui espaço entre filhos
- Aplica gap, padding, alinhamento, wrap
- NÃO sabe o que os filhos contêm

LEAF NODE:
- Conhece seu próprio tamanho intrínseco
- Conhece seu conteúdo (texto, símbolo)
- NÃO gerencia layout
- NÃO tem filhos

DATA NODE:
- Conhece seus dados (tasks, tabelas, etc.)
- Conhece seu tipo de layout interno (lista, grid, árvore)
- NÃO gerencia layout externo (quem gerencia é o pai)
- Pode gerar filhos internos durante o Measure Pass
```

---

## 4. Sistema de Medição (Measure Pass)

### 4.1 Visão Geral

O Measure Pass percorre a Layout Tree em **pós-ordem** (depth-first, filhos primeiro) e calcula para cada nó:

- **Intrinsic Size**: tamanho natural do conteúdo (sem constraints)
- **Minimum Width**: menor largura possível sem quebrar o conteúdo
- **Maximum Width**: maior largura possível (ou viewport width)
- **Preferred Width**: largura ideal dentro das constraints do pai

### 4.2 Intrinsic Size

```
LEAF NODES:
  Intrinsic = tamanho do conteúdo em caracteres
  label("Hello")       → { width: 5, height: 1 }
  icon("●")            → { width: 1, height: 1 }
  badge("EM_ANDAMENTO")→ { width: 17, height: 1 }  (15 chars + 2 padding)
  progress_bar(v:75)   → { width: 22, height: 1 }  (20 bar + " " + "75%")
  spacer()             → { width: 0, height: 0 }    (flex: 1, expande)

CONTAINER NODES:
  Intrinsic = soma dos intrinsic dos filhos + gaps + padding
  VStack 2 filhos + gap sm(2) + padding sm(2,1):
    { width: max(filhos) + padding_left + padding_right, height: sum(filhos) + gaps + padding_top + padding_bottom }

DATA NODES:
  Intrinsic = calculado com base nos dados + layout interno
  List 5 items:
    { width: max(item_widths), height: 5 * item_height + 4 * gap }
```

### 4.3 Tipos de Largura

| Tipo | Cálculo | Aplicação |
|------|---------|-----------|
| **Fixed** | `width = prop_value` | Row, Badge, ProgressBar, Stat |
| **Content** | `width = intrinsic.width` | Label, Icon, Spacer |
| **Fill** | `width = parent.width - padding - gap` | VStack children |
| **Expand** | `width = parent.width / children_count` | HStack com expand=true |
| **Grid** | `width = (viewport - gutters) / 12 * cols` | Panel, Row em Columns |
| **Flex** | `width = remaining_space * flex / sum(flex)` | Spacer, stretch items |
| **Min** | `width = max(min_width, intrinsic)` | Quando constraint min existe |
| **Max** | `width = min(max_width, intrinsic)` | Quando constraint max existe |
| **Clamp** | `width = clamp(pref, min, max)` | Caso geral |

### 4.4 Minimum Width

```
Leaves:
  Texto: min_width = comprimento da maior palavra (se wrap=true)
         min_width = intrinsic.width (se wrap=false)
  Icon:  min_width = 1
  Badge: min_width = intrinsic.width (badge não quebra)

Containers:
  min_width = max(min_width dos filhos) + padding
```

### 4.5 Maximum Width

```
Leaves:
  max_width = viewport.width (sem limite superior explícito)
  Se prop max_width definida: max_width = prop

Containers:
  max_width = viewport.width - pai.padding_left - pai.padding_right
  Se pai define constraint: max_width = constraint
```

### 4.6 Preferred Width

```
O preferred width é a largura que o nó "gostaria" de ter:

1. Se o nó tem width fixa (prop) → pref_width = prop
2. Se o nó está dentro de Columns → pref_width = grid_calculation
3. Se o nó é filho de HStack com expand → pref_width = equal_share
4. Se o nó é filho de VStack → pref_width = parent_content_width
5. Se o nó é filho de HStack sem expand → pref_width = intrinsic.width
6. Caso contrário → pref_width = intrinsic.width

Sempre respeita: min_width ≤ pref_width ≤ max_width
```

### 4.7 Content Size

```
Content size = intrinsic.width do nó.

Para nós de texto (Label):
  content_size = len(text)    (para texto de 1 linha)
  content_size = max(line_lengths) (para texto multi-linha)

Para nós com padding interno (Badge):
  content_size = len(text) + padding_left + padding_right

Para containers:
  content_size = max(children.content_size) + padding
```

### 4.8 Stretch e Shrink

```
STRETCH (expandir):
  Um nó com expand=true dentro de um container pai:
  - width = pai.content_width (VStack) / pai.content_width / children_count (HStack)
  - Nunca estica além do max_width
  - Se múltiplos nós têm expand, o espaço é dividido igualmente

SHRINK (encolher):
  Quando a soma dos pref_width dos filhos > pai.content_width:
  - Filhos sem expand são mantidos no pref_width
  - Filhos com expand são reduzidos proporcionalmente
  - Se ainda assim não couber: ativar wrap (se permitido) ou truncar
  - Último recurso: ocultar filhos de baixa prioridade
```

### 4.9 Fill

```
FILL:
  Um nó com layout.fill = true dentro de um container pai:
  - O nó ocupa TODO o espaço restante do pai
  - Diferente de expand (que divide igualmente), fill ocupa o que sobra
  - Apenas UM nó pode ter fill=true em um container
  - Se múltiplos nós têm fill, todos se comportam como expand

  Exemplo:
  HStack(width: 40)
  ├── Label("Nome:")      → pref_width = 5
  ├── Spacer(fill: true)  → width = 40 - 5 - 10 - 2*gap = 21
  └── Label("20/01")      → pref_width = 10
```

### 4.10 Auto

```
AUTO:
  O nó determina sua própria largura baseado no conteúdo.
  Equivalente a "não definido" — o layout engine calcula.
  É o comportamento padrão para a maioria dos nós.

  Um nó com width="auto":
  pref_width = intrinsic.width
  (a menos que constraints do pai ditem outro valor)
```

### 4.11 Fit Content

```
FIT CONTENT:
  O nó se ajusta ao conteúdo, mas nunca excede um máximo.
  fit_content(max_width) → pref_width = min(intrinsic, max_width)

  Usado em:
  - Painéis que não devem esticar além de um limite
  - Dropdowns, tooltips, popovers
  - Widgets no dashboard (fit_content no breakpoint atual)
```

### 4.12 Resumo do Measure Pass

```
para cada nó em pós-ordem:
    se nó é LEAF:
        intrinsic = measure_conteudo(nó)
        min_width = intrinsic.width (ou 1 para spacer)
        max_width = ∞ (ou constraint do pai)
        pref_width = resolve_pref_width(nó, intrinsic, constraints_pai)
        height = resolve_height(nó, intrinsic)

    se nó é CONTAINER:
        para cada filho em nó.children:
            constraints_filho = compute_constraints(nó, filho)
            measure(filho, constraints_filho)

        intrinsic.width = max(filhos.pref_width) + padding_x + gaps_x (para VStack)
                        = sum(filhos.pref_width) + padding_x + gaps_x (para HStack)
        intrinsic.height = sum(filhos.height) + padding_y + gaps_y (VStack)
                         = max(filhos.height) + padding_y (HStack)

        min_width = max(filhos.min_width) + padding_x (ou sum para HStack sem wrap)
        max_width = constraint_pai.max_width ?? ∞
        pref_width = resolve_pref_width_container(nó, filhos, constraints_pai)
        height = resolve_height_container(nó, filhos, constraints_pai)

    se nó é DATA:
        filhos_internos = expandir_dados_em_filhos(nó.data)
        para cada filho_interno em filhos_internos:
            measure(filho_interno, constraints_internas)
        intrinsic = calcular_como_container(filhos_internos)
        (continua como container)
```

---

## 5. Sistema de Posicionamento (Layout Pass)

### 5.1 Visão Geral

O Layout Pass percorre a Layout Tree Medida em **pré-ordem** (pai primeiro, depth-first) e atribui a cada nó:

- `x`: posição horizontal (caracteres da borda esquerda do terminal)
- `y`: posição vertical (linhas do topo do terminal)
- `width`: largura final (caracteres)
- `height`: altura final (linhas)

### 5.2 Entrada e Saída

```
ENTRADA (Layout Tree Medida):
  Cada nó tem:
  - intrinsic { width, height }
  - pref_width, min_width, max_width
  - layout props (padding, gap, align, etc.)
  - constraints do pai

SAÍDA (Render Tree):
  Cada nó tem:
  - x, y (posição absoluta)
  - width, height (dimensões finais)
  - meta (cores, estado, etc.)
  - children (filhos já posicionados)
```

### 5.3 Cálculo de x, y

```
layout(node, parent_x, parent_y, available_w, available_h):
    // Posição base
    node.x = parent_x + node.layout.padding.left + node.margin.left
    node.y = parent_y + node.layout.padding.top + node.margin.top

    // Largura final
    if node está em Columns:
        node.width = grid_calculation(node.layout.cols, total_width, gutter)
    else if node.layout.expand:
        node.width = available_w / siblings_count
    else if node.layout.fill:
        node.width = available_w - sum(other_siblings_pref_width)
    else:
        node.width = clamp(node.pref_width, node.min_width, available_w)

    // Altura final
    node.height = resolve_height(node, available_h)

    // Posicionar filhos (se container)
    if node is Container:
        layout_children(node)
```

### 5.4 Padding

```
Padding é aplicado no próprio nó:
  content_x = node.x + node.layout.padding.left
  content_y = node.y + node.layout.padding.top
  content_w = node.width  - node.layout.padding.left - node.layout.padding.right
  content_h = node.height - node.layout.padding.top  - node.layout.padding.bottom

Os filhos são posicionados DENTRO da área de conteúdo.
```

### 5.5 Gap

```
Gap é aplicado ENTRE filhos (não antes do primeiro, não depois do último):

VStack com gap G:
  cursor_y = content_y
  para cada filho:
      filho.y = cursor_y
      cursor_y += filho.height + G

HStack com gap G:
  cursor_x = content_x
  para cada filho:
      filho.x = cursor_x
      cursor_x += filho.width + G
```

### 5.6 Alinhamento

```
ALINHAMENTO HORIZONTAL (dentro de VStack):
  align_h = "left":
    filho.x = content_x
  align_h = "center":
    filho.x = content_x + (content_w - filho.width) / 2
  align_h = "right":
    filho.x = content_x + content_w - filho.width

ALINHAMENTO VERTICAL (dentro de HStack):
  align_v = "top":
    filho.y = content_y
  align_v = "center":
    filho.y = content_y + (content_h - filho.height) / 2
  align_v = "bottom":
    filho.y = content_y + content_h - filho.height
```

### 5.7 Anchor

```
Anchor é usado para posicionamento relativo:
  "top-left":     x, y = content_x, content_y
  "top-right":    x, y = content_x + content_w - child_w, content_y
  "bottom-left":  x, y = content_x, content_y + content_h - child_h
  "bottom-right": x, y = content_x + content_w - child_w, content_y + content_h - child_h
  "center":       x, y = content_x + (content_w - child_w)/2, content_y + (content_h - child_h)/2

Anchor não é usado por padrão. É um mecanismo reservado para:
- Badges flutuantes
- Indicadores de scroll (▲▼ nas bordas)
- Tooltips
```

### 5.8 Baseline

```
Baseline alignment é usado para alinhar texto de diferentes tamanhos:

  Em HStack com align_v = "baseline":
  - O primeiro filho com texto define a baseline
  - Os demais filhos são deslocados verticalmente para que a primeira
    linha de texto de cada um alinhe com a baseline

  Nota: Em terminal monoespaçado, "baseline" equivale a "top"
  porque todo texto tem exatamente 1 linha de altura.
  Reserve para uso futuro com texto multi-linha.
```

### 5.9 Offset

```
Offset é um deslocamento relativo APÓS o posicionamento normal:
  filho.x += child.layout.offset.x
  filho.y += child.layout.offset.y

Usado APENAS para ajustes finos determinados pelo Layout Pass.
NUNCA exposto como prop de componente.
```

### 5.10 Z-order

```
Z-order não existe na Layout Engine.
Todo layout é bidimensional (x, y).
Não há sobreposição de nós.

Exceção: indicadores de scroll (▲▼) são desenhados na mesma posição
que o conteúdo, mas em uma passada separada do Render Engine.

Se sobreposição for necessária no futuro:
- Implementar como "overlay" node com z-index explícito
- Overlays são posicionados depois de todos os nodes normais
- Overlays não afetam o fluxo de layout
```

---

## 6. Algoritmo de Layout

### 6.1 Ordem de Execução

```
1. CONSTRUIR LAYOUT TREE
   - Converter Component Tree em Layout Tree
   - Validar a árvore (tipos, restrições)
   - Atribuir ids únicos

2. MEASURE PASS (pós-ordem)
   - Folhas primeiro
   - Intrinsic sizes sobem
   - Constraints descem via parâmetros

3. LAYOUT PASS (pré-ordem)
   - Raiz primeiro
   - Coordenadas descem
   - Posições finais são atribuídas

4. CONSTRUIR RENDER TREE
   - Remover nós invisíveis (spacers, containers puros)
   - Aplicar truncamento
   - Aplicar overflow
   - Produzir árvore plana otimizada para renderização

5. ENTREGAR AO RENDER ENGINE
   - Render Tree imutável
   - Tudo calculado: x, y, w, h, content, meta
```

### 6.2 Recursão

```
MEASURE(node, constraints):
    se node é LEAF:          ← caso base
        return medida_leaf(node, constraints)

    se node é DATA:
        node.children = expand(node.data)   ← geração de filhos
        fall through para CONTAINER

    se node é CONTAINER:
        children_constraints = derive(node, constraints)
        para cada child em node.children:
            MEASURE(child, children_constraints)

        return medida_container(node, constraints)

LAYOUT(node, x, y, available_w, available_h):
    node.x = x + node.padding.left
    node.y = y + node.padding.top
    node.width = resolve_width(node, available_w)
    node.height = resolve_height(node, available_h)

    se node é CONTAINER:
        cursor = { x: node.content_x, y: node.content_y }
        para cada child em node.children (na direção do flow):
            LAYOUT(child, cursor.x, cursor.y, child_width, child_height)
            cursor = advance(cursor, child, node.gap, node.direction)
            se wrap necessário:
                cursor = new_line(cursor, node)
```

### 6.3 Complexidade

| Operação | Complexidade | Notas |
|----------|-------------|-------|
| Construir Layout Tree | O(n) | n = número de componentes |
| Measure Pass | O(n) | caso médio (árvore balanceada) |
| Measure Pass | O(n²) | pior caso (flex aninhado com resolução de conflitos) |
| Layout Pass | O(n) | sempre linear |
| Construir Render Tree | O(n) | percorrer uma vez |
| **Total** | **O(n)** | **caso médio** |
| **Total** | **O(n²)** | **pior caso** |

### 6.4 Resolução de Conflitos

```
CONFLITO: Soma dos pref_width dos filhos > content_width do pai

PASSOS:
1. Identificar filhos com flex > 0 (podem encolher)
2. Calcular excesso = sum(pref_width) - content_width
3. Se existem filhos flexíveis:
     reduzir cada filho flex por: excesso * flex / sum(flex)
   Se não existem filhos flexíveis:
     Se wrap é permitido:
         ativar wrap (quebrar linha)
     Senão:
         ativar truncamento nos filhos de menor prioridade
         (último filho primeiro)
4. Verificar se redução violou min_width de algum filho:
     Se sim: travar no min_width, redistribuir excesso restante

CONFLITO: Altura total dos filhos > content_height do pai

PASSOS:
1. Se overflow.y = "scroll": ativar scroll (pai ganha indicador)
2. Se overflow.y = "hidden": ocultar filhos excedentes
3. Se overflow.y = "truncate": truncar conteúdo do último filho visível
```

### 6.5 Prioridades

```
NA RESOLUÇÃO DE CONFLITOS:
1. min_width dos filhos NUNCA é violado
2. max_width dos filhos NUNCA é violado
3. padding do pai NUNCA é violado
4. gap entre filhos NUNCA é reduzido
5. pref_width de filhos com prioridade alta é mantido
6. pref_width de filhos com prioridade baixa é reduzido primeiro
7. Se ainda assim não couber: wrap (se permitido)
8. Se wrap não for permitido: truncar
9. Se truncar não for possível: esconder filho(s) de baixa prioridade

Prioridade padrão:
  Painéis e containers:    prioridade 10
  Labels de status:        prioridade 8
  Badges e tags:           prioridade 6
  Timestamps:              prioridade 4
  Metadados, placeholders: prioridade 2
  Spacers:                 prioridade 0 (sempre encolhem)
```

---

## 7. Sistema de Containers

### 7.1 Panel

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Container |
| **Direção** | Vertical (VStack interno) |
| **Aceita filhos** | 1 (exatamente 1) |
| **Borda** | Box-drawing `┌─┐│└─┘` |
| **Padding** | 0 (padding é do filho) |
| **Largura** | Grid ou auto |

**Layout interno:**

```
┌─────────────────────┐   ← y = panel.y, larga em panel.width
│  Título        ⋮ ✕  │   ← header (1 linha, se title não null)
├─────────────────────┤   ← divider (1 linha, se title não null)
│                     │
│  FILHO ÚNICO        │   ← conteúdo (altura variável)
│                     │
└─────────────────────┘   ← border bottom (1 linha)

Altura total:
  se header: 1 + 1 + filho.height + 1 = filho.height + 3
  sem header: filho.height + 2

Largura total: panel.width (definido por cols ou auto)
```

### 7.2 Columns

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Container |
| **Direção** | Horizontal (grid) |
| **Aceita filhos** | Row (1..N) |
| **Gutter** | 1 caractere |
| **Borda** | Nenhuma |
| **Padding** | 0 |

**Algoritmo de layout:**
```
1. Validar: todos os filhos são Row
2. Validar: sum(row.cols) == 12
3. Calcular gutter_total = (num_filhos - 1) * gutter = (N-1) * 1
4. Calcular col_width = (total_width - gutter_total) / 12
5. Para cada Row i:
     width_i = col_width * row_i.cols
     x_i = sum(width anterior) + i * gutter
     y_i = columns.y
     height_i = max(all_rows_heights)  (todas as rows têm a mesma altura)
```

### 7.3 Row

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Container |
| **Direção** | Herdada do pai (Columns → horizontal) |
| **Aceita filhos** | 1 (exatamente 1) |
| **Largura** | Grid (cols * column_width) |
| **Altura** | Determinada pelo filho |

**Regras:**
- Só pode existir dentro de Columns
- `cols` deve ser 1, 2, 3, 4, 6 ou 12
- Delega altura ao filho único
- Todas as Rows no mesmo Columns têm a mesma altura (altura da maior Row)

### 7.4 VStack

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Container |
| **Direção** | Vertical |
| **Aceita filhos** | 1..N |
| **Borda** | Nenhuma (use Panel) |
| **Wrap** | Não se aplica |

**Algoritmo de layout:**
```
1. Largura = content_width do pai
2. Altura = sum(filhos.height) + gaps_vertical + padding_vertical
3. Para cada filho em ordem:
     filho.width = content_width - padding_x
     filho.x = pai.content_x
     filho.y = cursor_y
     cursor_y += filho.height + gap
4. Alinhamento horizontal: aplicar align_h em cada filho

Comportamento com expand:
  Se VStack tem expand=true e altura conhecida:
    altura_restante = pai.content_height - sum(filhos.height) - gaps
    espaço_extra = altura_restante / count(filhos_com_expand)
    Cada filho com expand=true ganha espaço_extra na altura
```

### 7.5 HStack

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Container |
| **Direção** | Horizontal |
| **Aceita filhos** | 1..N |
| **Borda** | Nenhuma |
| **Wrap** | Configurável (prop wrap) |
| **Limit** | Máximo 12 filhos |

**Algoritmo de layout (sem wrap):**
```
1. Altura = max(filhos.height) + padding_vertical
2. Largura total = sum(filhos.width) + gaps_horizontal + padding_x
3. Para cada filho em ordem:
     filho.x = cursor_x
     filho.y = pai.content_y + align_v_offset(filho, max_height)
     cursor_x += filho.width + gap
4. Se total > pai.content_width:
     resolver conflito (§6.4)
```

**Algoritmo de layout (com wrap):**
```
1. Mesmo que acima, mas quando cursor_x + filho.width > pai.content_width:
     cursor_x = pai.content_x
     cursor_y += max_height_linha_anterior + gap_vertical
     filho.x = cursor_x
     filho.y = cursor_y
2. A altura total é a soma das alturas das linhas
```

### 7.6 Section

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Container |
| **Direção** | Vertical |
| **Aceita filhos** | 1..N |
| **Borda** | Linha separadora `────` antes do título |
| **Padding** | 0 |

**Layout:**
```
Se title não null:
  linha 0: ──────── Título ────────  (divider com label)
Se collapsible e collapsed:
  não renderizar filhos
Senão:
  renderizar filhos verticalmente (VStack layout)
```

### 7.7 Header

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Leaf (não aceita filhos) |
| **Altura** | 1 linha |
| **Largura** | Content (fill no pai se dentro de Panel) |
| **Padding** | 1 caractere (esquerda e direita) |

**Layout:**
```
x = pai.x + padding_left
y = pai.y + padding_top
width = pai.width - padding_left - padding_right
height = 1

Conteúdo:
  [icon] [title] [spacer] [actions]
  Onde actions são ⋮ ⇕ ✕ alinhados à direita
```

### 7.8 Footer

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Container |
| **Direção** | Horizontal (HStack interno) |
| **Altura** | 1 linha |
| **Aceita filhos** | 1..N |

**Layout:**
```
left_content = filhos com alinhamento left
right_content = filhos com alinhamento right

x = pai.x + padding_left
y = pai.y + padding_top
width = pai.width - padding_left - padding_right
height = 1

left_content.x = pai.content_x
right_content.x = pai.content_x + pai.content_width - sum(right_widths) - gaps
```

### 7.9 Dashboard

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Container |
| **Direção** | Horizontal | wrap |
| **Aceita filhos** | Panel (1..10) |
| **Largura** | 100% (Fill) |
| **Altura** | Determinada pelos widgets |

**Algoritmo de layout:**
```
1. Receber lista de widgets com {panel, width, min_width, order}
2. Ordenar por order
3. Para cada breakpoint, calcular largura real de cada widget:
     terminal_largura ≥ 180: cada widget mantém width original
     terminal_largura 140-179: widgets com width > 6 são ajustados para 6
     terminal_largura 100-139: widgets com width > 4 são ajustados para 4
     terminal_largura 80-99:   todos width = 12 (empilhados)
     terminal_largura < 80:    dashboard invisível (collapsed)
4. Se a soma das larguras excede 12:
     quebrar linha (wrap automático)
5. Cada widget ocupa sua largura em colunas
6. Altura do dashboard = max(altura dos widgets em cada linha)
```

### 7.10 Spacer

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Leaf |
| **Largura intrínseca** | 0 |
| **Flex** | 1 (padrão) |
| **Comportamento** | Expande para ocupar espaço restante |

**Layout:**
```
Em HStack:
  spacer.width = pai.content_width - sum(pref_width_dos_outros_filhos) - gaps
  Se múltiplos spacers: dividir espaço igualmente por flex

Em VStack:
  spacer.height = pai.content_height - sum(pref_height_dos_outros_filhos) - gaps
```

### 7.11 Divider

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | Leaf |
| **Altura** | 1 linha |
| **Largura** | Content (fill do pai) |
| **Conteúdo** | `─────` ou `───── label ─────` |

**Layout:**
```
width = pai.content_width
x = pai.content_x
y = pai.content_y

Se label é null:
  content = "─" * width

Se label não é null:
  content = "─" * 2 + " " + label + " " + "─" * (width - len(label) - 4)
```

---

## 8. Sistema Flex

### 8.1 Flex Properties

Cada LayoutNode pode ter as seguintes propriedades flex:

| Propriedade | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `flex_grow` | `number` | 0 | Proporção de espaço extra que o nó absorve |
| `flex_shrink` | `number` | 1 | Proporção de espaço que o nó cede quando encolhe |
| `flex_basis` | `number \| null` | `null` | Tamanho base antes da distribuição flex |

### 8.2 Flex Container

Quando um HStack ou VStack tem pelo menos um filho com `flex_grow > 0` ou `flex_shrink > 0`, ele é um **flex container**.

**Algoritmo flex:**
```
1. DISRIBUIÇÃO INICIAL:
   Para cada filho:
     se flex_basis está definido → tamanho_base = flex_basis
     senão → tamanho_base = pref_width (ou pref_height para VStack)

2. ESPAÇO EXTRA:
   espaço_total = pai.content_size - sum(tamanho_base) - gaps
   se espaço_total > 0 (sobra):
     Para cada filho com flex_grow > 0:
         extra = espaço_total * flex_grow / sum(flex_grow)
         filho.width (ou height) = tamanho_base + extra
   se espaço_total < 0 (falta):
     Para cada filho com flex_shrink > 0:
         redução = abs(espaço_total) * flex_shrink / sum(flex_shrink)
         filho.width (ou height) = tamanho_base - redução
         Se resultado < min_width: travar em min_width

3. RESOLUÇÃO:
   Repetir passo 2 se algum filho foi travado em min_width
   (espaço restante redistribuído entre os não-travados)
```

### 8.3 Justify Content

| Valor | Comportamento |
|-------|---------------|
| `"start"` | Filhos agrupados no início do container |
| `"end"` | Filhos agrupados no final |
| `"center"` | Filhos centralizados |
| `"space-between"` | Primeiro no início, último no final, gap igual entre os demais |
| `"space-around"` | Espaço igual ao redor de cada filho |
| `"space-evenly"` | Espaço idêntico entre todos os filhos e bordas |

**Cálculo para space-between:**
```
Se N filhos e espaço_restante = content_width - sum(filhos) - gaps_minimos:
  gap_extra = espaço_restante / (N - 1)
  gap_total = gap_minimo + gap_extra
```

### 8.4 Align Items

| Valor | Comportamento |
|-------|---------------|
| `"stretch"` | Filhos esticam para preencher a altura (HStack) ou largura (VStack) |
| `"start"` | Filhos alinhados ao início do eixo transversal |
| `"end"` | Filhos alinhados ao final |
| `"center"` | Filhos centralizados no eixo transversal |
| `"baseline"` | Filhos alinhados pela baseline do texto |

### 8.5 Resumo Flex

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLEX CONTAINER (HStack)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  start:       [A] [B] [C]                                       │
│  end:                                    [A] [B] [C]           │
│  center:                     [A] [B] [C]                        │
│  space-between:  [A]            [B]            [C]              │
│  space-around:   [A]     [B]     [C]                            │
│  space-evenly:    [A]    [B]    [C]                             │
│                                                                  │
│  align=stretch:  ┌───┐ ┌───┐ ┌───┐                              │
│                  │ A │ │ B │ │ C │  (todos altura = container)  │
│                  └───┘ └───┘ └───┘                              │
│                                                                  │
│  align=center:    ┌───┐   ┌───┐   ┌───┐                        │
│                   │ A │   │ B │   │ C │  (centralizados vert)  │
│                   └───┘   └───┘   └───┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Grid

### 9.1 Sistema de Grid (12 Colunas)

O sistema de grid é implementado pelo componente `Columns` + `Row`.

```
view_width = terminal_width (caracteres)
gutter = 1 (caractere)
num_cols = 12
num_rows = número de Rows dentro de Columns

col_width = (view_width - (num_rows - 1) * gutter) / num_cols

Row com cols = N:
  width = N * col_width
  x = sum(widths_das_rows_anteriores) + row_index * gutter
```

### 9.2 Pesos

Pesos são frações do grid. Equivalem a colunas:

```
Peso 1  = 1/12  ≈  8.33%
Peso 2  = 2/12  ≈ 16.67%
Peso 3  = 3/12  =  25%
Peso 4  = 4/12  ≈ 33.33%
Peso 6  = 6/12  =  50%
Peso 12 = 12/12 = 100%
```

### 9.3 Frações

Frações permitem sub-divisão dentro de uma Row:

```
Row(width: 6) = 50% do terminal
  └── Sub-grid interno (6 colunas)
      ├── SubRow(width: 2)  → 2/6 = 33% da Row
      └── SubRow(width: 4)  → 4/6 = 66% da Row

Frações válidas: 1, 2, 3, 4, 6 (sub-múltiplos de 6)
Soma das frações dentro de uma Row = largura da Row em colunas
```

### 9.4 Gap no Grid

```
Columns(gutter: 1):
  gap_horizontal = 1 caractere entre cada Row
  gap_vertical = 0 (Rows não empilham verticalmente)

Dashboard(widgets):
  gap = 2 caracteres entre widgets (sm)
  wrap: quebra linha automaticamente
```

### 9.5 Auto Sizing

```
O grid pode calcular automaticamente a largura de Rows quando
apenas algumas são especificadas:

Columns (3 Rows: width=4, width=4, width=auto):
  Row 1: 4 colunas
  Row 2: 4 colunas
  Row 3: auto = 12 - 4 - 4 - 2*gutter = 4 colunas

Auto distribui igualmente o espaço restante:
  Se 2 Rows com auto em um Columns(12):
    cada auto = (12 - gutter) / 2 = 5.5 → não inteiro → inválido
  (Auto só funciona quando o resultado é um valor válido de coluna)
```

### 9.6 Overflow no Grid

```
Se o conteúdo de uma Row excede a largura calculada:
1. Ativar overflow horizontal no conteúdo da Row
2. Truncar com "…" se overflow.x = "truncate"
3. Wrap se o conteúdo permitir (ex: HStack com wrap)
4. O grid em si nunca é alterado — a Row tem largura fixa
```

---

## 10. Responsividade

### 10.1 Breakpoints

```
BREAKPOINTS:
  xs:  0-79   → "mobile" do terminal
  sm:  80-99  → terminal pequeno
  md:  100-139 → terminal médio (padrão)
  lg:  140-179 → terminal grande
  xl:  180+   → terminal extra grande

Cálculo do breakpoint atual:
  breakpoint = medir terminal_width
  se width < 80:    → xs
  se width < 100:   → sm
  se width < 140:   → md
  se width < 180:   → lg
  senão:            → xl
```

### 10.2 Reflow por Breakpoint

```
CADA COMPONENTE PODE TER LAYOUTS DIFERENTES POR BREAKPOINT:

Panel:
  xl:  width original
  lg:  width = min(width, 6)
  md:  width = min(width, 4)
  sm:  width = 12
  xs:  invisível

Dashboard:
  xl:  widgets lado a lado, até 3 colunas
  lg:  widgets lado a lado, até 2 colunas
  md:  widgets lado a lado, 1-2 colunas
  sm:  widgets empilhados (1 coluna)
  xs:  dashboard escondido

Painel Lateral:
  xl:  largura C1-3 (25%)
  lg:  largura C1-2 (16%)
  md:  largura C1-2 (16%)
  sm:  colapsável (toggle)
  xs:  escondido
```

### 10.3 Estados de Layout

```
COMPACT:
  - Apenas Z0 + Z4 (2 linhas)
  - Dashboard escondido
  - Painel lateral escondido
  - Atalho: Ctrl+Shift+C ou comando :compact

NORMAL:
  - Z0 + Z1 (dashboard parcial) + Z4
  - Painel lateral visível (se largura ≥ sm)
  - Widgets no dashboard: até 4
  - Atalho: Ctrl+Shift+D ou comando :normal

EXPANDED:
  - Todas as zonas
  - Painel lateral expandido (C1-3)
  - Dashboard completo
  - Widgets: até 10
  - Atalho: Ctrl+Shift+E ou comando :expand
```

### 10.4 Collapse e Hide

```
COLLAPSE (reduz a um header):
  Section:    mostra apenas o título
  Panel:      mostra apenas o header (se existir)
  Dashboard:  escondido
  Indicador:  "▶" ou "▼" no header

HIDE (remove do layout):
  O nó não existe na Layout Tree para o breakpoint atual
  Dados não são perdidos — o nó é simplesmente não renderizado
  Widgets ocultos por breakpoint são HIDE, não COLLAPSE
```

### 10.5 Prioridade de Visibilidade

```
Quando um widget precisa ser ocultado por falta de espaço:

1. Ocultar widgets com prioridade mais baixa primeiro
2. Se ainda precisar de espaço: ocultar o widget mais largo
3. Se ainda precisar: ocultar widgets que podem ser substituídos por ícone
4. Último a ser ocultado: widget de tarefas ativas

Prioridades padrão dos widgets:
  FocusWidget:    prioridade 100 (nunca ocultar)
  GitSummary:     prioridade 90
  TaskList:       prioridade 80
  StatusIndicator:prioridade 70
  ActivityWidget: prioridade 50
  WeekChart:      prioridade 30
  EmptyState:     prioridade 10 (sempre ocultar antes)
```

---

## 11. Overflow

### 11.1 Comportamentos de Overflow

| Modo | Eixo | Comportamento |
|------|------|---------------|
| `visible` | ambos | Conteúdo extravasa o container (nunca usado — terminal não permite) |
| `hidden` | x, y | Conteúdo além do limite é simplesmente ignorado |
| `truncate` | x | Conteúdo é truncado com `…` |
| `wrap` | x | Conteúdo quebra para a próxima linha |
| `scroll` | y | Container ganha scroll, indicadores ▲▼ aparecem |

### 11.2 Overflow Horizontal

```
TRUNCATE (padrão para labels, headers, status bars):
  se text.length > available_width:
      text_visivel = text[0:available_width-1] + "…"
  "…" (U+2026) conta como 1 caractere de largura

WRAP (HStack com wrap=true):
  se cursor_x + child_width > container_x + container_width:
      cursor_x = container.content_x
      cursor_y += max_child_height_linha_anterior + gap_vertical
      child.x = cursor_x
      child.y = cursor_y

HIDDEN (tabelas, listas sem scroll):
  linhas ou colunas que excedem o container não são renderizadas
  O container mantém seu tamanho calculado
```

### 11.3 Overflow Vertical

```
SCROLL (listas, timeline, logs):
  container.height = min(conteudo.height, max_height_prop)
  Se conteudo.height > container.height:
      scroll_offset = controlado externamente
      indicador_scroll ▲ se scroll_offset > 0
      indicador_scroll ▼ se scroll_offset + container.height < conteudo.height

HIDDEN (widgets no dashboard):
  Se o conteúdo excede a altura do widget:
      linhas excedentes não são renderizadas
      Nenhum indicador de scroll (widget não scrolla)

TRUNCATE (labels multi-linha):
  Se o texto tem mais linhas que available_height:
      renderizar até available_height - 1 linhas + "…" na última
```

### 11.4 Indicadores de Scroll

```
Posição: última linha do container, canto direito
  ▲  → scroll up disponível
  ▼  → scroll down disponível
  ▲▼ → ambos disponíveis

Renderização:
  O indicador substitui o último caractere da última linha
  Se a última linha é uma borda (Panel), o indicador substitui
  o caractere de borda no canto inferior direito

  Exemplo:
  ┌─────────────────────┐
  │ Item 1              │
  │ Item 2              │
  │ Item 3          ▼  │  ← scroll down disponível
  └─────────────────────┘
```

### 11.5 Overflow em Containers Aninhados

```
Container pai  (overflow: hidden)
└── Container filho  (overflow: scroll)
    ├── Item 1
    ├── Item 2
    └── ... (20 itens)

Regra:
  O scroll é do container filho, não do pai.
  A altura do pai limita a área visível do filho.
  O filho gerencia seu próprio scroll internamente.
```

### 11.6 Regras de Decisão de Overflow

| Componente | Overflow X | Overflow Y |
|-----------|-----------|------------|
| Panel | truncate | hidden |
| Header | truncate | hidden |
| Footer | truncate | hidden |
| VStack | truncate | hidden (ou scroll via Panel) |
| HStack | wrap (config) | hidden |
| Label | truncate | hidden |
| Badge | truncate | hidden |
| ProgressBar | truncate | hidden |
| List | truncate | scroll (se max_height) |
| TaskList | truncate | scroll (se max_height) |
| Table | truncate | scroll (se max_height) |
| Tree | truncate | scroll (se max_height) |
| Timeline | truncate | scroll (se max_height) |
| Dashboard | wrap (automático) | hidden |
| Section | truncate | hidden |

---

## 12. Regras de Espaçamento

### 12.1 Padding

```
Padding é espaço INTERNO entre a borda do container e seu conteúdo.

VALORES VÁLIDOS (caracteres/linhas):
  Spacing.zero  → 0
  Spacing.xs    → 1
  Spacing.sm    → 2
  Spacing.md    → 3
  Spacing.lg    → 4
  Spacing.xl    → 6

PADDING POR COMPONENTE:
  Panel:        (0, 0)  — o filho gerencia padding
  VStack:       (0, 0)  — configurável via prop padding
  HStack:       (0, 0)  — configurável via prop padding
  Header:       (1, 0)  — fixo: 1 char left e right
  Footer:       (1, 0)  — fixo: 1 char left e right
  Badge:        (1, 0)  — fixo: 1 char left e right
  ProgressBar:  (0, 0)  — sem padding

CÁLCULO:
  content_width  = node.width  - padding.left - padding.right
  content_height = node.height - padding.top  - padding.bottom
  content_x      = node.x + padding.left
  content_y      = node.y + padding.top
```

### 12.2 Margin

```
Margin NÃO EXISTE como prop de componente.

Espaçamento entre componentes é gerenciado exclusivamente por:
- gap (VStack, HStack)
- gutter (Columns)
- Spacer (flexível)

REGRAS:
  Nenhum componente pode ter margin.
  Se um componente precisa de espaço ao redor, use gap do pai.
  Se gap não é suficiente, use Spacer.
  Se precisa de espaço exato, crie um container com padding.
```

### 12.3 Gap

```
Gap é espaço ENTRE filhos de um container.

VALORES VÁLIDOS:
  Spacing.zero  → 0
  Spacing.xs    → 1
  Spacing.sm    → 2
  Spacing.md    → 3
  Spacing.lg    → 4

GAP PADRÃO:
  VStack:  gap = Spacing.sm (2)
  HStack:  gap = Spacing.xs (1)
  Columns: gutter = Spacing.xs (1)
  Dashboard: gap = Spacing.sm (2)

CÁLCULO (VStack com N filhos e gap G):
  total_gaps = (N - 1) * G
  total_height = sum(filhos.height) + total_gaps + padding_top + padding_bottom
```

### 12.4 Indentação

```
Indentação é padding_left adicional baseado no nível hierárquico.

NÍVEIS:
  Nível 0: 0 caracteres
  Nível 1: 2 caracteres
  Nível 2: 4 caracteres
  Nível 3: 6 caracteres (máximo)

APLICAÇÃO:
  Tree:       cada nível de profundidade adiciona 2 chars de indentação
  TaskList:   subtarefas ganham 2 chars por nível
  List:       configurável (padrão 0)

CÁLCULO:
  item.x = container.content_x + (nivel * 2)
  item.width = container.content_width - (nivel * 2)
```

### 12.5 Whitespace

```
Whitespace é o espaço entre caracteres DENTRO de um texto.
Em terminal monoespaçado, whitespace é sempre 0.

Exceções:
  Badge:  " EM_ANDAMENTO "  (1 espaço antes e depois)
  Divider: "───── label ─────"  (1 espaço antes e depois do label)
  Stat:   "label: valor"  (1 espaço após ":")
```

### 12.6 Baseline

```
Baseline é usado para alinhamento vertical de texto em HStack.

CÁLCULO:
  Para texto de 1 linha (todo texto em terminal):
    baseline = 0 (topo da linha)

  Para texto multi-linha (futuro):
    baseline = (linha_altura - 1) * 0.8  (80% da altura)

  A baseline de todos os filhos deve coincidir:
    filho.y = pai.content_y + (max_baseline - filho.baseline)
```

---

## 13. Layout Invariants

### 13.1 Invariantes de Estrutura

| # | Invariante | Violação |
|---|------------|----------|
| 1 | A soma das larguras (widths) de todas as Row dentro de Columns é sempre 12. | Qualquer soma ≠ 12 é erro na construção. |
| 2 | A Layout Tree é sempre uma árvore (um root, sem ciclos). | Ciclo = erro fatal. |
| 3 | Todo nó tem exatamente um pai, exceto o root (que tem zero). | Nó com 2 pais ou órfão (não-root) = erro. |
| 4 | ContainerNodes têm zero ou mais filhos. LeafNodes têm sempre zero. | LeafNode com filho = erro. |
| 5 | Panel tem exatamente 1 filho. | Panel com 0 ou 2+ filhos = erro. |
| 6 | Row tem exatamente 1 filho. | Row com 0 ou 2+ filhos = erro. |
| 7 | Columns só aceita Row como filho. | Columns com Label dentro = erro. |
| 8 | Dashboard só aceita Panel como filho. | Dashboard com VStack dentro = erro. |

### 13.2 Invariantes de Medição

| # | Invariante | Violação |
|---|------------|----------|
| 9 | A largura de qualquer nó é sempre ≤ largura do terminal. | Nó mais largo que o terminal = bug no Measure Pass. |
| 10 | min_width ≤ pref_width ≤ max_width para todo nó. | Ordem violada = erro de cálculo. |
| 11 | Intrinsic.width > 0 para todo nó exceto Spacer. | Label com texto vazio = erro de dados (mas não da Engine). |
| 12 | A altura mínima de qualquer nó é 1 linha. | Nó com altura 0 = erro. |
| 13 | A altura do conteúdo total nunca excede a altura do terminal sem overflow explícito. | Se exceder e overflow não está configurado, a engine DEVE truncar ou ocultar. |
| 14 | padding + gap + sum(filhos) ≤ container.width. | Se violado, o container está encolhendo os filhos além do permitido. |

### 13.3 Invariantes de Posicionamento

| # | Invariante | Violação |
|---|------------|----------|
| 15 | Nenhum nó pode ter x < 0 ou y < 0. | Nó fora da viewport = erro de posicionamento. |
| 16 | Nenhum nó pode ter x + width > terminal_width (sem overflow). | Nó extravasando = erro. |
| 17 | Nenhum nó pode ter y + height > terminal_height (sem overflow). | Nó extravasando = erro. |
| 18 | Filhos de VStack têm x ≥ pai.content_x. | Filho fora do content area = erro. |
| 19 | Filhos de HStack têm y ≥ pai.content_y. | Filho fora do content area = erro. |
| 20 | x, y, width, height são sempre inteiros. | Coordenadas fracionárias = erro (terminal não suporta). |

### 13.4 Invariantes de Borda (Box-drawing)

| # | Invariante | Violação |
|---|------------|----------|
| 21 | Todo canto de borda (┌┐└┘) deve ter uma linha conectando em ambos os lados. | Canto solto = borda quebrada. |
| 22 | Linhas horizontais (─) e verticais (│) devem se conectar em junções (├┤┬┴┼) sem gaps. | Gap entre bordas = erro de cálculo. |
| 23 | A borda externa de um Panel nunca intersecta a borda de outro Panel. | Bordas colidindo = erro de layout. |
| 24 | A espessura de toda borda é exatamente 1 caractere. | Borda com 2 caracteres = erro (terminal box-drawing é 1 caractere). |

### 13.5 Invariantes de Espaçamento

| # | Invariante | Violação |
|---|------------|----------|
| 25 | Padding, gap, gutter e margin usam exclusivamente tokens do sistema de espaçamento. | Valor hardcoded = violação do design system. |
| 26 | O gap entre o primeiro filho e a borda do container é sempre o padding, nunca o gap. | Gap aplicado antes do primeiro filho = erro. |
| 27 | O gap entre o último filho e a borda do container é sempre o padding, nunca o gap. | Gap aplicado depois do último filho = erro. |
| 28 | Indentação é sempre múltiplo de 2. | Indentação ímpar = erro. |

### 13.6 Invariantes de Responsividade

| # | Invariante | Violação |
|---|------------|----------|
| 29 | Em breakpoint xs (< 80), o estado é sempre Compacto. | Dashboard visível em xs = erro. |
| 30 | Em breakpoint sm (80-99), a largura de qualquer widget é sempre 12 (empilhado). | Widget lado a lado em sm = erro. |
| 31 | O painel lateral NUNCA é visível em breakpoint xs. | Painel lateral em xs = erro. |
| 32 | O painel lateral tem sempre exatamente 16% (C1-2) em modo Normal e 25% (C1-3) em Expandido. | Qualquer outra largura = erro. |
| 33 | Z0 e Z4 têm sempre exatamente 1 linha de altura. | Z0/Z4 com altura ≠ 1 = erro. |

### 13.7 Invariantes de Render Tree

| # | Invariante | Violação |
|---|------------|----------|
| 34 | A Render Tree nunca contém nós com tipo "vstack", "hstack", "section" ou "spacer". | Nós de layout puro na Render Tree = erro (devem ser removidos). |
| 35 | A Render Tree nunca contém nós sobrepostos (mesma posição x,y). | Dois nós no mesmo lugar = erro (exceto indicadores de scroll). |
| 36 | A ordem dos nós na Render Tree é top-to-bottom, left-to-right. | Nó fora de ordem = erro de renderização. |
| 37 | Todo RenderNode tem content não-vazio OU children não-vazio. | Nó vazio = erro. |

### 13.8 Invariantes de Performance

| # | Invariante | Violação |
|---|------------|----------|
| 38 | O Measure Pass nunca percorre o mesmo nó duas vezes. | Caminho duplicado = erro de recursão. |
| 39 | O Layout Pass nunca percorre o mesmo nó duas vezes. | Caminho duplicado = erro de recursão. |
| 40 | A altura total da saída nunca excede terminal_height (sem scrolling explícito). | Se exceder, a engine DEVE limitar. |
| 41 | Nenhum nó é criado sem ser visitado pelo Measure Pass. | Nó não medido na Render Tree = erro. |

---

## 14. Casos Extremos

### 14.1 Terminal Muito Pequeno (< 50 caracteres)

```
Comportamento:
  - Breakpoint xs é ativado
  - Dashboard escondido (Z1: 0 linhas)
  - Painel lateral escondido
  - Estado Compacto forçado (Z0 + Z4 apenas)
  - Labels truncados agressivamente (max 20 chars)
  - Nomes de branch truncados para 10 chars
  - Timers em formato reduzido: "12:34" em vez de "00:12:34"
  - Z4: remover metadados menos importantes (build version)
  - Z0: ocultar contadores de tarefas após o nome

  Se width < 40:
    - Truncar tudo para 30% da largura
    - Remover ícones (fallback para texto)
    - Z0: apenas branch + path
    - Z4: apenas status do servidor

  Se width < 20:
    - Irredutível. Indicar "Terminal muito pequeno" na Z0.
```

### 14.2 Terminal Enorme (> 300 caracteres)

```
Comportamento:
  - Breakpoint xl ativado
  - Painel lateral expandido (C1-3 = 25%)
  - Widgets no dashboard em grid 3-4 colunas
  - Labels NÃO são esticados além do intrinsic
  - Colunas de tabela mantêm largura definida (não esticam)
  - O terminal NUNCA deve ficar "vazio" por ser grande demais
  - Whitespace extra é aceitável, desde que o layout não quebre
  - Máximo de 12 widgets no dashboard (limite de grid)
  - Após 12 widgets, os excedentes são ocultados

  Efeitos colaterais proibidos:
    - Labels não podem "esticar" além do conteúdo
    - Painéis não podem ter largura maior que o necessário
    - Espaçamento entre elementos não deve crescer proporcionalmente
```

### 14.3 Unicode

```
Problema:
  - Emojis (U+1Fxxx) têm largura 2 em muitos terminais
  - Box-drawing (U+2500-257F) tem largura 1
  - Alguns terminais não suportam Nerd Font

Regras:
  1. A Layout Engine TRATA TODO CARACTERE COMO LARGURA 1.
  2. O ajuste de largura de Unicode é responsabilidade do Render Engine.
  3. Se um caractere tem largura 2, o Render Engine ajusta a posição.
  4. A Layout Engine nunca falha por causa de Unicode.
  5. Fallback é obrigatório para todo caractere Unicode fora da faixa U+2500-27BF.

Medição de largura:
  - len("●") = 1 para a Layout Engine
  - len("📋") = 1 para a Layout Engine
  - Render Engine converte: ● → 1 célula, 📋 → 2 células
  - Se o Render Engine detecta quebra de layout por Unicode, reporta erro
```

### 14.4 ANSI

```
Problema:
  - Códigos ANSI não ocupam espaço visual
  - Mas estão presentes na string de conteúdo

Regras:
  1. Códigos ANSI SÃO REMOVIDOS antes da medição.
  2. A Layout Engine mede APENAS o texto visível.
  3. O Render Engine reinsere ANSI codes durante a renderização.
  4. Um Label com text = "\033[32mOlá\033[0m" tem largura 3.
  5. Códigos ANSI nunca afetam o layout.
```

### 14.5 Strings Enormes

```
Problema:
  - Um Label com texto de 10.000 caracteres
  - Nome de arquivo com 500 caracteres

Regras:
  1. A medição SEMPRE trunca no max_width do container.
  2. Se não há max_width, o limite é terminal_width - padding.
  3. NUNCA meça o texto completo se ele excede o container.
  4. "Preguiça" na medição: meça apenas o que cabe.
  5. Se text.length > terminal_width, meça apenas terminal_width.
  6. Truncamento é O(1) — não precisa percorrer toda a string.

Comportamento:
  Label(text = 10.000 chars, dentro de Panel(width: 40)):
    - Medir apenas 40 - padding = 38 caracteres
    - Truncar para 37 + "…" = 38 caracteres
    - Tempo de medição: O(1), não O(10.000)
```

### 14.6 Sem Dados

```
Problema:
  - TaskList com tasks = []
  - GitSummary em diretório sem Git
  - Servidor offline, sem métricas

Regras:
  1. Dados vazios produzem EmptyState.
  2. EmptyState tem altura fixa de 3 linhas.
  3. O EmptyState nunca quebra o layout do container pai.
  4. Se o pai tem altura fixa e EmptyState é maior, truncar.

Comportamento:
  VStack
  ├── Panel(title: "Tarefas")
  │   └── EmptyState("— Nenhuma tarefa pendente")
  └── Panel(title: "Git")
      └── EmptyState("— Fora de um repositório Git")

  A altura de cada Panel é 3 (borda) + 3 (empty) = 5 linhas.
```

### 14.7 Milhares de Tarefas

```
Problema:
  - TaskList com 10.000 tarefas

Regras:
  1. A prop max_tasks limita a exibição (padrão: 10).
  2. O dado completo nunca é passado para a Layout Engine.
  3. O Dashboard Engine envia apenas max_tasks itens.
  4. Scroll é gerenciado externamente (Dashboard Engine mantém offset).
  5. A Layout Engine nunca sabe quantas tarefas existem no total.

Comportamento:
  - Layout Engine recebe exatamente 10 tarefas
  - Medição: 10 * altura_item + 9 * gap = altura total
  - Render Tree: 10 itens + indicador "📋 Tarefas (10.000)" no header
  - Performance: O(10), não O(10.000)
```

### 14.8 Widgets Ocultos

```
Problema:
  - Widget escondido em breakpoint sm, visível em md
  - Alternância entre estados Compact/Normal/Expandido

Regras:
  1. Widget oculto não existe na Layout Tree para aquele breakpoint.
  2. A transição é instantânea (não há animação).
  3. Widgets ocultos não ocupam espaço — a árvore é reconstruída.
  4. Nenhum estado é perdido — os dados permanecem no Dashboard Engine.

Comportamento:
  Breakpoint md (100 chars):
    Dashboard
    ├── Panel(tasks, width: 6)        ← visível
    ├── Panel(git, width: 6)          ← visível
    └── Panel(activity, width: 12)    ← visível (empilhado)

  Breakpoint sm (90 chars):
    Dashboard
    ├── Panel(tasks, width: 12)       ← visível
    ├── Panel(git, width: 12)         ← visível (empilhado)
    └── Panel(activity)               ← NÃO EXISTE na árvore
```

### 14.9 Repositório Git Gigante

```
Problema:
  - 500 arquivos modificados
  - Branch com 100 commits ahead

Regras:
  1. GitSummary mostra apenas contadores (+500 ~34 -12).
  2. A lista de arquivos NUNCA é renderizada inline no GitSummary.
  3. A lista de arquivos é um widget separado (List ou Tree).
  4. Esse widget tem max_items padrão de 10.
  5. O contador mostra o total real ("+500"), mas apenas 10 itens são visíveis.

Comportamento:
  GitSummary(branch: "main", added: 500, modified: 34, deleted: 12)
  → ⎇ main │ +500 ~34 -12       ← sempre comprimido

  Tree(nodes: [...500 arquivos...], max_items: 10)
  → Mostra 10 arquivos + "… e mais 490 arquivos"
```

### 14.10 Nome de Branch Enorme

```
Problema:
  - Branch: "feature/THINKER-4217-refatora-modulo-de-autenticacao-com-2fa-e-oauth2"

Regras:
  1. Truncar para 25 caracteres: "feature/THINKER-4217-refa…"
  2. Se o terminal é muito largo (xl), truncar para 40.
  3. O nome completo está disponível em tooltip.
  4. NUNCA quebrar linha no nome da branch.

Comportamento:
  Largura < 140:  truncar para 25 caracteres
  Largura ≥ 140:  truncar para 40 caracteres
  Largura ≥ 180:  truncar para 60 caracteres (raro)
```

### 14.11 Mensagens de Commit Enormes

```
Problema:
  - "feat: implementa refatoração completa do módulo de autenticação com suporte a 2FA e OAuth2"

Regras:
  1. Truncar para 60 caracteres na primeira linha.
  2. Apenas a primeira linha do commit é exibida.
  3. O corpo do commit nunca é exibido inline.
  4. Tooltip com o commit completo (futuro: expandir com atalho).

Comportamento:
  "feat: implementa refatoração completa do módulo de aut…"  (60 chars)
```

---

## 15. Performance

### 15.1 Complexidade Esperada

| Cenário | Nós na Árvore | Measure Pass | Layout Pass | Total |
|---------|---------------|-------------|-------------|-------|
| Terminal vazio | 10 | O(10) | O(10) | O(10) |
| Terminal com dashboard + widgets | 50 | O(50) | O(50) | O(50) |
| Terminal expandido com todos os widgets | 200 | O(200) | O(200) | O(200) |
| Lista com scroll (max_items = 100) | 300 | O(300) | O(300) | O(300) |
| Pior caso (flex aninhado profundo) | 200 | O(200²) | O(200) | O(40.000) |

**Tempo esperado para 200 nós:** < 1ms em qualquer linguagem compilada ou interpretada.

### 15.2 Caching

```
A Layout Engine NÃO faz caching de resultados.

Motivos:
  1. A árvore é completamente substituída a cada ciclo.
  2. A saída é sempre determinística para a mesma entrada.
  3. Caching adicionaria complexidade sem ganho significativo (< 200 nós).
  4. Estado global de cache quebraria a imutabilidade.

Exceção:
  Se, no futuro, o número de nós exceder 5.000:
    - Implementar cache por subárvore para subárvores imutáveis
    - Hash da subárvore + viewport = resultado em cache
    - Invalidar quando qualquer nó da subárvore mudar
  Por enquanto: não implementar cache.
```

### 15.3 Invalidation

```
Invalidation NÃO EXISTE na Layout Engine.

Motivo:
  A árvore é totalmente substituída a cada ciclo.
  Não há "atualização parcial" que precise invalidar.

Fluxo:
  1. Evento externo (timer, tecla, dado novo)
  2. Dashboard Engine produz nova Component Tree
  3. Layout Engine produz nova Layout Tree
  4. Measure + Layout Pass
  5. Nova Render Tree
  6. Render Engine renderiza
  7. Árvore anterior é descartada (GC)
```

### 15.4 Reflow

```
Um reflow é uma execução completa do pipeline:
  Component Tree → Layout Tree → Measure → Layout → Render Tree

Quando ocorre um reflow:
  1. Redimensionamento do terminal
  2. Mudança de breakpoint
  3. Estado do componente muda (loading → data → empty)
  4. Dados são atualizados (novas tarefas, novo git status)
  5. Usuário alterna entre Compact/Normal/Expanded
  6. Widget é adicionado/removido do dashboard

Frequência máxima esperada:
  - Timer de tarefas: 1 reflow por segundo  (atualização de timer)
  - Redimensionamento: 1 reflow por evento de resize
  - Dados: 1 reflow por resposta de API
  - Input do usuário: 1 reflow por comando

Em condições normais: 1-5 reflows por segundo.
Em pico (timer + resize + dados simultâneos): 10 reflows por segundo.
```

### 15.5 Repaint

```
A Layout Engine NÃO faz repaint.

Repaint é responsabilidade exclusiva do Render Engine.

A Layout Engine apenas recalcula a Render Tree.
Se a árvore não mudou, não há necessidade de repaint.
Se a árvore mudou, a Render Tree é substituída e o Render Engine decide
se precisa redesenhar ou não.
```

### 15.6 Incremental Layout

```
Layout incremental NÃO EXISTE.

A árvore é sempre completamente recalculada.

Se no futuro a árvore crescer além de 5.000 nós:
  - Implementar dirty flags por subárvore
  - Apenas subárvores com dados alterados são remeasured
  - Layout Pass ainda é completo (coordenadas absolutas)
  - Mas Measure Pass é incremental

Por enquanto: layout completo a cada ciclo.
```

### 15.7 Lazy Measurement

```
A medição é "preguiçosa" no sentido de que ela mede apenas o necessário.

Técnicas de lazy measurement já aplicadas:
  1. Strings enormes: medir apenas até terminal_width (§14.5)
  2. Listas longas: processar apenas max_items (§14.7)
  3. Widgets ocultos: não existem na árvore (§14.8)
  4. Overflow oculto: não medir conteúdo excedente

A medição NUNCA é preguiçosa no sentido de adiar para o Layout Pass.
Toda medição acontece no Measure Pass, em pós-ordem.
```

### 15.8 Reutilização

```
A Layout Engine NÃO reutiliza nós de um ciclo para o outro.

Cada ciclo:
  - Nova Component Tree
  - Nova Layout Tree
  - Novo Measure Pass
  - Novo Layout Pass
  - Nova Render Tree
  - Tudo novo

Se no futuro a criação de objetos for um gargalo:
  - Object pool para LayoutNodes
  - Reset de nós em vez de criação
  - Apenas quando o perfil de performance indicar bottleneck
```

---

## 16. Anti-padrões

### 16.1 Layout Manual

```
✗ PROIBIDO:
  // Calcular posições manualmente baseado em string length
  pos_x = len(header) + 2
  pos_y = 3

  // Posicionar elemento baseado em conteúdo
  if task.priority == "high":
      x = 2
  else:
      x = 5

✓ CORRETO:
  Usar HStack, VStack, Columns, Panel.
  O layout é declarativo, nunca imperativo.
  Toda posição é calculada pelo Layout Engine.
```

### 16.2 Padding Manual

```
✗ PROIBIDO:
  // Adicionar espaços manualmente
  text = "  " + task.title + "  "
  badge = " " + status + " "

✓ CORRETO:
  Usar padding do container.
  Badge tem padding interno de 1 caractere.
  O espaçamento é responsabilidade do layout, não do conteúdo.
```

### 16.3 Concatenação de Strings para Layout

```
✗ PROIBIDO:
  // Construir linha visual manualmente
  linha = "│ " + task.title.ljust(30) + " │"

✓ CORRETO:
  Panel com HStack filho.
  Label(text: task.title).
  O Panel desenha a borda. O HStack posiciona o Label.
```

### 16.4 Cálculo Visual no Renderer

```
✗ PROIBIDO:
  // Render Engine calculando posições
  render(task, x, y):
      if task.is_done:
          x += 2   // ← lógica de layout no renderer

✓ CORRETO:
  Layout Engine calcula posições.
  Render Engine apenas desenha.
```

### 16.5 Componentes Alterando Geometria

```
✗ PROIBIDO:
  // Componente que modifica sua própria largura
  if this.state == "expanded":
      this.width = 40
  else:
      this.width = 20

✓ CORRETO:
  Largura é determinada pelo container pai + props.
  Componente não controla sua própria geometria.
```

### 16.6 Renderização Antes da Medição

```
✗ PROIBIDO:
  // Renderizar antes de medir
  render():
      output = draw_border()
      output += draw_content()
      // (sem medir, sem posicionar)

✓ CORRETO:
  Primeiro medir (Measure Pass).
  Depois posicionar (Layout Pass).
  Depois renderizar (Render Engine).
```

### 16.7 Duplicação de Lógica de Layout

```
✗ PROIBIDO:
  // Dois componentes com a mesma lógica de layout
  HorizontalCard.layout() = HStack com gap sm
  StatusRow.layout()      = HStack com gap sm
  // (mesma coisa, nomes diferentes)

✓ CORRETO:
  Usar HStack diretamente.
  Não criar componentes que são apenas aliases de layout.
```

### 16.8 Acoplamento entre Layout e Dados

```
✗ PROIBIDO:
  // Layout Engine processando dados de domínio
  if task.due_date < today:
      task_width = 30  // ← lógica de domínio no layout

✓ CORRETO:
  Layout Engine recebe dados já processados.
  "Atrasado" é um estado (variant="danger") que afeta a cor,
  não a geometria.
```

### 16.9 Tabela de Anti-padrões

| # | Anti-padrão | Severidade | Onde Detecta |
|---|-------------|------------|--------------|
| 1 | Cálculo manual de x/y | blocker | grep por `x =`, `y =`, `pos_x` |
| 2 | Padding manual com espaços | blocker | grep por `" " * n` ou `ljust/rjust` |
| 3 | Concatenação de bordas | blocker | grep por `"│" +` ou `"─" *` |
| 4 | Render Engine calculando posição | blocker | Render Tree não pode ter lógica de layout |
| 5 | Componente alterando própria largura | blocker | Setter de width dentro do componente |
| 6 | Renderizar antes do Measure Pass | blocker | Ordem de chamadas no pipeline |
| 7 | Container com largura fixa não-grid | major | Largura que não usa tokens ou colunas |
| 8 | Label com largura hardcoded | major | Label sem truncate configurado |
| 9 | VStack/HStack com gap hardcoded | major | Gap que não usa SpacingToken |
| 10 | Lógica de domínio no Measure Pass | major | Condicionais baseadas em dados de negócio |
| 11 | Caching de resultados de layout | minor | Estado global de cache na Layout Engine |
| 12 | Mutação de nó em vez de substituição | blocker | Código que altera props de nó existente |

---

## 17. Fluxo Completo

### 17.1 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WORKSPACE ENGINE                              │
│  Responsabilidade: gerenciar o diretório de trabalho, Git, tarefas   │
│                                                                      │
│  Eventos: watch de arquivos, git status, task manager               │
│  Saída: dados estruturados (Task[], GitStatus, ServerStatus, etc.)  │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Dados estruturados
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DASHBOARD ENGINE                               │
│  Responsabilidade: gerenciar widgets, layout de alto nível,          │
│                    breakpoints, estado do dashboard                  │
│                                                                      │
│  - Decide quais widgets estão visíveis                               │
│  - Aplica breakpoints para decidir layout dos widgets               │
│  - Mantém estado de colapso/expansão de cada widget                 │
│  - Ordena widgets por prioridade                                    │
│                                                                      │
│  Saída: Component Tree (List<Panel> + props)                        │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Panel[] + props
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         LAYOUT ENGINE                                │
│  Responsabilidade: calcular posições e dimensões                     │
│                                                                      │
│  1. RECEBE: Component Tree + Viewport (width, height)               │
│  2. CONVERTE: Component Tree → Layout Tree                          │
│  3. MEDE: Measure Pass (pós-ordem)                                  │
│  4. POSICIONA: Layout Pass (pré-ordem)                              │
│  5. PRODUZ: Render Tree (nós com x, y, w, h, content, meta)        │
│                                                                      │
│  Saída: Render Tree                                                  │
└────────────────────┬────────────────────────────────────────────────┘
                     │ RenderNode[] (x, y, w, h, content, meta)
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         RENDER ENGINE                                │
│  Responsabilidade: desenhar caracteres no terminal                   │
│                                                                      │
│  1. RECEBE: Render Tree                                              │
│  2. CONVERTE: cada RenderNode em caracteres ANSI                    │
│  3. APLICA: cores, bold, fallback Unicode                           │
│  4. COMPÕE: buffer bidimensional (linhas x colunas)                 │
│  5. ESCREVE: buffer no console (stdout)                             │
│                                                                      │
│  Saída: Caracteres + ANSI codes → Console                           │
└────────────────────┬────────────────────────────────────────────────┘
                     │ stdout
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           CONSOLE                                    │
│  Windows Terminal / PowerShell 7                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 17.2 Papel de Cada Camada

```
WORKSPACE ENGINE:
  input:  sistema de arquivos, processo Git, task manager
  output: dados de domínio (Task[], GitStatus, ServerInfo)
  estado: mantém dados atualizados em tempo real
  gatilho: eventos de arquivo, timer, comando do usuário

DASHBOARD ENGINE:
  input:  dados do Workspace Engine + configuração do dashboard
  output: Component Tree (árvore de componentes do Design System)
  estado: visibilidade dos widgets, breakpoint atual, collapsed states
  gatilho: dados novos, redimensionamento, comando do usuário

LAYOUT ENGINE:
  input:  Component Tree + viewport (terminal width x height)
  output: Render Tree (nós com posições absolutas)
  estado: nenhum (stateless, determinístico)
  gatilho: nova Component Tree ou novo viewport

RENDER ENGINE:
  input:  Render Tree
  output: buffer de caracteres ANSI → console
  estado: buffer anterior (para diff opcional)
  gatilho: nova Render Tree

CONSOLE:
  input:  caracteres + ANSI codes
  output: pixels na tela
  estado: gerenciado pelo Windows Terminal
```

### 17.3 Ordem de Gatilhos

```
1. USUÁRIO DIGITA COMANDO
   → Workspace Engine processa
   → Dados são atualizados
   → Dashboard Engine reconstroi Component Tree
   → Layout Engine recalcula
   → Render Engine redesenha
   → Console exibe

2. TIMER DE TAREFA (1s)
   → Workspace Engine atualiza elapsed_seconds
   → Dashboard Engine: FocusWidget recebe novo timer
   → Layout Engine: apenas o FocusWidget muda de tamanho (se necessário)
   → Render Engine: redesenha o timer
   → Console exibe

3. REDIMENSIONAMENTO DO TERMINAL
   → Sistema operacional notifica
   → Dashboard Engine detecta novo breakpoint
   → Dashboard Engine: widgets podem ser ocultados/movidos
   → Layout Engine: recalcula tudo com novo viewport
   → Render Engine: redesenha tudo
   → Console exibe

4. DADOS NOVOS (git status, tasks)
   → Workspace Engine recebe dados
   → Dashboard Engine: widgets são atualizados
   → Layout Engine: recalcula (sub-)árvore
   → Render Engine: redesenha áreas afetadas
   → Console exibe
```

---

## 18. Checklist de Validação

### 18.1 Checklist de Pipeline

- [ ] A Component Tree foi convertida em Layout Tree sem perda de informação?
- [ ] O Measure Pass foi executado em pós-ordem?
- [ ] O Layout Pass foi executado em pré-ordem?
- [ ] A Render Tree contém apenas nós que produzem caracteres visuais?
- [ ] Nós container puros (VStack, HStack, Section, Spacer) foram removidos da Render Tree?
- [ ] A Render Tree tem a mesma quantidade de itens visuais que o esperado?
- [ ] A saída total cabe no viewport (terminal_width × terminal_height)?
- [ ] Nenhum nó tem x < 0, y < 0, x + width > viewport_width?

### 18.2 Checklist de Medição

- [ ] Todo nó foi medido (intrinsic, min_width, max_width, pref_width calculados)?
- [ ] Nenhum nó tem intrinsic.width = 0 (exceto Spacer)?
- [ ] min_width ≤ pref_width ≤ max_width para todo nó?
- [ ] Nenhum nó tem height = 0?
- [ ] Labels com texto vazio foram tratados como EmptyState?
- [ ] Strings enormes foram truncadas para terminal_width?
- [ ] Códigos ANSI foram removidos antes da medição?
- [ ] Unicode foi tratado como largura 1 (ajuste do Render Engine)?

### 18.3 Checklist de Posicionamento

- [ ] A posição de cada nó é um número inteiro?
- [ ] A posição de cada nó é ≥ 0?
- [ ] Nenhum nó extrapola o pai (x + width ≤ pai.x + pai.width)?
- [ ] Padding foi aplicado corretamente (content_x = x + padding_left)?
- [ ] Gap foi aplicado entre filhos (não antes do primeiro, não depois do último)?
- [ ] Alinhamento (left, center, right, top, center, bottom) está correto?
- [ ] Filhos de VStack têm o mesmo x?
- [ ] Filhos de HStack têm o mesmo y?
- [ ] Wrap foi ativado quando necessário (filhos excederam largura do pai)?

### 18.4 Checklist de Grid

- [ ] Todas as Row dentro de Columns têm sum(widths) = 12?
- [ ] Nenhuma Row tem width inválido (5, 7, 8, 9, 10, 11)?
- [ ] O gutter de 1 caractere foi aplicado entre Rows?
- [ ] Todas as Rows no mesmo Columns têm a mesma altura?
- [ ] A largura de cada Row é um número inteiro?

### 18.5 Checklist de Responsividade

- [ ] O breakpoint foi calculado corretamente baseado no terminal_width?
- [ ] Em breakpoint xs, o dashboard está oculto e o estado é Compacto?
- [ ] Em breakpoint sm, os widgets estão empilhados (width = 12)?
- [ ] Em breakpoint md, o layout normal está ativo?
- [ ] Em breakpoint lg, widgets largos foram reduzidos?
- [ ] Em breakpoint xl, o painel lateral está expandido?
- [ ] Widgets com prioridade baixa foram ocultados antes dos de alta?
- [ ] A transição entre breakpoints é instantânea e sem falhas?

### 18.6 Checklist de Overflow

- [ ] O overflow de cada container está configurado corretamente (§11.6)?
- [ ] Texto que excede o container foi truncado com "…"?
- [ ] Wrap foi ativado apenas onde configurado?
- [ ] Indicadores de scroll (▲▼) aparecem apenas quando necessário?
- [ ] Indicadores de scroll não quebram o layout?
- [ ] O último caractere da última linha não foi cortado?

### 18.7 Checklist de Box-drawing (Bordas)

- [ ] Todas as bordas estão perfeitamente conectadas (sem gaps)?
- [ ] Cantos (┌┐└┘) estão nos lugares corretos?
- [ ] Junções (├┤┬┴┼) foram usadas quando múltiplas linhas se encontram?
- [ ] Nenhuma borda de Panel intersecta outra borda?
- [ ] A espessura de todas as bordas é exatamente 1 caractere?
- [ ] Panel sem título tem borda superior reta?

### 18.8 Checklist de Espaçamento

- [ ] Espaçamento usa tokens do sistema (Spacing.xs, sm, md, lg, xl)?
- [ ] Nenhum valor numérico hardcoded de espaçamento?
- [ ] Padding foi aplicado a todos os componentes que precisam?
- [ ] Gap não foi aplicado antes do primeiro ou depois do último filho?
- [ ] Indentação é sempre múltiplo de 2?
- [ ] A altura total da saída está correta?

### 18.9 Checklist de Performance

- [ ] O Measure Pass percorreu cada nó exatamente uma vez?
- [ ] O Layout Pass percorreu cada nó exatamente uma vez?
- [ ] Nenhum nó foi medido ou posicionado desnecessariamente?
- [ ] Strings enormes foram medidas com preguiça (apenas até o limite)?
- [ ] Listas longas foram limitadas por max_items?
- [ ] A árvore não excede 200 nós (caso normal)?
- [ ] O tempo total de layout é < 1ms?

### 18.10 Checklist de Invariantes

- [ ] Todos os 41 invariantes (§13) foram verificados?
- [ ] Nenhum invariante foi violado?
- [ ] Em caso de violação, a engine reportou erro em vez de seguir com estado inválido?
- [ ] A Render Tree final satisfaz todos os invariantes?

### 18.11 Checklist de Casos Extremos

- [ ] Terminal com 50 caracteres funciona sem crash?
- [ ] Terminal com 300 caracteres funciona sem layout quebrado?
- [ ] Unicode de largura 2 não quebra o layout?
- [ ] Códigos ANSI no texto não afetam a medição?
- [ ] Labels com 10.000 caracteres são medidos corretamente?
- [ ] Dados vazios produzem EmptyState consistente?
- [ ] 10.000 tarefas não congelam a engine (limitadas por max_items)?
- [ ] Nome de branch com 100 caracteres é truncado corretamente?
- [ ] Widgets ocultos não ocupam espaço na árvore?

### 18.12 Decisão Final

- [ ] A saída da Layout Engine é determinística?
- [ ] A saída da Layout Engine é imutável?
- [ ] A saída da Layout Engine contém apenas coordenadas inteiras?
- [ ] A saída da Layout Engine cabe no viewport?
- [ ] A saída da Layout Engine respeita todos os invariantes?
- [ ] Nenhum anti-padrão (§16) está presente?

Se todas as respostas são **SIM** → **Layout aprovado para renderização.**
Se alguma resposta é **NÃO** → **Layout rejeitado. Corrigir antes de renderizar.**

---

## Apêndice A — Glossário

| Termo | Definição |
|-------|-----------|
| **Layout Tree** | Árvore imutável de nós que representa a estrutura espacial da interface, antes da medição. |
| **Layout Tree Medida** | Layout Tree após o Measure Pass — cada nó contém tamanhos calculados. |
| **Render Tree** | Árvore final após o Layout Pass — cada nó contém posição absoluta (x, y) e dimensões (w, h). |
| **Measure Pass** | Primeira passada do layout: calcula tamanhos intrínsecos, mínimos, máximos e preferidos. |
| **Layout Pass** | Segunda passada do layout: atribui coordenadas absolutas a cada nó. |
| **Pós-ordem** | Percorrimento depth-first onde filhos são visitados antes dos pais. |
| **Pré-ordem** | Percorrimento depth-first onde pais são visitados antes dos filhos. |
| **Intrinsic Size** | Tamanho natural de um nó sem constraints externas. |
| **Preferred Width** | Largura ideal de um nó dadas as constraints do pai. |
| **Constraint** | Limite de largura/altura imposto por um pai a um filho. |
| **Viewport** | Área visível do terminal (terminal_width × terminal_height). |
| **Reflow** | Reexecução completa do pipeline de layout. |
| **Flex** | Sistema de distribuição de espaço onde filhos crescem/encolhem proporcionalmente. |
| **Breakpoint** | Largura de terminal que dispara uma reorganização do layout. |
| **Wrap** | Comportamento de quebra de linha quando o conteúdo excede a largura do container. |
| **Truncate** | Substituição do final do texto por "…" quando excede a largura disponível. |

---

## Apêndice B — Histórico de Revisão

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-07-11 | Lead Software Architect + Lead UX Engineer | Documento inicial — especificação completa da Layout Engine |

---

> **Este documento, em conjunto com `terminal_ui_spec.md` e `design_system.md`, constitui a fonte única de verdade para toda a arquitetura do Thinker Terminal.**
>
> A Layout Engine é o coração do sistema. Nenhuma alteração na forma como a interface calcula posições e dimensões pode ser feita sem passar por este documento.
>
> Qualquer implementação que desrespeite estas regras deve ser rejeitada em code review.
> Qualquer dúvida não coberta por este documento deve ser levada ao arquiteto antes da implementação.
