# Design System — Thinker Terminal UI

> **Documento Oficial do Sistema de Design**
> Versão: 1.0
> Status: Aprovado
> Classificação: Fonte Única de Verdade
> Dependência: `terminal_ui_spec.md`

---

## Índice

1. [Filosofia do Design System](#1-filosofia-do-design-system)
2. [Árvore de Componentes](#2-árvore-de-componentes)
3. [Catálogo de Componentes](#3-catálogo-de-componentes)
4. [Sistema de Layout](#4-sistema-de-layout)
5. [Sistema de Espaçamento](#5-sistema-de-espaçamento)
6. [Sistema Tipográfico](#6-sistema-tipográfico)
7. [Sistema de Cores](#7-sistema-de-cores)
8. [Sistema de Estados](#8-sistema-de-estados)
9. [Regras de Composição](#9-regras-de-composição)
10. [Anti-padrões](#10-anti-padrões)
11. [Checklist de Code Review](#11-checklist-de-code-review)

---

## 1. Filosofia do Design System

### 1.1 Objetivos

| # | Objetivo | Descrição |
|---|----------|-----------|
| 1 | **Composição pura** | Todo componente é uma função de seus parâmetros. Dado o mesmo input, produz o mesmo output visual. |
| 2 | **Zero CSS** | Não existe folha de estilo. Todo estilo é derivado de tokens semânticos aplicados no momento da renderização. |
| 3 | **Consistência forçada** | O sistema não permite variação visual. Não há "quase igual". Ou é o componente, ou não é. |
| 4 | **Documentação executável** | Cada componente tem especificação completa. Uma IA deve conseguir implementar qualquer componente sem precisar de decisões de design. |
| 5 | **Separação total** | Lógica de negócio nunca entra em componente visual. Componente visual nunca contém regras de domínio. |

### 1.2 Princípios

```
CLAREZA        →  Um componente faz uma coisa e faz bem.
COMPOSIÇÃO     →  Componentes são blocos Lego. Qualquer combinação válida produz UI válida.
IMUTABILIDADE  →  Props definem tudo. Estado interno é proibido em componentes de renderização.
PREVISIBILIDADE→  O layout de qualquer composição pode ser calculado antes da renderização.
ECONOMIA       →  Menos componentes é melhor. Prefira composição a criar um novo componente.
RIGOR          →  Não existem atalhos. Toda exceção visual é um novo componente ou prop.
```

### 1.3 Consistência

```
REGRAS DE CONSISTÊNCIA:
───────────────────────
1. Todo componente usa tokens do sistema. Sempre. Sem exceção.
2. Todo componente existe em uma pasta plana (sem aninhamento de componentes).
3. Todo componente tem exatamente uma responsabilidade.
4. Dois componentes nunca resolvem o mesmo problema visual.
5. Toda variação visual é controlada por props, não por CSS customizado.
6. A mesma prop tem o mesmo nome em todos os componentes.
7. Se uma prop não faz sentido para um componente, ela não existe naquele componente.
```

### 1.4 Previsibilidade

```
REGRAS DE PREVISIBILIDADE:
──────────────────────────
1. Largura de um componente = soma das larguras de seus filhos + gap + padding.
2. Altura de um componente = máximo das alturas de seus filhos + gap + padding vertical.
3. Nenhum componente pode ter "largura mágica" ou "altura mágica".
4. Overflow é sempre explícito e declarado via prop.
5. Quebra de linha é sempre explícita (wrap vs nowrap é prop, não suposição).
6. Todo componente pode ser calculado em uma única passada (sem reflow duplo).
```

### 1.5 Composição

```
REGRAS DE COMPOSIÇÃO:
─────────────────────
1. Container components (Panel, VStack, HStack) aceitam qualquer filho.
2. Leaf components (Label, Badge, Spacer) não aceitam filhos.
3. Data components (TaskList, Table) aceitam apenas dados, não componentes filhos.
4. Nenhum componente pode ler ou modificar props de seus filhos.
5. A altura/largura de um container é função de seus filhos (nunca o contrário).
6. Um filho não pode solicitar espaço — o pai aloca espaço e o filho se adapta.
```

### 1.6 Reutilização

```
REGRAS DE REUTILIZAÇÃO:
────────────────────────
1. Se um padrão visual aparece em 2+ lugares, deve ser um componente.
2. Componentes não podem ter variantes que mudam a estrutura interna.
3. Variantes são props booleanas ou enumeradas, nunca componentes derivados.
4. Prefira composição (HStack + Label + Badge) a criar StatusCard.
5. Apenas crie um novo componente se a composição existente exigir 6+ linhas de repetição.
```

---

## 2. Árvore de Componentes

### 2.1 Taxonomia

```
COMPONENTS
│
├── CONTAINERS (aceitam filhos, gerenciam layout)
│   ├── Panel          →  Container com borda e header opcional
│   ├── VStack         →  Empilhamento vertical com gap
│   ├── HStack         →  Empilhamento horizontal com gap
│   ├── Section        →  Divisão temática com título
│   ├── Columns        →  Grid de 12 colunas (layout de página)
│   ├── Row            →  Linha dentro de Columns
│   ├── Header         →  Barra de título de seção/painel
│   └── Footer         →  Barra de rodapé de seção/painel
│
├── LEAF (não aceitam filhos, exibem conteúdo)
│   ├── Label          →  Texto com estilo semântico
│   ├── Badge          →  Rótulo de status colorido
│   ├── Spacer         →  Espaço vazio flexível
│   ├── Divider        →  Linha horizontal de separação
│   ├── Icon           →  Caractere Unicode com significado
│   └── ProgressBar    →  Barra de progresso horizontal
│
├── DATA (aceitam dados, renderizam listas/estruturas)
│   ├── List           →  Lista vertical genérica
│   ├── TaskList       →  Lista especializada em tarefas
│   ├── Table          →  Grid de colunas ordenadas
│   ├── Tree           →  Estrutura hierárquica indentada
│   ├── Timeline       →  Sequência temporal de eventos
│   └── Stat           →  Métrica + label + valor
│
├── FEEDBACK (notificam estado)
│   ├── Alert          →  Mensagem de aviso/erro/sucesso
│   ├── EmptyState     →  Painel vazio com mensagem e ação
│   ├── StatusIndicator→  Indicador de estado (bolinha colorida)
│   └── LoadingSpinner →  Indicador de carregamento
│
├── DOMAIN (específicos do domínio do terminal)
│   ├── GitSummary     →  Status do repositório Git
│   ├── WorkspaceInfo  →  Informação do diretório/projeto
│   ├── FocusWidget    →  Tarefa atualmente em foco
│   ├── ActivityWidget →  Atividades recentes
│   ├── WeekChart      →  Gráfico de atividade semanal
│   ├── Prompt         →  Prompt do terminal formatado
│   └── Dashboard      →  Container de widgets do dashboard (Z1)
│
└── PRIMITIVES (não são componentes, são blocos do sistema)
    ├── Border         →  Token de borda
    ├── SpacingToken   →  Token de espaçamento
    ├── ColorToken     →  Token de cor semântica
    └── TypeToken      →  Token tipográfico
```

### 2.2 Mapa de Dependências

```
NENHUM COMPONENTE PODE DEPENDER DE OUTRO COMPONENTE.
Exceção: Domain components podem conter leaf + data + feedback components.
Container components NUNCA dependem de domain components.
```

### 2.3 Classificação por Responsabilidade

| Categoria | Responsabilidade | Aceita Filhos? | Contém Dados? |
|-----------|-----------------|----------------|---------------|
| Container | Gerenciar layout | Sim | Não |
| Leaf | Exibir conteúdo | Não | Sim (props) |
| Data | Estruturar dados | Não | Sim (props) |
| Feedback | Notificar estado | Sim (label) | Sim (props) |
| Domain | Exibir domínio | Sim (leaf + data + feedback) | Sim |

---

## 3. Catálogo de Componentes

### 3.1 Container — `Panel`

| Campo | Valor |
|-------|-------|
| **Nome** | `Panel` |
| **Descrição** | Container retangular com borda box-drawing e header opcional. É o componente mais externo de qualquer widget ou painel. |
| **Objetivo** | Fornecer moldura visual consistente para qualquer bloco de conteúdo. |
| **Responsabilidade** | Renderizar borda, header, e delegar conteúdo ao filho. |
| **O que PODE** | Ter ou não header. Ter largura definida por colunas do grid. Conter exatamente UM filho. |
| **O que NÃO PODE** | Conter múltiplos filhos (use VStack/HStack dentro). Ter padding próprio (padding é do filho). Renderizar sem borda (para isso use Section). Ter header sem título. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão | Restrição |
|------|------|---------|--------|-----------|
| `title` | `string \| null` | qualquer texto | `null` | máximo 50 chars |
| `icon` | `string \| null` | símbolo Unicode | `null` | largura 2 ou fallback |
| `width` | `1..12` | 1, 2, 3, 4, 6, 12 | `12` | deve ser múltiplo válido |
| `height` | `number \| "auto"` | 3..40 | `"auto"` | mínimo 3 |
| `state` | `PanelState` | ver §8 | `"normal"` | — |
| `border` | `boolean` | true, false | `true` | false remove box-drawing |

**Estados:** normal, loading, empty, error, disabled
**Comportamentos:** Se `state=error`, header fica vermelho. Se `state=loading`, body mostra spinner. Se `state=disabled`, opacidade reduzida.

**Exemplo válido:**
```
Panel(title: "Tarefas", icon: "📋", width: 4, state: "normal")
├── Header("📋 Tarefas (3)")
└── VStack
    ├── Label("Refatorar UX", variant: "primary")
    └── Label("Bug #42", variant: "secondary")
```

**Exemplo inválido:**
```
Panel(title: "Tarefas", width: 5)
→ "width 5 não é múltiplo válido (deve ser 1, 2, 3, 4, 6, 12)"

Panel
├── Label("A")
├── Label("B")
→ "Panel aceita exatamente 1 filho. Use VStack para múltiplos."
```

---

### 3.2 Container — `VStack`

| Campo | Valor |
|-------|-------|
| **Nome** | `VStack` |
| **Descrição** | Container que empilha filhos verticalmente com gap configurável. |
| **Objetivo** | Organizar componentes em sequência vertical com espaçamento consistente. |
| **Responsabilidade** | Distribuir filhos verticalmente de acordo com o alinhamento e gap. |
| **O que PODE** | Aceitar N filhos. Ter gap configurável. Expandir para altura do pai. |
| **O que NÃO PODE** | Ter largura diferente do pai. Quebrar linha (não faz sentido vertical). Conter lógica de scroll (use Panel para scroll). |

**Propriedades:**

| Prop | Tipo | Valores | Padrão | Restrição |
|------|------|---------|--------|-----------|
| `gap` | `SpacingToken` | `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"` | `"sm"` | ver §5 |
| `align` | `"left"`, `"center"`, `"right"` | — | `"left"` | alinhamento horizontal dos filhos |
| `padding` | `SpacingToken \| null` | — | `null` | padding interno |
| `expand` | `boolean` | true, false | `false` | se true, ocupa toda altura disponível |

**Estados:** N/A (não tem estado próprio)
**Comportamentos:** Se `expand=true`, distribui filhos uniformemente no espaço vertical.

**Exemplo válido:**
```
VStack(gap: "md", padding: "sm")
├── Label("Item 1")
├── Label("Item 2")
└── Label("Item 3")
```

**Exemplo inválido:**
```
VStack(gap: "md", expand: true)
├── Label("Item 1")
└── VStack(gap: "xl")
    ├── Label("A")
    └── Label("B")
→ "VStack dentro de VStack é redundante. Use gap no pai."
```

---

### 3.3 Container — `HStack`

| Campo | Valor |
|-------|-------|
| **Nome** | `HStack` |
| **Descrição** | Container que empilha filhos horizontalmente com gap configurável. |
| **Objetivo** | Organizar componentes em linha com espaçamento consistente. |
| **Responsabilidade** | Distribuir filhos horizontalmente. |
| **O que PODE** | Ter gap, wrap, align vertical. Expandir para largura do pai. |
| **O que NÃO PODE** | Ter altura diferente do maior filho. Conter mais de 12 filhos (limite de grid). |

**Propriedades:**

| Prop | Tipo | Valores | Padrão | Restrição |
|------|------|---------|--------|-----------|
| `gap` | `SpacingToken` | — | `"xs"` | — |
| `wrap` | `boolean` | true, false | `false` | se true, quebra linha no overflow |
| `align` | `"top"`, `"center"`, `"bottom"` | — | `"top"` | alinhamento vertical dos filhos |
| `expand` | `boolean` | true, false | `false` | distribui igualmente |
| `max_width` | `number \| null` | — | `null` | em caracteres |

**Estados:** N/A
**Comportamentos:** Se `wrap=true` e largura excede pai, quebra em múltiplas linhas como VStacks.

**Exemplo válido:**
```
HStack(gap: "sm", align: "center")
├── Icon("●", color: "success")
├── Label("Online", variant: "primary")
└── Label("480ms", variant: "muted")
```

**Exemplo inválido:**
```
HStack(gap: "md", wrap: false)
├── 20 labels de 10 caracteres cada
em terminal de 80 caracteres
→ "Overflow sem wrap. Configure wrap=true ou reduza filhos."
```

---

### 3.4 Container — `Section`

| Campo | Valor |
|-------|-------|
| **Nome** | `Section` |
| **Descrição** | Divisão temática com linha separadora e título. Usado dentro de painéis para agrupar conteúdo relacionado. |
| **Objetivo** | Criar hierarquia visual dentro de um painel sem adicionar bordas. |
| **Responsabilidade** | Renderizar linha separadora + título + conteúdo. |
| **O que PODE** | Ter título opcional. Conter múltiplos filhos. |
| **O que NÃO PODE** | Ter borda própria (use Panel). Ter padding próprio. Ser usado fora de um Panel. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão | Restrição |
|------|------|---------|--------|-----------|
| `title` | `string \| null` | — | `null` | máximo 40 chars |
| `icon` | `string \| null` | — | `null` | — |
| `collapsible` | `boolean` | true, false | `false` | se true, título é clicável |

**Estados:** collapsed, expanded
**Comportamentos:** Se `collapsible=true` e `state=collapsed`, filhos não são renderizados.

**Exemplo válido:**
```
Panel(title: "Servidor")
└── VStack
    ├── Section(title: "Status")
    │   └── HStack
    │       ├── StatusIndicator(state: "online")
    │       └── Label("Online há 3h")
    └── Section(title: "Métricas")
        └── HStack
            ├── Stat("Uptime", "3h 12m")
            └── Stat("Cache", "892")
```

**Exemplo inválido:**
```
Section(title: "Status")
├── Label("A")
└── Section(title: "Sub")
    └── Label("B")
→ "Section dentro de Section: use VStack com gap para agrupar."
```

---

### 3.5 Container — `Columns`

| Campo | Valor |
|-------|-------|
| **Nome** | `Columns` |
| **Descrição** | Grid de 12 colunas. Cada filho é uma Row com largura definida em colunas. |
| **Objetivo** | Implementar o sistema de grid de 12 colunas do terminal_ui_spec. |
| **Responsabilidade** | Alocar largura para cada Row baseado em sua prop `width`. |
| **O que PODE** | Aceitar N Rows. Validar que soma das widths = 12. Ajustar gutter automaticamente. |
| **O que NÃO PODE** | Aceitar filhos que não sejam Row. Permitir soma de widths ≠ 12. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `gutter` | `SpacingToken` | `"xs"`, `"sm"` | `"xs"` |
| `height` | `"auto"` | — | `"auto"` |

**Estados:** N/A
**Comportamentos:** Calcula largura de cada coluna como `(terminal_width - gutters) / 12 * width`. Valida na construção.

**Exemplo válido:**
```
Columns
├── Row(width: 4)
│   └── Panel(title: "Esquerda")
├── Row(width: 4)
│   └── Panel(title: "Centro")
└── Row(width: 4)
    └── Panel(title: "Direita")
```

**Exemplo inválido:**
```
Columns
├── Row(width: 5)
├── Row(width: 5)
└── Row(width: 2)
→ "Soma das widths (12) OK"
→ Mas Row(width: 5) é inválido. Apenas 1, 2, 3, 4, 6, 12.

Columns
├── Label("A")
└── Row(width: 12)
→ "Columns aceita apenas Row como filho. Label não é Row."
```

---

### 3.6 Container — `Row`

| Campo | Valor |
|-------|-------|
| **Nome** | `Row` |
| **Descrição** | Filho exclusivo de Columns. Define a largura de um bloco no grid de 12 colunas. |
| **Objetivo** | Mapear um bloco de conteúdo a uma fração do grid. |
| **Responsabilidade** | Conter exatamente 1 filho e definir sua largura em colunas. |
| **O que PODE** | Ter width 1, 2, 3, 4, 6 ou 12. |
| **O que NÃO PODE** | Existir fora de Columns. Conter múltiplos filhos. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `width` | `1..12` | 1, 2, 3, 4, 6, 12 | 12 |

**Restrições:** Só pode ser filho de Columns. Columns deve ter soma de widths = 12.

---

### 3.7 Container — `Header`

| Campo | Valor |
|-------|-------|
| **Nome** | `Header` |
| **Descrição** | Barra de título de 1 linha dentro de um Panel ou Section. |
| **Objetivo** | Identificar visualmente o bloco de conteúdo. |
| **Responsabilidade** | Renderizar ícone + título + ações opcionais (colapsar, fechar). |
| **O que PODE** | Ter ícone, título, ações no canto direito. |
| **O que NÃO PODE** | Conter filhos. Ter altura > 1 linha. Ser usado fora de Panel/Section. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `icon` | `string \| null` | símbolo Unicode | `null` |
| `title` | `string` | qualquer | — |
| `actions` | `HeaderAction[]` | menu, collapse, close | `[]` |
| `variant` | `"normal"`, `"error"`, `"warning"` | — | `"normal"` |

**Estados:** normal, error, warning
**Comportamentos:** Se `variant=error`, texto em vermelho. Se `variant=warning`, texto em amarelo.

---

### 3.8 Container — `Footer`

| Campo | Valor |
|-------|-------|
| **Nome** | `Footer` |
| **Descrição** | Barra de rodapé de 1 linha. Usado principalmente na Z4 (barra inferior do terminal). |
| **Objetivo** | Exibir informações de status passivo (Nível 3). |
| **Responsabilidade** | Renderizar label com ícones e métricas alinhados à esquerda e/ou direita. |
| **O que PODE** | Conter HStack com labels e badges. |
| **O que NÃO PODE** | Conter Alert ou StatusIndicator de erro crítico. Ter altura > 1 linha. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `left` | `Component[]` | `[]` |
| `right` | `Component[]` | `[]` |
| `divider` | `string` | `"│"` |

---

### 3.9 Leaf — `Label`

| Campo | Valor |
|-------|-------|
| **Nome** | `Label` |
| **Descrição** | Elemento de texto com estilo semântico pré-definido. |
| **Objetivo** | Exibir texto com tipografia consistente. |
| **Responsabilidade** | Renderizar texto com cor, peso e tamanho baseados na variant. |
| **O que PODE** | Ter variant, alinhamento, truncamento. |
| **O que NÃO PODE** | Conter outros componentes. Ter estilo customizado (use variant). |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `text` | `string` | qualquer | — |
| `variant` | `"primary"`, `"secondary"`, `"muted"`, `"danger"`, `"success"`, `"warning"`, `"info"` | — | `"primary"` |
| `align` | `"left"`, `"center"`, `"right"` | — | `"left"` |
| `truncate` | `boolean \| number` | false, true, N | `false` |
| `uppercase` | `boolean` | true, false | `false` |
| `bold` | `boolean` | true, false | `false` |

**Estados:** N/A

**Exemplo válido:**
```
Label(text: "Erro de conexão", variant: "danger", bold: true)
```

**Exemplo inválido:**
```
Label(text: "Status", variant: "custom-color")
→ "variant deve ser um dos valores definidos. Use Badge para cor customizada."
```

---

### 3.10 Leaf — `Badge`

| Campo | Valor |
|-------|-------|
| **Nome** | `Badge` |
| **Descrição** | Rótulo de status colorido de largura fixa. |
| **Objetivo** | Categorizar ou marcar estado de um item. |
| **Responsabilidade** | Renderizar texto curto com cor de fundo semântica. |
| **O que PODE** | Ter variant, texto de 1-15 caracteres. |
| **O que NÃO PODE** | Conter ícone (use Icon + Badge em HStack). Ter texto longo. Ser interativo. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `text` | `string` | 1-15 chars | — |
| `variant` | `"default"`, `"success"`, `"danger"`, `"warning"`, `"info"` | — | `"default"` |

---

### 3.11 Leaf — `Spacer`

| Campo | Valor |
|-------|-------|
| **Nome** | `Spacer` |
| **Descrição** | Espaço vazio que expande para ocupar espaço disponível em HStack/VStack. |
| **Objetivo** | Empurrar elementos para as extremidades de um container. |
| **Responsabilidade** | Ocupar espaço flexível sem renderizar conteúdo. |
| **O que PODE** | Expandir para ocupar espaço restante. |
| **O que NÃO PODE** | Ter tamanho fixo (use gap para isso). Conter conteúdo. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `min` | `number` | 1 (caractere) |

---

### 3.12 Leaf — `Divider`

| Campo | Valor |
|-------|-------|
| **Nome** | `Divider` |
| **Descrição** | Linha horizontal de separação usando caracteres box-drawing `─`. |
| **Objetivo** | Separar seções visualmente sem bordas completas. |
| **Responsabilidade** | Renderizar linha horizontal de `─` com largura do pai. |
| **O que PODE** | Ter label opcional no centro. |
| **O que NÃO PODE** | Ser vertical (use gap para separação vertical). Ter altura > 1 linha. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `label` | `string \| null` | — | `null` |
| `variant` | `"subtle"`, `"primary"` | — | `"subtle"` |

**Exemplo:**
```
Divider(label: "Histórico")
→ ─────────── Histórico ───────────
```

---

### 3.13 Leaf — `Icon`

| Campo | Valor |
|-------|-------|
| **Nome** | `Icon` |
| **Descrição** | Caractere Unicode com significado semântico. |
| **Objetivo** | Transmitir estado ou categoria visualmente. |
| **Responsabilidade** | Renderizar exatamente 1 caractere Unicode com cor. |
| **O que PODE** | Ter color, fallback ASCII. |
| **O que NÃO PODE** | Conter texto. Ter largura > 2 células sem fallback. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `symbol` | `string` | 1 caractere Unicode | — |
| `color` | `"default"`, `"success"`, `"danger"`, `"warning"`, `"info"`, `"accent"` | — | `"default"` |
| `fallback` | `string \| null` | — | `null` |
| `label` | `string \| null` | acessibilidade | `null` |

**Regra:** Se o terminal não suportar `symbol`, renderizar `fallback`. Todo Icon DEVE ter fallback.

---

### 3.14 Leaf — `ProgressBar`

| Campo | Valor |
|-------|-------|
| **Nome** | `ProgressBar` |
| **Descrição** | Barra de progresso horizontal de largura fixa. |
| **Objetivo** | Mostrar progresso percentual de forma visual. |
| **Responsabilidade** | Renderizar barra preenchida com blocos `■` e vazia com `─`. |
| **O que PODE** | Ter percentual, largura, label. |
| **O que NÃO PODE** | Ser vertical. Ter animação contínua (apenas atualização discreta). |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `value` | `number` | 0..100 | 0 |
| `width` | `number` | 10..80 | 20 |
| `label` | `string \| null` | — | `null` |
| `variant` | `"default"`, `"success"`, `"warning"`, `"danger"` | — | `"default"` |

**Exemplo:**
```
ProgressBar(value: 75, width: 20)
→ [■■■■■■■■■■■■■■■─────] 75%
```

---

### 3.15 Data — `List`

| Campo | Valor |
|-------|-------|
| **Nome** | `List` |
| **Descrição** | Lista vertical genérica com items uniformes. |
| **Objetivo** | Apresentar coleção de itens em sequência vertical. |
| **Responsabilidade** | Renderizar N items com mesmo formato. |
| **O que PODE** | Ter items, marker, gap entre items. |
| **O que NÃO PODE** | Conter items de tipos diferentes (use VStack). Ter scroll infinito (limite em props). |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `items` | `ListItem[]` | array de {icon, label, variant} | `[]` |
| `marker` | `"none"`, `"bullet"`, `"number"`, `"check"` | — | `"bullet"` |
| `max_items` | `number` | 1..50 | 10 |

**Exemplo:**
```
List(items: [
    {icon: "■", label: "Tarefa 1", variant: "primary"},
    {icon: "□", label: "Tarefa 2", variant: "secondary"}
], marker: "none")
```

---

### 3.16 Data — `TaskList`

| Campo | Valor |
|-------|-------|
| **Nome** | `TaskList` |
| **Descrição** | Lista especializada em tarefas com checkbox, prioridade, prazo e status. |
| **Objetivo** | Exibir tarefas do sistema de forma padronizada. |
| **Responsabilidade** | Renderizar lista de tarefas com metadados. |
| **O que PODE** | Ter tasks, mostrar contagem, mostrar tarefa ativa. |
| **O que NÃO PODE** | Conter itens que não são tarefas. Modificar tarefas (é somente leitura). |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `tasks` | `Task[]` | `[]` |
| `show_count` | `boolean` | `true` |
| `active_task_id` | `string \| null` | `null` |
| `max_tasks` | `number` | 10 |

**Task type:**
```
Task {
    id: string
    title: string              // max 50 chars
    status: "pending" | "active" | "done" | "cancelled"
    priority: "low" | "medium" | "high" | "critical"
    due_date: string | null    // formato DD/MM
    subtasks: Task[]           // max 3 níveis
}
```

---

### 3.17 Data — `Table`

| Campo | Valor |
|-------|-------|
| **Nome** | `Table` |
| **Descrição** | Grid de colunas ordenadas com cabeçalho e linhas. |
| **Objetivo** | Exibir dados tabulares com alinhamento consistente. |
| **Responsabilidade** | Renderizar cabeçalho + linhas com colunas alinhadas. |
| **O que PODE** | Ter N colunas, N linhas, coluna ordenável. |
| **O que NÃO PODE** | Ter colunas de largura variável. Conter componentes aninhados nas células (apenas Label). |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `columns` | `TableColumn[]` | `[]` |
| `rows` | `TableRow[]` | `[]` |
| `sortable` | `boolean` | `false` |
| `sort_column` | `number \| null` | `null` |

**TableColumn type:**
```
TableColumn {
    header: string          // max 20 chars
    width: number           // em caracteres
    align: "left" | "center" | "right"
    type: "text" | "number" | "date" | "icon"
}
```

**Restrição:** Soma de `width` das colunas + gaps não pode exceder largura do pai.

---

### 3.18 Data — `Tree`

| Campo | Valor |
|-------|-------|
| **Nome** | `Tree` |
| **Descrição** | Estrutura hierárquica indentada com conectores box-drawing. |
| **Objetivo** | Exibir dados hierárquicos (árvore de diretórios, estrutura de projeto). |
| **Responsabilidade** | Renderizar nós indentados com conectores `├──`, `└──`, `│`. |
| **O que PODE** | Ter N níveis de profundidade, colapsar/expandir nós. |
| **O que NÃO PODE** | Exceder 5 níveis de profundidade. Conter dados não-hierárquicos. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `nodes` | `TreeNode[]` | — | `[]` |
| `max_depth` | `number` | 1..5 | 5 |
| `show_root` | `boolean` | true, false | `true` |

**TreeNode type:**
```
TreeNode {
    label: string
    icon: string | null
    children: TreeNode[]     // max_depth respeitado
    collapsed: boolean       // padrão false
    variant: "default" | "modified" | "added" | "deleted"
}
```

---

### 3.19 Data — `Timeline`

| Campo | Valor |
|-------|-------|
| **Nome** | `Timeline` |
| **Descrição** | Sequência temporal de eventos com timestamp. |
| **Objetivo** | Mostrar histórico de eventos em ordem cronológica. |
| **Responsabilidade** | Renderizar eventos com timestamp, ícone e descrição. |
| **O que PODE** | Ter N eventos, ordenação. |
| **O que NÃO PODE** | Conter eventos sem timestamp. Exceder 20 eventos sem scroll. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `events` | `TimelineEvent[]` | `[]` |
| `max_events` | `number` | 20 |

**TimelineEvent type:**
```
TimelineEvent {
    timestamp: string        // formato HH:MM:SS
    icon: string             // ✓ ✗ ⚠ ℹ
    label: string
    variant: "default" | "success" | "error" | "warning" | "info"
}
```

---

### 3.20 Data — `Stat`

| Campo | Valor |
|-------|-------|
| **Nome** | `Stat` |
| **Descrição** | Par label + valor para exibição de métrica. |
| **Objetivo** | Exibir uma métrica com label descritivo. |
| **Responsabilidade** | Renderizar label (secundário) + valor (primário). |
| **O que PODE** | Ter label, valor, ícone, variant. |
| **O que NÃO PODE** | Conter filhos. Ter valor em formato livre (sempre formatado). |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `label` | `string` | — | — |
| `value` | `string` | — | — |
| `icon` | `string \| null` | — | `null` |
| `variant` | `"default"`, `"success"`, `"danger"`, `"warning"` | — | `"default"` |
| `align` | `"left"`, `"right"` | — | `"left"` |

**Exemplo:**
```
Stat(label: "Uptime", value: "3h 12m", icon: "⏱", variant: "success")
→ ⏱ Uptime: 3h 12m (em verde se success)
```

---

### 3.21 Feedback — `Alert`

| Campo | Valor |
|-------|-------|
| **Nome** | `Alert` |
| **Descrição** | Mensagem de feedback com ícone e cor semântica. |
| **Objetivo** | Notificar o usuário sobre eventos importantes (erro, sucesso, aviso). |
| **Responsabilidade** | Renderizar mensagem em destaque com cor apropriada. |
| **O que PODE** | Ter variant, title, message, action. |
| **O que NÃO PODE** | Ser ignorado silenciosamente (se variant=error, deve ser visível até ação). Conter outros componentes. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `variant` | `"info"`, `"success"`, `"warning"`, `"error"` | — | `"info"` |
| `title` | `string \| null` | — | `null` |
| `message` | `string` | — | — |
| `action` | `{label: string, command: string} \| null` | — | `null` |

**Estados:** visible (sempre). Alert não tem hidden — se não deve aparecer, não é renderizado.
**Comportamentos:** Se `variant=error`, renderiza em vermelho com ícone `✗`. Se `action` definido, mostra sugestão de comando.

**Exemplo:**
```
Alert(variant: "error",
      title: "Servidor offline",
      message: "Falha ao conectar em localhost:5000",
      action: {label: "Tentar :server start", command: ":server start"})
```

---

### 3.22 Feedback — `EmptyState`

| Campo | Valor |
|-------|-------|
| **Nome** | `EmptyState` |
| **Descrição** | Painel vazio com mensagem explicativa e ação opcional. |
| **Objetivo** | Comunicar visualmente que não há dados para exibir. |
| **Responsabilidade** | Renderizar mensagem em texto terciário com sugestão de ação. |
| **O que PODE** | Ter message, action, icon. |
| **O que NÃO PODE** | Conter dados. Ser renderizado quando há dados (é condicional). |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `message` | `string` | `"— Nenhum dado disponível"` |
| `action` | `string \| null` | `null` |
| `icon` | `string \| null` | `null` |

**Exemplo:**
```
EmptyState(message: "— Nenhuma tarefa pendente",
           action: "Crie uma com :task create")
→
  — Nenhuma tarefa pendente
  Crie uma com :task create
```

---

### 3.23 Feedback — `StatusIndicator`

| Campo | Valor |
|-------|-------|
| **Nome** | `StatusIndicator` |
| **Descrição** | Bolinha colorida indicando estado on/off/error. |
| **Objetivo** | Transmitir estado binário ou ternário em 1 caractere. |
| **Responsabilidade** | Renderizar `●` (on) ou `○` (off) com cor semântica. |
| **O que PODE** | Ter state, label, pulsate (apenas para loading). |
| **O que NÃO PODE** | Conter texto (use HStack com Label). Ter mais de 3 estados. |

**Propriedades:**

| Prop | Tipo | Valores | Padrão |
|------|------|---------|--------|
| `state` | `"online"`, `"offline"`, `"error"`, `"loading"`, `"idle"` | — | `"idle"` |
| `label` | `string \| null` | — | `null` |

**Mapeamento estado → símbolo → cor:**
```
online  → ● → verde
offline → ● → vermelho
error   → ● → vermelho (com fallback ✗)
loading → ● → amarelo (com fallback ⏳)
idle    → ○ → cinza
```

---

### 3.24 Feedback — `LoadingSpinner`

| Campo | Valor |
|-------|-------|
| **Nome** | `LoadingSpinner` |
| **Descrição** | Indicador de carregamento usando caracteres rotativos `⣾⣽⣻⢿⡿⣟⣯⣷`. |
| **Objetivo** | Informar que uma operação está em andamento. |
| **Responsabilidade** | Renderizar sequência de caracteres em loop. |
| **O que PODE** | Ter label, variant. |
| **O que NÃO PODE** | Ser usado para operações previsíveis (use ProgressBar). Bloquear a interface. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `label` | `string \| null` | `null` |
| `variant` | `"default"`, `"success"`, `"danger"` | `"default"` |

---

### 3.25 Domain — `GitSummary`

| Campo | Valor |
|-------|-------|
| **Nome** | `GitSummary` |
| **Descrição** | Resumo visual do estado do repositório Git. |
| **Objetivo** | Mostrar branch, status de arquivos e ahead/behind em um bloco compacto. |
| **Responsabilidade** | Compor HStack com branch name, badges de status (M/A/D) e indicador de ahead/behind. |
| **O que PODE** | Exibir branch, contadores +N/~N/-N, ahead/behind, conflitos. |
| **O que NÃO PODE** | Modificar o repositório. Exibir dados de mais de um repositório. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `branch` | `string` | `"main"` |
| `added` | `number` | 0 |
| `modified` | `number` | 0 |
| `deleted` | `number` | 0 |
| `ahead` | `number` | 0 |
| `behind` | `number` | 0 |
| `conflict` | `boolean` | false |
| `outside_repo` | `boolean` | false |

**Estados:** inside_repo, outside_repo, conflict

**Exemplo:**
```
GitSummary(branch: "feat/new-ui", modified: 2, added: 1, ahead: 3)
→ ⎇ feat/new-ui │ +1 ~2 │ ● 3↑
```

---

### 3.26 Domain — `WorkspaceInfo`

| Campo | Valor |
|-------|-------|
| **Nome** | `WorkspaceInfo` |
| **Descrição** | Informação do diretório de trabalho atual. |
| **Objetivo** | Mostrar caminho do projeto e metadados do workspace. |
| **Responsabilidade** | Exibir nome da pasta, caminho truncado, versão do projeto. |
| **O que PODE** | Mostrar path, version, package manager. |
| **O que NÃO PODE** | Executar comandos. Exibir path completo sem truncamento. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `name` | `string` | — |
| `path` | `string` | — |
| `version` | `string \| null` | `null` |
| `package_manager` | `"npm"`, `"pip"`, `"cargo"`, `null` | `null` |
| `truncated_path` | `string` | — |

---

### 3.27 Domain — `FocusWidget`

| Campo | Valor |
|-------|-------|
| **Nome** | `FocusWidget` |
| **Descrição** | Widget que exibe a tarefa atualmente em foco na Z0. |
| **Objetivo** | Mostrar tarefa ativa com timer na barra superior. |
| **Responsabilidade** | Compor HStack com StatusIndicator + task title + timer. |
| **O que PODE** | Mostrar título da tarefa, timer atualizado a cada 1s. |
| **O que NÃO PODE** | Mostrar múltiplas tarefas. Ser usado fora da Z0. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `task_title` | `string \| null` | `null` |
| `elapsed_seconds` | `number` | 0 |
| `paused` | `boolean` | false |

---

### 3.28 Domain — `ActivityWidget`

| Campo | Valor |
|-------|-------|
| **Nome** | `ActivityWidget` |
| **Descrição** | Widget que exibe atividades recentes (builds, deploys, comandos). |
| **Objetivo** | Manter o usuário informado sobre eventos recentes do sistema. |
| **Responsabilidade** | Renderizar Timeline com eventos filtrados por tipo. |
| **O que PODE** | Mostrar N eventos recentes, filtrar por tipo. |
| **O que NÃO PODE** | Mostrar eventos futuros. Armazenar estado (recebe dados prontos). |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `events` | `TimelineEvent[]` | `[]` |
| `max_events` | `number` | 10 |
| `filter` | `("all" \| "success" \| "error" \| "warning")` | `"all"` |

---

### 3.29 Domain — `WeekChart`

| Campo | Valor |
|-------|-------|
| **Nome** | `WeekChart` |
| **Descrição** | Gráfico de atividade semanal em ASCII (barras verticais ou sparkline). |
| **Objetivo** | Mostrar distribuição de atividade ao longo da semana. |
| **Responsabilidade** | Renderizar 7 colunas (D-S) com altura proporcional ao valor. |
| **O que PODE** | Mostrar 7 dias, valores normalizados, label por dia. |
| **O que NÃO PODE** | Exceder 7 colunas. Ter barras mais altas que o container. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `data` | `number[]` (7 valores) | `[0,0,0,0,0,0,0]` |
| `max_height` | `number` | 5 |
| `labels` | `string[]` | `["D","S","T","Q","Q","S","S"]` |
| `variant` | `"default"`, `"success"`, `"accent"` | `"default"` |

**Exemplo:**
```
WeekChart(data: [3, 5, 2, 0, 4, 1, 6], max_height: 5)
→
    ■
  ■ ■     ■
  ■ ■   ■ ■     ■
  ■ ■   ■ ■   ■ ■
  ■ ■ ■ ■ ■ ■ ■ ■
  D S T Q Q S S
```

---

### 3.30 Domain — `Prompt`

| Campo | Valor |
|-------|-------|
| **Nome** | `Prompt` |
| **Descrição** | Prompt do PowerShell formatado com cores semânticas. |
| **Objetivo** | Exibir prompt do terminal com informações de path, git e hora. |
| **Responsabilidade** | Renderizar linha de prompt formatada com tokens de cor. |
| **O que PODE** | Exibir path, git branch, exit code colorido, timestamp. |
| **O que NÃO PODE** | Conter componentes interativos. Exibir path completo sem truncamento. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `path` | `string` | `"~"` |
| `git_branch` | `string \| null` | `null` |
| `exit_code` | `number \| null` | `null` |
| `admin` | `boolean` | `false` |
| `timestamp` | `boolean` | `false` |

**Formatação:**
```
PS C:\project>                   ← path normal
PS C:\project main>              ← com git branch
PS C:\project main [admin]>      ← modo administrador
```

---

### 3.31 Domain — `Dashboard`

| Campo | Valor |
|-------|-------|
| **Nome** | `Dashboard` |
| **Descrição** | Container da Zona 1 que organiza widgets em grid responsivo. |
| **Objetivo** | Gerenciar o layout dos widgets no dashboard. |
| **Responsabilidade** | Distribuir widgets em linhas de 12 colunas, respeitando breakpoints. |
| **O que PODE** | Conter N widgets, reorganizar em breakpoints. |
| **O que NÃO PODE** | Conter conteúdo que não seja widget (Panel). Exceder 10 widgets. |

**Propriedades:**

| Prop | Tipo | Padrão |
|------|------|--------|
| `widgets` | `DashboardWidget[]` | `[]` |
| `breakpoint` | `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"` | calculado |
| `max_widgets` | `number` | 10 |
| `collapsed` | `boolean` | `false` |

**DashboardWidget type:**
```
DashboardWidget {
    id: string
    panel: Panel
    width: 1..12           // largura em colunas
    min_width: 1..12       // largura mínima antes de colapsar
    order: number          // ordem de exibição
}
```

**Comportamento em breakpoints:**
```
xl: widgets mantêm width original
lg: widgets com width > 6 são reduzidos para 6
md: widgets com width > 4 são reduzidos para 4
sm: widgets empilhados verticalmente (width = 12)
xs: dashboard invisível
```

---

## 4. Sistema de Layout

### 4.1 Aceitação de Filhos

| Componente | Aceita Filhos? | Tipo | Quantidade | Restrição |
|-----------|---------------|------|------------|-----------|
| Panel | Sim | qualquer | 1 | exatamente 1 |
| VStack | Sim | qualquer | 1..N | — |
| HStack | Sim | qualquer | 1..N | máximo 12 |
| Section | Sim | qualquer | 1..N | — |
| Columns | Sim | Row | 1..12 | soma widths = 12 |
| Row | Sim | qualquer | 1 | exatamente 1 |
| Header | Não | — | 0 | — |
| Footer | Sim | qualquer | 1..N | — |
| Dashboard | Sim | Panel | 1..10 | — |
| **Todos os outros** | **Não** | — | 0 | **leaf/data/feedback** |

### 4.2 Comportamento de Largura

| Tipo | Largura | Exemplo |
|------|---------|---------|
| **Expand** | Ocupa 100% do pai | Panel, VStack, HStack, Section, Columns |
| **Fixed** | Largura definida por prop | Row, Stat, Badge, ProgressBar |
| **Content** | Largura do conteúdo | Label, Icon, Spacer |
| **Grid** | Largura em colunas (1-12) | Row, DashboardWidget |

### 4.3 Comportamento de Flex

| Componente | Flex Direction | Wrap? | Fill? |
|-----------|---------------|-------|-------|
| VStack | column | não | fill horizontal |
| HStack | row | configurável | fill vertical |
| Columns | row | não | fill horizontal |
| Dashboard | row | wrap | fill horizontal |

### 4.4 Quebra de Linha

| Componente | Wrap Padrão | Configurável? |
|-----------|------------|---------------|
| HStack | false | sim (prop `wrap`) |
| Dashboard | true | não |
| VStack | N/A | não |
| Columns | não | não |

### 4.5 Altura

| Componente | Altura | Determinada Por |
|-----------|--------|-----------------|
| Panel | auto (mínimo 3) | filhos + header + border |
| VStack | auto (ou expand) | soma dos filhos + gaps |
| HStack | auto | maior filho |
| Section | auto | filhos |
| Header | 1 linha | fixa |
| Footer | 1 linha | fixa |
| Bar (Z0, Z4) | 1 linha | fixa |

---

## 5. Sistema de Espaçamento

### 5.1 Tokens de Espaçamento

| Token | Caracteres | Definição |
|-------|------------|-----------|
| `Spacing.zero` | 0 | Sem espaçamento |
| `Spacing.xs` | 1 | Entre ícone e texto |
| `Spacing.sm` | 2 | Entre widgets no mesmo painel |
| `Spacing.md` | 3 | Entre painéis |
| `Spacing.lg` | 4 | Entre zonas |
| `Spacing.xl` | 6 | Margem externa |

### 5.2 Padding

| Componente | Padding Padrão (horizontal, vertical) | Prop para override |
|-----------|--------------------------------------|-------------------|
| Panel | (1, 0) — o filho gerencia | `padding` |
| VStack | (0, 0) | `padding` |
| HStack | (0, 0) | `padding` |
| Section | (0, 0) | não |
| Header | (1, 0) | não |
| Footer | (1, 0) | não |

### 5.3 Margin

Nenhum componente tem margin. Use `Spacer` entre componentes para criar espaço.
Exceção: `gap` em VStack/HStack substitui margin entre filhos.

### 5.4 Gap

| Componente | Gap Padrão | Prop |
|-----------|-----------|------|
| VStack | `Spacing.sm` | `gap` |
| HStack | `Spacing.xs` | `gap` |
| Columns | `Spacing.xs` | `gutter` |
| Dashboard | `Spacing.sm` | — |

### 5.5 Indentação

```
Nível 0: 0 caracteres (raiz)
Nível 1: 2 caracteres (filho direto)
Nível 2: 4 caracteres (sub-filho)
Nível 3: 6 caracteres (máximo)
```

Componentes que usam indentação: `Tree`, `TaskList` (subtasks), `Table` (não, usa colunas).

### 5.6 Ritmo Vertical

O ritmo vertical segue a escala de espaçamento entre zonas:

```
Entre Z0 e Z1:    1 linha (divider opcional)
Entre Z1 e Z2:    1 linha (sempre divider)
Entre Z2 e Z3:    1 linha (divider se scroll separado)
Entre Z3 e Z4:    0 linhas (adjacente)
```

### 5.7 Baseline

Textos em um mesmo HStack são alinhados pela baseline quando `align="center"`.
Componentes com altura diferente em um HStack usam o maior como referência.

---

## 6. Sistema Tipográfico

### 6.1 Hierarquia

| Nível | Token | Uso | Peso | Transform |
|-------|-------|-----|------|-----------|
| 1 | `Type.title` | Título de painel, header | Bold | — |
| 2 | `Type.body` | Conteúdo padrão | Normal | — |
| 3 | `Type.label` | Labels, metadados | Normal | — |
| 4 | `Type.small` | Timestamps, dados secundários | Normal | — |
| 5 | `Type.mono` | Comandos, código, paths | Normal | — |
| 6 | `Type.badge` | Badges, tags, status | Bold | Maiúsculo |

### 6.2 Peso Visual

| Token | Efeito Visual | Uso |
|-------|---------------|-----|
| `Weight.bold` | Ativa ANSI bold | Títulos, destaques, badges |
| `Weight.normal` | Padrão | Corpo do texto |
| `Weight.muted` | Cor secundária | Metadados, labels |

### 6.3 Uso de Maiúsculas

| Contexto | Regra |
|----------|-------|
| Título de painel | Primeira letra maiúscula, resto normal |
| Badge | Sempre maiúsculo (`EM_ANDAMENTO`, `CONCLUÍDO`) |
| Label de botão | Primeira letra maiúscula |
| Comando | Minúsculo (`:task create`) |
| Caminho | Case-sensitive (respeita sistema de arquivos) |
| Nome de branch | Case-sensitive |
| Timestamp | `HH:MM:SS` (maiúsculas para indicadores AM/PM não usar) |

### 6.4 Alinhamento

| Contexto | Alinhamento |
|----------|-------------|
| Título de painel | Esquerda |
| Conteúdo de lista | Esquerda |
| Números em tabela | Direita |
| Badges | Centro |
| Ícones | Centro |
| Footer | Esquerda (esquerda), Direita (direita) |

### 6.5 Espaçamento Tipográfico

Entre linhas de texto: 0 (terminal é monoespaçado, não há line-height variável).
Entre caracteres: 0 (kerning não existe em terminal).

### 6.6 Comprimento Máximo

| Contexto | Máximo | Truncamento |
|----------|--------|-------------|
| Título de tarefa | 50 caracteres | `…` no final |
| Nome de branch | 25 caracteres | `…` no meio |
| Caminho de arquivo | 40 caracteres | `…` no meio |
| Nome de repositório | 20 caracteres | `…` no final |
| Mensagem de commit | 60 caracteres | `…` no final |
| Label de badge | 15 caracteres | truncamento rígido |

### 6.7 Truncamento

```
Regra geral: trunque com "…" (U+2026, 1 célula)

Path:     /home/user/projects/thinker-terminal/src/main.rs
Truncado: …/thinker-terminal/src/main.rs  (mantém final)

Branch:   refatora-modulo-de-autenticacao-com-2fa
Truncado: refatora-modulo-de-autent…      (mantém início)

Truncamento central:
Nome:     documento-de-especificacao-arquitetural
Truncado: documento-de-espec…tural        (mantém início e fim)
```

---

## 7. Sistema de Cores

### 7.1 Tokens Semânticos

| Token | Significado | Uso Principal |
|-------|-------------|---------------|
| `Color.primary` | Texto principal | Labels, títulos, conteúdo ativo |
| `Color.secondary` | Texto secundário | Metadados, labels de campo |
| `Color.muted` | Texto terciário | Placeholders, estados vazios |
| `Color.border` | Borda de painéis | Box-drawing lines |
| `Color.background` | Fundo principal | Zona de terminal |
| `Color.surface` | Fundo elevado | Painéis, widgets, containers |
| `Color.accent` | Cor de destaque padrão | Ícones, destaques |
| `Color.success` | Sucesso, online | Badges ✓, StatusIndicator online |
| `Color.danger` | Erro, offline | Badges ✗, StatusIndicator offline |
| `Color.warning` | Alerta, pendente | Badges ⚠, modified files |
| `Color.info` | Informativo | Badges ℹ, dicas, ajuda |
| `Color.highlight` | Seleção/foco | Fundo de item selecionado |
| `Color.disabled` | Desabilitado | Componentes com state=disabled |
| `Color.selection` | Texto selecionado | Selection highlight |

### 7.2 Mapa de Variant → Cor

| Variant | Token |
|---------|-------|
| `"primary"` | `Color.primary` |
| `"secondary"` | `Color.secondary` |
| `"muted"` | `Color.muted` |
| `"success"` | `Color.success` |
| `"danger"` | `Color.danger` |
| `"warning"` | `Color.warning` |
| `"info"` | `Color.info` |
| `"accent"` | `Color.accent` |
| `"disabled"` | `Color.disabled` |

### 7.3 Aplicação em Componentes

| Componente | Prop de Cor | Mapeamento |
|-----------|------------|------------|
| Label | `variant` | §7.2 |
| Badge | `variant` | §7.2 (fundo com opacidade) |
| Icon | `color` | §7.2 |
| StatusIndicator | `state` | online→success, offline→danger, loading→warning |
| Alert | `variant` | info→info, success→success, warning→warning, error→danger |
| ProgressBar | `variant` | success→success, warning→warning, danger→danger |
| Stat | `variant` | §7.2 |
| Panel | `state` | error→header danger, loading→muted |

### 7.4 Regras de Cor em Componentes Compostos

```
1. Um componente NUNCA aplica cor a um componente filho.
2. Cada componente é responsável por sua própria cor.
3. Props de cor só existem no componente que as renderiza.
4. Container components não repassam cor para filhos.
```

---

## 8. Sistema de Estados

### 8.1 Estados Universais

| Estado | Aplicável a | Efeito Visual |
|--------|------------|---------------|
| `normal` | Painéis, dados, widgets | Renderização padrão |
| `loading` | Painéis, widgets, data | Spinner ou skeleton |
| `empty` | Data, widgets | EmptyState no lugar do conteúdo |
| `success` | Alert, badges | Cor verde, ícone ✓ |
| `error` | Alert, Panel, StatusIndicator | Cor vermelha, ícone ✗ |
| `warning` | Alert, badges | Cor amarela, ícone ⚠ |
| `offline` | StatusIndicator, widgets | Cor vermelha, métricas como "—" |
| `disabled` | Panel, qualquer container | Opacidade reduzida, interações bloqueadas |
| `collapsed` | Section, Panel | Apenas header visível |
| `expanded` | Section, Panel | Header + conteúdo visível |
| `selected` | List items, Table rows | Fundo highlight |
| `focused` | Input, Prompt | Cursor ou borda de foco |

### 8.2 Matriz de Estados por Componente

| Componente | normal | loading | empty | error | disabled | collapsed | expanded | selected | focused |
|-----------|--------|---------|-------|-------|----------|-----------|----------|----------|---------|
| Panel | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| VStack | ✓ | — | — | — | — | — | — | — | — |
| HStack | ✓ | — | — | — | — | — | — | — | — |
| Section | ✓ | — | — | — | — | ✓ | ✓ | — | — |
| Header | ✓ | — | — | ✓ | — | — | — | — | — |
| List | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| TaskList | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| Table | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| Tree | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Alert | ✓ | — | — | — | — | — | — | — | — |
| EmptyState | ✓ | — | — | — | — | — | — | — | — |
| StatusIndicator | ✓ | — | — | ✓ | — | — | — | — | — |
| LoadingSpinner | ✓ | — | — | — | — | — | — | — | — |
| GitSummary | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| FocusWidget | ✓ | ✓ | ✓ | — | ✓ | — | — | — | — |
| ActivityWidget | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| WeekChart | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| Dashboard | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — |

### 8.3 Transições de Estado

```
normal → loading:  quando dados são requisitados
loading → normal:  quando dados chegam
loading → empty:   quando dados chegam vazios
loading → error:   quando requisição falha
normal → disabled: quando sistema desabilita o componente
disabled → normal: quando sistema reabilita
error → loading:   quando retry é acionado
empty → loading:   quando nova requisição é feita
normal → selected: quando usuário seleciona o item
```

Toda transição é instantânea. Não há animação de transição entre estados.

---

## 9. Regras de Composição

### 9.1 Composições Válidas (Aprovadas)

```
✓ Panel > VStack/HStack > (qualquer componente)
✓ Panel > (qualquer leaf/data/feedback)
✓ VStack > (qualquer componente)
✓ HStack > (qualquer componente)
✓ Section > (qualquer componente)
✓ Columns > Row > (qualquer componente)
✓ Dashboard > Panel
✓ Header > (nenhum) [leaf component]
✓ TaskList > (nenhum) [renderiza tasks internamente]
✓ Table > (nenhum) [renderiza rows internamente]
```

### 9.2 Composições Proibidas

```
✗ Panel > Panel                           → "Panel aninhado: use Section para sub-agrupamento"
✗ VStack > VStack                         → "VStack redundante: ajuste gap do pai"
✗ HStack > HStack                         → "HStack redundante: ajuste gap do pai"
✗ Columns > (qualquer componente exceto Row)  → "Columns aceita apenas Row"
✗ Row > Row                               → "Row não pode conter Row"
✗ Header > (qualquer componente)          → "Header não aceita filhos"
✗ Footer > Panel                          → "Footer aceita apenas HStack com labels"
✗ TaskList > VStack                       → "TaskList não aceita filhos, recebe data prop"
✗ Table > TaskList                        → "Table não aceita filhos, recebe data prop"
✗ Dashboard > (qualquer exceto Panel)     → "Dashboard aceita apenas Panel"
✗ EmptyState > (qualquer)                 → "EmptyState não aceita filhos"
✗ LoadingSpinner > (qualquer)             → "LoadingSpinner não aceita filhos"
✗ List > Panel                            → "List não aceita filhos, recebe data prop"
✗ Timeline > VStack                       → "Timeline não aceita filhos"
```

### 9.3 Regras de Profundidade

```
Máximo de 4 níveis de composição:
Nível 1: Panel
Nível 2: VStack/HStack
Nível 3: Section
Nível 4: HStack com Label + Badge

Além disso: task items, table rows, tree nodes (são dados, não componentes)
```

### 9.4 Regras de Data Flow

```
1. Dados sempre descem (parent → child via props).
2. Eventos sempre sobem (child → parent via callbacks).
3. Nenhum componente modifica dados. Apenas exibe.
4. Container components não tocam em dados.
5. Data components não tocam em layout (além do próprio).
```

---

## 10. Anti-padrões

### 10.1 Caixas Aninhadas

```
✗ PROIBIDO:
┌──────────────────┐
│  Panel A         │
│  ┌────────────┐  │
│  │ Panel B    │  │  ← Panel dentro de Panel sem Section
│  └────────────┘  │
└──────────────────┘

✓ CORRETO:
┌──────────────────┐
│  Panel A         │
│  ──────────────  │
│  Section B       │  ← Use Section para sub-agrupamento
│  ──────────────  │
└──────────────────┘
```

### 10.2 Bordas Duplicadas

```
✗ PROIBIDO:
┌──────────────────┐
│  ┌────────────┐  │  ← Duas bordas no mesmo lugar
│  │ Conteúdo   │  │
│  └────────────┘  │
└──────────────────┘

✓ CORRETO: Uma borda por Panel. Conteúdo interno sem borda.
```

### 10.3 Widgets Desalinhados

```
✗ PROIBIDO:
┌──────┐  ┌──────────┐
│ W1   │  │ W2 largo │  ← Larguras inconsistentes
└──────┘  └──────────┘
         ┌──────────┐
         │ W3       │  ← Fora de alinhamento com W1
         └──────────┘

✓ CORRETO: Widgets no dashboard usam grid de 12 colunas.
```

### 10.4 Espaçamento Inconsistente

```
✗ PROIBIDO:
Tarefa 1
Tarefa 2

Tarefa 3       ← Espaço extra entre T2 e T3

✓ CORRETO: Mesmo gap entre todos os itens.
```

### 10.5 Mistura de Responsabilidades

```
✗ PROIBIDO:
// Um componente que renderiza e busca dados
class TaskWidget {
    render() { ... }      ← OK
    fetchTasks() { ... }  ← ✗ Lógica de negócio no componente visual
}

✓ CORRETO:
// Componente recebe dados prontos
class TaskWidget {
    render(tasks) { ... }  ← Apenas renderização
}
```

### 10.6 Lógica Dentro de Componentes Visuais

```
✗ PROIBIDO: Componente que decide o que mostrar baseado em estado global
✗ PROIBIDO: Componente que formata dados (deve receber já formatados)
✗ PROIBIDO: Componente que calcula derived state
✓ CORRETO: Componente que renderiza o que recebe, ponto.
```

### 10.7 Duplicação

```
✗ PROIBIDO: Dois componentes que renderizam a mesma estrutura visual
  Exemplo: StatusBadge e AlertBadge que são a mesma coisa com nomes diferentes

✓ CORRETO: Um Badge com variant diferente.
```

### 10.8 Acoplamento

```
✗ PROIBIDO: GitSummary depender de TaskList internamente.
✗ PROIBIDO: Panel saber que o filho é um TaskList.
✓ CORRETO: Panel aceita qualquer filho. Composição decide o que vai dentro.
```

### 10.9 Renderização Manual

```
✗ PROIBIDO: Componente que desenha box-drawing manualmente com strings.
✗ PROIBIDO: Componente que gerencia posicionamento pixel a pixel.
✓ CORRETO: Componente usa sistema de layout (VStack, HStack, Columns).
```

### 10.10 Tabela de Anti-padrões

| # | Anti-padrão | Severidade | Como detectar |
|---|-------------|------------|---------------|
| 1 | Panel dentro de Panel | blocker | Buscar `Panel` aninhado |
| 2 | Label com variant inválida | blocker | Validar variant contra enum |
| 3 | Columns com soma ≠ 12 | blocker | Validar soma na construção |
| 4 | Componente com lógica de dados | blocker | Verificar imports de API/services |
| 5 | Espaçamento hardcoded | blocker | Procurar números mágicos de gap/padding |
| 6 | Cores hardcoded | blocker | Procurar códigos ANSI diretos |
| 7 | Unicode sem fallback | major | Verificar símbolos sem fallback |
| 8 | Filho em componente leaf | major | Validar props vs children |
| 9 | VStack/HStack aninhados | minor | Detectar redundância |
| 10 | Profundidade > 4 níveis | minor | Contar níveis de composição |

---

## 11. Checklist de Code Review

### 11.1 Estrutura

- [ ] O componente existe na árvore de componentes (§2)?
- [ ] O nome do componente segue a nomenclatura do catálogo?
- [ ] O componente está na categoria correta (Container/Leaf/Data/Feedback/Domain)?
- [ ] A pasta do componente é plana (sem subpastas)?
- [ ] O componente tem exatamente uma responsabilidade?

### 11.2 Props

- [ ] Todas as props estão documentadas no formato do catálogo?
- [ ] Toda prop tem tipo definido?
- [ ] Toda prop tem valor padrão?
- [ ] Toda prop tem valores válidos (enum ou range)?
- [ ] Não existem props booleanas com nome negativo (use `collapsed`, não `not_collapsed`)?
- [ ] Cores usam tokens semânticos, não valores hardcoded?
- [ ] Nenhuma prop aceita `any` ou tipo genérico sem restrição?
- [ ] Props de layout (width, gap, padding) usam tokens do sistema?

### 11.3 Composição

- [ ] O componente aceita/exige a quantidade correta de filhos?
- [ ] Os tipos de filhos são válidos para este componente (§9.1)?
- [ ] Nenhuma composição proibida (§9.2) está presente?
- [ ] A profundidade de composição não excede 4 níveis?
- [ ] Container components delegam layout a VStack/HStack?

### 11.4 Estados

- [ ] Todos os estados aplicáveis (§8.2) estão implementados?
- [ ] Estado vazio (empty) mostra mensagem explícita?
- [ ] Estado de erro mostra mensagem com sugestão de ação?
- [ ] Estado de carregamento mostra indicador visual?
- [ ] Estado disabled reduz opacidade e bloqueia interação?
- [ ] Todas as transições de estado são instantâneas?

### 11.5 Layout e Espaçamento

- [ ] O componente usa tokens de espaçamento (§5.1)?
- [ ] Padding usa tokens, nunca valores fixos?
- [ ] Gap usa tokens, nunca valores fixos?
- [ ] Larguras usam colunas (1-12) ou percentual do pai?
- [ ] O componente respeita overflow/truncamento?
- [ ] Altura do componente é previsível (auto ou fixa)?

### 11.6 Cores

- [ ] Todas as cores usam tokens semânticos (§7.1)?
- [ ] Nenhum código ANSI está hardcoded no componente?
- [ ] A variant correta está mapeada ao token semântico correto?
- [ ] Nenhuma informação depende exclusivamente de cor para ser transmitida?
- [ ] O fallback monocromático está disponível?

### 11.7 Unicode

- [ ] Todo símbolo Unicode tem fallback ASCII?
- [ ] Símbolos reservados (§18.2 do terminal_ui_spec) são usados apenas para seus propósitos?
- [ ] Caracteres de largura 2 têm padding adequado?
- [ ] Box-drawing forma ângulos perfeitos sem gaps?

### 11.8 Anti-padrões

- [ ] Nenhum anti-padrão da seção 10 está presente?
- [ ] Nenhuma caixa aninhada?
- [ ] Nenhuma borda duplicada?
- [ ] Nenhum componente com lógica de negócio?
- [ ] Nenhuma duplicação de componente?

### 11.9 Testes Visuais

- [ ] O componente renderiza corretamente no estado Normal?
- [ ] O componente renderiza corretamente no estado Compacto?
- [ ] O componente renderiza corretamente em terminal de 80 colunas?
- [ ] O componente renderiza corretamente em terminal de 180 colunas?
- [ ] O componente lida corretamente com overflow (truncamento ou wrap)?

### 11.10 Decisão Final

- [ ] O componente é necessário? (Não existe outro que resolva o mesmo problema?)
- [ ] O componente poderia ser substituído por composição de componentes existentes?
- [ ] Se sim → rejeitar. Criar apenas se composição exigir 6+ linhas repetidas.
- [ ] Se não → **aprovado para implementação**.

---

## Apêndice A — Índice Rápido de Componentes

| Componente | Tipo | Filhos? | Props-chave |
|-----------|------|---------|-------------|
| Panel | Container | 1 | title, icon, width, state |
| VStack | Container | 1..N | gap, align, padding, expand |
| HStack | Container | 1..N | gap, wrap, align, expand |
| Section | Container | 1..N | title, icon, collapsible |
| Columns | Container | Row (1..N) | gutter |
| Row | Container | 1 | width |
| Header | Container | 0 | icon, title, actions, variant |
| Footer | Container | 1..N | left, right |
| Label | Leaf | 0 | text, variant, align, truncate |
| Badge | Leaf | 0 | text, variant |
| Spacer | Leaf | 0 | min |
| Divider | Leaf | 0 | label, variant |
| Icon | Leaf | 0 | symbol, color, fallback |
| ProgressBar | Leaf | 0 | value, width, variant |
| List | Data | 0 | items, marker, max_items |
| TaskList | Data | 0 | tasks, show_count, active_task_id |
| Table | Data | 0 | columns, rows, sortable |
| Tree | Data | 0 | nodes, max_depth |
| Timeline | Data | 0 | events, max_events |
| Stat | Data | 0 | label, value, icon, variant |
| Alert | Feedback | 0 | variant, title, message, action |
| EmptyState | Feedback | 0 | message, action, icon |
| StatusIndicator | Feedback | 0 | state, label |
| LoadingSpinner | Feedback | 0 | label, variant |
| GitSummary | Domain | 0 | branch, added, modified, deleted |
| WorkspaceInfo | Domain | 0 | name, path, version |
| FocusWidget | Domain | 0 | task_title, elapsed_seconds |
| ActivityWidget | Domain | 0 | events, max_events, filter |
| WeekChart | Domain | 0 | data, max_height, labels |
| Prompt | Domain | 0 | path, git_branch, exit_code |
| Dashboard | Domain | Panel (1..10) | widgets, breakpoint, collapsed |

---

## Apêndice B — Glossário

| Termo | Definição |
|-------|-----------|
| **Token** | Valor atômico do design system (cor, espaçamento, tipo) |
| **Componente** | Bloco reutilizável de UI com props, estado e comportamento definidos |
| **Container** | Componente que gerencia layout e aceita filhos |
| **Leaf** | Componente terminal que exibe conteúdo e não aceita filhos |
| **Data** | Componente que recebe dados e renderiza estrutura |
| **Feedback** | Componente que notifica estado ao usuário |
| **Domain** | Componente específico do domínio do terminal |
| **Prop** | Parâmetro de entrada de um componente |
| **Variant** | Subconjunto de variação visual controlada por prop enumerada |
| **Token semântico** | Nome abstrato para um valor de design (ex: `Color.success`) |
| **Composição** | Combinação de componentes para formar UI mais complexa |
| **Breakpoint** | Largura de terminal que altera layout |

---

## Apêndice C — Histórico de Revisão

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-07-11 | Lead Software Architect + Lead UX Engineer | Documento inicial — especificação completa do Design System |

---

> **Este documento, em conjunto com `terminal_ui_spec.md`, constitui a fonte única de verdade para toda a interface do Thinker Terminal.**
> Nenhum componente pode ser implementado sem aprovação do arquiteto.
> Nenhum componente aprovado pode violar as regras definidas aqui.
> Toda violação detectada em code review deve bloquear o merge.
