# Especificação de Interface do Terminal — Thinker Terminal UI

> **Documento Oficial de UX/UI**
> Versão: 1.0
> Status: Aprovado
> Classificação: Fonte Única de Verdade

---

## Índice

1. [Objetivos de UX](#1-objetivos-de-ux)
2. [Filosofia Visual](#2-filosofia-visual)
3. [Hierarquia de Informação](#3-hierarquia-de-informação)
4. [Sistema de Layout em Grade](#4-sistema-de-layout-em-grade)
5. [Estados da Interface](#5-estados-da-interface)
6. [Sistema de Espaçamento](#6-sistema-de-espaçamento)
7. [Sistema de Alinhamento](#7-sistema-de-alinhamento)
8. [Regras de Largura e Altura](#8-regras-de-largura-e-altura)
9. [Overflow e Scroll](#9-overflow-e-scroll)
10. [Responsividade](#10-responsividade)
11. [Comportamento das Colunas](#11-comportamento-das-colunas)
12. [Regras para Widgets](#12-regras-para-widgets)
13. [Estados Vazios (Empty States)](#13-estados-vazios-empty-states)
14. [Estados com Dados](#14-estados-com-dados)
15. [Estados Git](#15-estados-git)
16. [Estados de Tarefas](#16-estados-de-tarefas)
17. [Regras de Cores](#17-regras-de-cores)
18. [Regras de Unicode](#18-regras-de-unicode)
19. [Wireframes em ASCII](#19-wireframes-em-ascii)
20. [Checklist Visual](#20-checklist-visual)
21. [Anti-padrões — O Que NÃO PODE Acontecer](#21-anti-padrões--o-que-não-pode-acontecer)

---

## 1. Objetivos de UX

### 1.1 Propósito

Definir a interface de um ambiente de desenvolvimento profissional integrado ao Windows Terminal + PowerShell 7. Este terminal deve ser uma ferramenta de engenharia premium — tão refinada quanto um produto Apple, tão funcional quanto o Warp, tão confiável quanto o Terminal.app, e tão moderna quanto o Ghostty.

### 1.2 Principios Fundamentais

| Princípio | Descrição |
|-----------|-----------|
| **Clareza** | Cada elemento tem um propósito. Nada é decorativo sem função. |
| **Atalho** | Informação crítica deve estar a um golpe de vista. Sem scrolagem desnecessária. |
| **Consistência** | Padrões visuais são imutáveis entre estados, telas e resoluções. |
| **Silêncio** | A interface não compete com o conteúdo. Ela desaparece quando não necessária. |
| **Previsibilidade** | O layout nunca muda de forma brusca. Transições são suaves ou instantâneas mas nunca surpreendentes. |
| **Densidade Inteligente** | Mostre o máximo de informação útil no mínimo de espaço vertical possível. |

### 1.3 Metas Mensuráveis

- Um usuário novo deve conseguir identificar o estado do repositório Git em **≤ 2 segundos**.
- Um usuário novo deve conseguir identificar tarefas pendentes em **≤ 1 segundo**.
- Zero ambiguidade visual: qualquer elemento só pode ter uma interpretação possível.
- Toda ação deve ter feedback visual em **≤ 50ms**.
- A interface deve ocupar **≤ 30%** da altura total do terminal no estado Normal.

---

## 2. Filosofia Visual

### 2.1 Inspiração

```
Apple Engineering        →  Precisão, minimalismo, tipografia impecável
Ghostty                  →  Renderização nativa, desempenho, fidelidade visual
Warp                     →  UX moderna, blocos de código, inteligência integrada
Terminal.app (macOS)     →  Familiaridade, simplicidade, "simplesmente funciona"
```

### 2.2 Vocabulário Visual

| Atributo | Diretriz |
|----------|----------|
| **Tipografia** | Monoespaçada (Cascadia Code, JetBrains Mono, Meslo Nerd Font). Sem serifa. |
| **Peso visual** | Interface em 3 camadas: plano de fundo (passivo), informações estruturais (neutro), dados ativos (destaque). |
| **Bordas** | Nunca use bordas arredondadas em terminal. Ângulos retos. Use caracteres box-drawing. |
| **Sombras** | Zero. Terminal não tem sombras. |
| **Gradientes** | Zero. Terminal não tem gradientes. |
| **Transparência** | Zero no conteúdo. O terminal pode ter fundo translúcido, mas o conteúdo nunca. |
| **Ícones** | Apenas caracteres Unicode (Nerd Font icons ou fallback). Nunca imagens. |
| **Motion** | Sem animações. Transições instantâneas. Exceção: fade de 100ms para tooltips. |

### 2.3 Paleta Neutra (Base)

```
Fundo principal:        #0D0D0D (preto absoluto)
Fundo secundário:       #1A1A1A (quase preto)
Fundo elevado:          #262626 (painéis, cards)
Borda sutil:            #333333
Texto primário:         #E0E0E0
Texto secundário:       #888888
Texto terciário:        #555555 (placeholders, metadados)
```

### 2.4 Cores de Destaque (Accents)

```
Verde (padrão):         #00FF88
Azul:                   #58A6FF
Amarelo:                #FFC857
Vermelho:               #FF5555
Magenta:                #C586C0
Ciano:                  #00E5FF
Laranja:                #FF9922
Roxo:                   #A277FF
```

Todas as cores de destaque devem ter **WCAG AA** (ratio ≥ 4.5:1) contra o fundo `#0D0D0D`.

---

## 3. Hierarquia de Informação

### 3.1 Níveis de Importância

```
Nível 1 — ATENÇÃO IMEDIATA
├── Erros de compilação/execução
├── Mudanças no estado do Git (branch, conflitos)
├── Tarefas bloqueadas ou vencidas
└── Notificações do sistema (servidor caiu, engine crash)

Nível 2 — MONITORAMENTO ATIVO
├── Tarefas em andamento
├── Status do servidor (online/offline, latência)
├── Branch atual e status de arquivos
└── Timestamps e durações

Nível 3 — CONSULTA PASSIVA
├── Histórico de tarefas concluídas
├── Logs do terminal
├── Metadados de arquivos
└── Estatísticas de sessão
```

### 3.2 Mapa de Leitura

O olho do usuário percorre a interface nesta ordem:

```
1. CANTO SUPERIOR ESQUERDO    →  Branch + repositório
2. BARRA SUPERIOR              →  Status geral, tarefa ativa
3. PAINEL LATERAL              →  Lista de tarefas, widgets
4. ÁREA PRINCIPAL              →  Terminal/Console/output
5. BARRA INFERIOR              →  Status secundário, dicas
```

Nunca inverta esta ordem. Nunca coloque informação de Nível 1 na barra inferior.

---

## 4. Sistema de Layout em Grade

### 4.1 Definição da Grade

A interface usa um sistema de grid de **12 colunas** com gutter de 1 caractere.

```
┌─────────────────────────────────────────────────────────────────┐
│        1         2         3         4         5         6      │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐ │
│  │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
│  │ C │ C │ C │ C │ C │ C │ C │ C │ C │ C │ C │ C │ C │ C │ C │ │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │12 │   │   │   │ │
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘ │
│                      gutter (1 caracter)                        │
└─────────────────────────────────────────────────────────────────┘
```

**Regras da grade:**

- Cada coluna tem **largura variável** baseada na largura total do terminal ÷ 12.
- Uma coluna NUNCA pode ter largura menor que 4 caracteres.
- Gutter de exatamente 1 caractere entre colunas.
- Elementos ocupam múltiplos inteiros de colunas (1, 2, 3, 4, 6 ou 12).
- Um elemento NUNCA pode ocupar 5, 7, 8, 9, 10 ou 11 colunas.

### 4.2 Zonas da Interface

O terminal é dividido em **5 zonas** verticais:

```
┌─────────────────────────────────────────────────────────────────┐
│  ZONA 0: Barra Superior (Status Bar)          Altura: 1 linha   │
├─────────────────────────────────────────────────────────────────┤
│  ZONA 1: Dashboard / Widgets          Altura: variável (0-10)   │
├─────────────────────────────────────────────────────────────────┤
│  ZONA 2: Painel Lateral + Terminal        Altura: flexível      │
├─────────────────────────────────────────────────────────────────┤
│  ZONA 3: Output / Log                           Altura: flexível│
├─────────────────────────────────────────────────────────────────┤
│  ZONA 4: Barra Inferior (Status Bar)          Altura: 1 linha   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Mapa de Zonas em Grid

```
┌─────────────────────────────────────────────────────────────────┐
│  ZONA 0        C1-12                                            │
├───────┬─────────────────────────────────────────────────────────┤
│       │                                                         │
│  Z1   │         ZONA CENTRAL (C2-12 ou C3-12)                  │
│  C1-2 │                                                         │
│       │                                                         │
│       │         ┌───────────────────────────────────────────┐   │
│       │         │  Terminal (Z2)                            │   │
│       │         │                                           │   │
│       │         ├───────────────────────────────────────────┤   │
│       │         │  Output / Log (Z3)                        │   │
│       │         │                                           │   │
│       │         └───────────────────────────────────────────┘   │
├───────┴─────────────────────────────────────────────────────────┤
│  ZONA 4        C1-12                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Estados da Interface

### 5.1 Compacto

**Altura total:** ≤ 3 linhas.

```
┌─────────────────────────────────────────────────────────────────┐
│  main │ feat/new-ui │ +4 ~2  │  ●  Tarefa ativa: "Refatorar UX"│
├─────────────────────────────────────────────────────────────────┤
│  ✓  3/3 │ ✗ 0 │ ⚡ 480ms │ 📦 v2.1.0 │ 🔐 admin              │
└─────────────────────────────────────────────────────────────────┘
```

**Quando usar:** Terminal em tela cheia, usuário focado em código.
**O que aparece:** Zona 0 + Zona 4. Widgets colapsados a ícones.
**O que NÃO aparece:** Dashboard (Z1), Painel Lateral (Z2 separado), Output expandido.

### 5.2 Normal

**Altura total:** 5-10 linhas acima do prompt.

```
┌─────────────────────────────────────────────────────────────────┐
│  main │ feat/new-ui │ +4 ~2  │  ●  "Refatorar UX"  00:12:34   │
├───────┬─────────────────────────────────────────────────────────┤
│       │  📋 Backlog (4)          │  ⚡ Servidor: Online         │
│  ●    │  ■ Refatorar UX          │  🎯 Engine: Komodo 14.1     │
│  Tare-│  ■ Corrigir bug #42      │  📊 Uptime: 3h 12m         │
│  fas  │  □ Adicionar testes      │                             │
│       │  □ Documentar API        │                             │
├───────┴─────────────────────────────────────────────────────────┤
│  ✓  3/3 │ ✗ 0 │ ⚡ 480ms │ 📦 v2.1.0 │ 🔐 admin              │
└─────────────────────────────────────────────────────────────────┘
```

**Quando usar:** Estado padrão. Usuário alternando entre código e operações.
**O que aparece:** Zona 0 + Zona 1 (parcial) + Zona 4.

### 5.3 Expandido

**Altura total:** 20+ linhas ou altura total do terminal.

```
┌─────────────────────────────────────────────────────────────────┐
│  main │ feat/new-ui │ +4 ~2  │  ●  "Refatorar UX"  00:12:34   │
├───────┼─────────────────────────────────────────────────────────┤
│  📋   │  PowerShell 7.5.0                                      │
│  Back │  PS C:\project> npm run build                           │
│  log  │  ✔ Building...                                          │
│       │  ✔ Compiled successfully in 1.2s                       │
│       │  PS C:\project>                                        │
│  4 ta-│                                                         │
│  refas│  ┌─────────────────────────────────────────────────┐    │
│       │  │ Output: build complete                           │    │
│       │  │ 0 errors, 0 warnings                            │    │
│       │  └─────────────────────────────────────────────────┘    │
├───────┴─────────────────────────────────────────────────────────┤
│  ✓  3/3 │ ✗ 0 │ ⚡ 480ms │ 📦 v2.1.0 │ 🔐 admin              │
└─────────────────────────────────────────────────────────────────┘
```

**Quando usar:** Debug, análise de logs, gerenciamento de tarefas.
**O que aparece:** Todas as zonas.
**O que muda:** Painel lateral tem largura total de C1-3, terminal ocupa C4-12, output expandido.

### 5.4 Tabela de Transição

| De → Para | Animação | Gatilho |
|-----------|----------|---------|
| Compacto → Normal | Instantânea | `Ctrl+Shift+D` |
| Normal → Expandido | Instantânea | `Ctrl+Shift+E` |
| Normal → Compacto | Instantânea | `Ctrl+Shift+C` |
| Expandido → Normal | Instantânea | `Ctrl+Shift+E` |
| Qualquer → Qualquer | Instantânea | Comando `:compact`, `:normal`, `:expand` |

---

## 6. Sistema de Espaçamento

### 6.1 Escala de Espaçamento

| Token | Caracteres | Uso |
|-------|------------|-----|
| `0` | 0 | Sem espaçamento |
| `xs` | 1 | Entre ícone e texto no mesmo widget |
| `sm` | 2 | Entre widgets no mesmo painel |
| `md` | 3 | Entre painéis, margem interna de painéis |
| `lg` | 4 | Entre zonas verticais |
| `xl` | 6 | Margem externa do conteúdo às bordas do terminal |

### 6.2 Regras de Padding Interno

| Elemento | Padding Horizontal | Padding Vertical |
|----------|-------------------|------------------|
| Barra de status (Z0, Z4) | 1 caractere (esq/dir) | 0 (1 linha) |
| Painel lateral | 2 caracteres (esq/dir) | 1 linha (top/bot) |
| Widget | 2 caracteres (esq/dir) | 1 linha (top/bot) |
| Card de tarefa | 2 caracteres (esq/dir) | 0 (1 linha) |
| Output box | 1 caractere (esq/dir) | 1 linha (top/bot) |

### 6.3 Espaçamento Entre Elementos

```
Entre ícone e label:     1 caractere (xs)
Entre checkbox e label:  1 caractere (xs)
Entre widgets:           2 caracteres (sm)
Entre painéis:           3 caracteres (md)
Entre zonas:             1 linha vazia ou linha de separação
```

---

## 7. Sistema de Alinhamento

### 7.1 Alinhamento Vertical

| Elemento | Alinhamento |
|----------|-------------|
| Texto em barra de status | Alinhado ao topo da linha |
| Widgets em painel lateral | Alinhado ao topo |
| Cards de tarefa | Alinhado ao topo |
| Grupo de botões | Alinhado ao topo |
| Métricas (ex: "3/5") | Linha de base do texto adjacente |

### 7.2 Alinhamento Horizontal

| Elemento | Alinhamento |
|----------|-------------|
| Nome do repositório | Esquerda (Z0, C1-3) |
| Nome da branch | Esquerda, após repositório (Z0) |
| Tarefa ativa | Esquerda (Z0, após branch) |
| Timers | Direita (Z0, C10-12) |
| Widget content | Esquerda |
| Métricas em painel | Esquerda |
| Separadores | Centralizado verticalmente no texto |

### 7.3 Grade de Alinhamento Interno

Dentro de um widget ou card, o alinhamento segue esta régua:

```
┌─────────────────────────────────────────┐
│  ●  Nome da Tarefa                      │  ← Marcador na C1
│  │  │                                   │
│  ●  └─ Estado: Em andamento             │  ← Conteúdo indentado 1 caracter
│     └─ Prioridade: Alta                 │  ← Sub-indentado 2 caracteres
└─────────────────────────────────────────┘
```

---

## 8. Regras de Largura e Altura

### 8.1 Larguras Fixas

| Elemento | Largura | Condição |
|----------|---------|----------|
| Painel lateral | C1-2 (≈16% do terminal) | Estado Normal |
| Painel lateral expandido | C1-3 (≈25% do terminal) | Estado Expandido |
| Painel lateral colapsado | 0 | Estado Compacto |
| Widget | C1-2 ou C1-12 | Largura total do painel |
| Barra de status | 100% (C1-12) | Sempre |
| Área de terminal | C3-12 ou C4-12 | Dependente do painel |

### 8.2 Alturas Fixas

| Elemento | Altura | Condição |
|----------|--------|----------|
| Barra superior (Z0) | 1 linha | Sempre |
| Barra inferior (Z4) | 1 linha | Sempre |
| Dashboard (Z1) | 0-10 linhas | Estado-dependente |
| Cada widget | 3-8 linhas | Conteúdo-dependente |

### 8.3 Alturas Mínimas e Máximas

| Elemento | Mínimo | Máximo |
|----------|--------|--------|
| Painel lateral | 0 (colapsado) | Altura total - 2 (Z0 + Z4) |
| Widget no dashboard | 3 linhas | 8 linhas |
| Card de tarefa | 1 linha | 3 linhas |
| Output box | 3 linhas | Altura total - 5 |

### 8.4 Largura Mínima do Terminal

| Condição | Largura Mínima |
|----------|----------------|
| Exibir estado Normal | 80 caracteres |
| Exibir painel lateral | 100 caracteres |
| Exibir painel lateral expandido | 120 caracteres |
| Abaixo do mínimo | Forçar estado Compacto |

---

## 9. Overflow e Scroll

### 9.1 Comportamento por Zona

| Zona | Overflow Horizontal | Overflow Vertical |
|------|-------------------|-------------------|
| Z0 (Barra superior) | Truncar à direita com `…` | N/A (1 linha) |
| Z1 (Dashboard) | Truncar à direita com `…` | Scroll vertical (interno ao widget) |
| Z2 (Painel lateral) | Truncar com `…` se C < 4 | Scroll vertical |
| Z3 (Terminal/Output) | Wrap ou scroll (configurável) | Scroll infinito (buffer circular) |
| Z4 (Barra inferior) | Truncar à direita com `…` | N/A (1 linha) |

### 9.2 Regras de Truncamento

- Nomes de branch com mais de 25 caracteres: `refatora-modulo-de-autentic…`
- Caminhos de arquivo com mais de 40 caracteres: `…/src/components/button.tsx`
- Títulos de tarefa com mais de 50 caracteres: truncar com `…`
- Timestamps longos: formato `HH:MM:SS` (nunca exibir nanossegundos em status)

### 9.3 Indicadores de Overflow

```
Setas visíveis quando há scroll:
  ┌─────────────────────┐
  │ Tarefa 1         ▲ │  ← Scroll up disponível
  │ Tarefa 2          │ │
  │ Tarefa 3          │ │
  │ Tarefa 4         ▼ │  ← Scroll down disponível
  └─────────────────────┘
```

Indicadores de scroll SÓ aparecem quando o conteúdo excede a área visível. Nunca mostre indicadores sem necessidade.

---

## 10. Responsividade

### 10.1 Breakpoints

| Nome | Largura do Terminal | Comportamento |
|------|--------------------|---------------|
| `xs` | < 80 caracteres | Forçar Compacto. Painel lateral escondido. Apenas Z0 + Z4. |
| `sm` | 80-99 caracteres | Normal. Painel lateral colapsável por padrão. Widgets condensados. |
| `md` | 100-139 caracteres | Normal. Painel lateral visível (C1-2). 2 colunas de widgets. |
| `lg` | 140-179 caracteres | Normal/Expandido. Painel lateral C1-2. 3 colunas de widgets. |
| `xl` | ≥ 180 caracteres | Expandido. Painel lateral C1-3. Widgets em grid 3-4 colunas. |

### 10.2 Adaptação de Layout

| Breakpoint | Layout |
|------------|--------|
| `xs` | `[Z0] [Terminal] [Z4]` |
| `sm` | `[Z0] [Terminal | Z4]` |
| `md` | `[Z0] [Sidebar | Terminal] [Z4]` |
| `lg` | `[Z0] [Dashboard] [Sidebar | Terminal] [Z4]` |
| `xl` | `[Z0] [Dashboard] [Sidebar-exp | Terminal] [Z4]` |

### 10.3 Redimensionamento

Ao redimensionar o terminal:

1. Recalcular grade de 12 colunas.
2. Se largura < breakpoint atual → reflow instantâneo.
3. Widgets que não couberem no dashboard são movidos para o painel lateral.
4. Se ainda não couberem, são colapsados a ícones.
5. Se ainda assim não couberem, são escondidos com notificação na Z4.

Nunca distorça o layout. Nunca deforme caracteres. Sempre prefira esconder a quebrar.

---

## 11. Comportamento das Colunas

### 11.1 Colunas em Listas

```
prioridade  status      título                    prazo
─────────────────────────────────────────────────────────
🔴          em_andamento Refatorar UX             20/01
🟡          revisão      Corrigir bug #42         22/01
🟢          concluída    Adicionar testes         18/01
```

### 11.2 Regras de Colunas em Listas

- Cada coluna tem largura fixa baseada no conteúdo (nunca percentual).
- A última coluna (título) ocupa todo o espaço restante.
- Colunas NUNCA podem ter largura menor que o cabeçalho.
- Se a soma das colunas exceder a largura disponível, a última coluna é truncada.

### 11.3 Alinhamento por Tipo de Dado

| Tipo | Alinhamento |
|------|-------------|
| Texto | Esquerda |
| Números | Direita |
| Timestamps | Esquerda (estilo ISO) |
| Ícones | Centro |
| Status badges | Centro |
| Prioridade | Centro |
| Checkboxes | Centro |

---

## 12. Regras para Widgets

### 12.1 Anatomia de um Widget

```
┌─────────────────────────────────────────┐
│  ●  Nome do Widget           ⋮ ⇕ ✕    │  ← Header (1 linha)
├─────────────────────────────────────────┤
│  Conteúdo                               │  ← Body (2-6 linhas)
│  linha 2                                │
│  linha 3                                │
└─────────────────────────────────────────┘
```

### 12.2 Elementos do Header

| Elemento | Posição | Função |
|----------|---------|--------|
| Ícone | Primeira coluna (C1) | Identificação visual rápida |
| Nome | Segunda coluna | Título do widget |
| ⋮ (menu) | Canto superior direito | Ações do widget |
| ⇕ (colapsar) | Antes do ✕ | Alterna expansão |
| ✕ (fechar) | Última coluna | Remove widget do dashboard |

### 12.3 Tipos de Widget

| Tipo | Header | Conteúdo | Altura típica |
|------|--------|----------|---------------|
| **Tarefas** | `📋 Tarefas (N)` | Lista de tarefas com checkbox | 4-8 linhas |
| **Git Status** | `⎇ Git: main` | Arquivos alterados, branch | 3-6 linhas |
| **Servidor** | `⚡ Servidor` | Status, latência, versão | 3-5 linhas |
| **Engine** | `🎯 Engine` | Status, profundidade, tempo | 3-5 linhas |
| **Sessão** | `⏱ Sessão` | Duração, tarefas concluídas | 3-4 linhas |
| **Log** | `📜 Log (N)` | Últimos N eventos | 4-8 linhas |

### 12.4 Estados de Widget

| Estado | Header | Body |
|--------|--------|------|
| **Carregando** | `📋 Tarefas` | `⏳ Carregando...` (animação de spinner via caracteres) |
| **Vazio** | `📋 Tarefas (0)` | `— Nenhuma tarefa pendente` (em cinza terciário) |
| **Erro** | `⚠ Tarefas` | `✗ Falha ao carregar tarefas` (em vermelho) |
| **Dados** | `📋 Tarefas (N)` | Lista de tarefas |

---

## 13. Estados Vazios (Empty States)

### 13.1 Regra Geral

Todo estado vazio DEVE ter uma mensagem explícita. Nunca deixe um espaço em branco sem explicação.

### 13.2 Mensagens por Contexto

| Contexto | Mensagem | Cor |
|----------|----------|-----|
| Sem tarefas pendentes | `— Nenhuma tarefa pendente` | `#555555` (terciário) |
| Sem tarefas concluídas | `— Nenhuma tarefa concluída ainda` | `#555555` |
| Sem alterações Git | `— Working tree limpo` | `#888888` (secundário) |
| Sem repositório | `— Fora de um repositório Git` | `#888888` |
| Servidor offline | `— Servidor desconectado` | `#FF5555` (vermelho) |"
│ Sem logs | `— Nenhum evento registrado` | `#555555` |
| Sem resultados | `— Nenhum resultado encontrado` | `#555555` |
| Primeira execução | `— Bem-vindo! Nenhum dado ainda.` | `#00FF88` (verde destaque) |

### 13.3 Formatação de Estado Vazio

```
Linha 1:  ─── duplicado de espaçamento
Linha 2:  — Mensagem de estado vazio
Linha 3:  (opcional) sugestão de ação
```

Exemplo:
```
┌─────────────────────────────────────┐
│  📋 Tarefas (0)                     │
├─────────────────────────────────────┤
│  — Nenhuma tarefa pendente          │
│  Crie uma tarefa com :task create   │
└─────────────────────────────────────┘
```

---

## 14. Estados com Dados

### 14.1 Tarefas

```
┌─────────────────────────────────────┐
│  📋 Tarefas (4)                     │
├─────────────────────────────────────┤
│  ■  Refatorar UX            🔴 20/01│
│  ■  Corrigir bug #42       🟡 22/01│
│  □  Adicionar testes        🟢 25/01│
│  □  Documentar API          🔵 28/01│
│                                     │
│  ✓ 3 concluídas  │  ✗ 0 canceladas │
└─────────────────────────────────────┘
```

**Regras:**
- Tarefa em andamento: `■` (preenchido)
- Tarefa pendente: `□` (vazio)
- Tarefa concluída: `✓` (check)
- Prioridade indicada por círculo colorido antes da data
- Contador no final: `✓ N concluídas │ ✗ N canceladas`

### 14.2 Git Status

```
┌─────────────────────────────────────┐
│  ⎇ Git: feat/new-ui                 │
├─────────────────────────────────────┤
│  +4  ~2  -1                         │
│  M  src/components/header.tsx       │
│  M  src/styles/main.css             │
│  A  src/utils/helpers.ts            │
│  D  src/old/legacy.ts               │
│                                     │
│  ● 3 commits ahead of main         │
└─────────────────────────────────────┘
```

**Regras:**
- `+N` = arquivos adicionados (verde)
- `~N` = arquivos modificados (amarelo)
- `-N` = arquivos deletados (vermelho)
- `M` = modified, `A` = added, `D` = deleted
- Cores dos status badges: M=amarelo, A=verde, D=vermelho
- Sempre mostrar ahead/behind quando aplicável

### 14.3 Servidor

```
┌─────────────────────────────────────┐
│  ⚡ Servidor                        │
├─────────────────────────────────────┤
│  ●  Online          480ms          │
│  🎯  Komodo 14.1    profundidade 18 │
│  📊  Uptime: 3h 12m   cache: 892   │
│  📦  v2.1.0          build #420    │
└─────────────────────────────────────┘
```

**Regras:**
- Status online: círculo verde `●`
- Status offline: círculo vermelho `●`
- Latência sempre em ms
- Profundidade da engine sempre visível
- Versão do servidor sempre visível

---

## 15. Estados Git

### 15.1 Dentro de um Repositório Git

**Z0 (Barra superior) — Formatação do Git:**

```
main          →  branch principal (verde)
feat/new-ui   →  branch de feature (azul)
fix/bug-42    →  branch de fix (amarelo)
HEAD detached →  detached HEAD (vermelho)
```

**Indicadores de estado:**

```
main │ +4 ~2 -1           →  Mudanças não commitadas (4 add, 2 mod, 1 del)
main │ ● 3 ↑ 1 ↓          →  3 commits ahead, 1 behind (setas unicode ↑↓)
main │ ⚠ conflito         →  Conflito de merge detectado
main │ ✓ limpo             →  Working tree limpo
```

### 15.2 Fora de um Repositório

```
┌─────────────────────────────────────┐
│  📁 projeto — Fora do Git           │
│                                     │
│  — Nenhum repositório Git detectado │
│  Inicialize com `git init`         │
└─────────────────────────────────────┘
```

**Alterações visuais quando fora do Git:**
- Z0: Nome da branch substituído por `—` + nome da pasta
- Widget Git: removido ou mostra estado "fora do Git"
- Indicadores de diff: removidos
- Comandos Git no prompt: desabilitados

### 15.3 Transições de Estado Git

| Evento | Ação Visual |
|--------|-------------|
| `git init` | Widget Git aparece com mensagem "Repositório inicializado" |
| `git add` | Contador +N atualiza instantaneamente |
| `git commit` | Contador zera, histórico atualiza |
| `git checkout` | Nome da branch muda, diff recalcula |
| `git merge` | Indicador de merge aparece, conflitos destacados em vermelho |
| `git push` | Setas ahead/behind atualizam |

---

## 16. Estados de Tarefas

### 16.1 Sem Tarefas Ativas

```
┌─────────────────────────────────────┐
│  📋 Tarefas (0)                     │
│                                     │
│  — Nenhuma tarefa pendente          │
│  • Crie:  :task create "descrição" │
│  • Listar: :task list              │
└─────────────────────────────────────┘
```

**Z0 sem tarefas:**
```
main │ ✓ limpo                         │  📋 0 tarefas
```

### 16.2 Com Tarefas Ativas

```
┌─────────────────────────────────────┐
│  📋 Tarefas (3)                     │
├─────────────────────────────────────┤
│  ■ Refatorar UX              🔴 20/01│
│  ■ Corrigir bug #42          🟡 22/01│
│  □ Adicionar testes          🟢 25/01│
│                                     │
│  ✓ 5 concluídas  │  ✗ 1 canceladas  │
│  ⏱ Tempo total: 12h 34m           │
└─────────────────────────────────────┘
```

**Z0 com tarefas:**
```
main │ ✓ limpo    │  ●  "Refatorar UX"  00:12:34
```

**Regras:**
- A tarefa ativa aparece na Z0 com timer
- Timer incrementa em tempo real (atualização a cada 1s)
- Timer pausa quando terminal perde foco (opcional)
- Múltiplas tarefas ativas: mostrar apenas a primeira com indicador `+N`

### 16.3 Hierarquia de Tarefas

```
■  Tarefa pai
└─ ■  Subtarefa 1
   └─ □  Subtarefa 2
```

- Subtarefas indentadas com 2 caracteres
- Uso do caracter `└─` (box-drawing) para conectar hierarquia
- Até 3 níveis de profundidade
- Contador no pai inclui subtarefas: `Tarefa pai (2/4)`

---

## 17. Regras de Cores

### 17.1 Paleta de Interface

```
Token               ANSI      HEX       Uso
─────────────────────────────────────────────────
bg-primary          0;0;0     #0D0D0D  Fundo principal
bg-secondary        232       #1A1A1A  Painéis, zonas
bg-elevated         235       #262626  Widgets, cards
border-subtle       236       #333333  Bordas de painéis
text-primary        255       #E0E0E0  Texto principal
text-secondary      244       #888888  Labels, metadados
text-tertiary       240       #555555  Placeholders, vazio
accent-green        2;0;0     #00FF88  Sucesso, online, add
accent-blue         4;0;0     #58A6FF  Links, info, branch feat
accent-yellow       3;0;0     #FFC857  Alerta, warning, modified
accent-red          1;0;0     #FF5555  Erro, offline, delete
accent-magenta      5;0;0     #C586C0  Destaque, debugging
accent-cyan         6;0;0     #00E5FF  Informação, destaque suave
accent-orange       202       #FF9922  Prioridade alta, merge
accent-purple       141       #A277FF  Prioridade média, badges
```

### 17.2 Estados em Cores

| Estado | Cor |
|--------|-----|
| Online, sucesso, completo | Verde (`#00FF88`) |
| Offline, erro, bloqueado | Vermelho (`#FF5555`) |
| Alerta, pendente, modificado | Amarelo (`#FFC857`) |
| Informativo, dica | Azul (`#58A6FF`) |
| Debug, verbose | Magenta (`#C586C0`) |
| Destaque suave | Ciano (`#00E5FF`) |
| Prioridade alta | Laranja (`#FF9922`) |
| Prioridade média | Roxo (`#A277FF`) |
| Prioridade baixa | Cinza terciário (`#555555`) |

### 17.3 Regras de Contraste

- Texto branco (`#E0E0E0`) sobre fundo primário (`#0D0D0D`): **OK** (ratio 15:1)
- Texto secundário (`#888888`) sobre fundo primário (`#0D0D0D`): **OK** (ratio 5.5:1)
- Texto terciário (`#555555`) sobre fundo primário (`#0D0D0D`): **OK** (ratio 4.5:1)
- NUNCA use texto branco sobre amarelo claro
- NUNCA use texto vermelho sobre fundo escuro (baixo contraste)
- NUNCA use apenas cor para transmitir informação — sempre acompanhe de ícone ou texto

### 17.4 Modo Monocromático (Fallback)

Quando o terminal não suporta cores true-color ou o usuário opta por modo monocromático:

| Cor Original | Substituto |
|--------------|------------|
| Verde (`#00FF88`) | `[OK]` ou `✓` |
| Vermelho (`#FF5555`) | `[ERR]` ou `✗` |
| Amarelo (`#FFC857`) | `[WARN]` ou `⚠` |
| Azul (`#58A6FF`) | `[INFO]` ou `ℹ` |

---

## 18. Regras de Unicode

### 18.1 Caracteres Permitidos

| Categoria | Intervalo | Exemplos | Uso |
|-----------|-----------|----------|-----|
| Box-drawing | U+2500–U+257F | `─│┌┐└┘├┤┬┴┼` | Bordas, painéis, grids |
| Setas | U+2190–U+21FF | `↑↓←→↔↕↖↗↘↙` | Indicadores de scroll, navegação |
| Símbolos | U+25A0–U+25FF | `■□●○◉◆◇▪▫` | Marcadores, status |
| Checks | U+2713–U+2717 | `✓✗✘` | Sucesso/erro |
| Estrelas | U+2605–U+2606 | `★☆` | Favoritos, destaques |
| Relógio | U+23F0–U+23F3 | `⏰⏱⏲⏳` | Timers |
| Setas técnicas | U+23CE–U+23CF | `⏎` | Enter, retorno |
| Engrenagem | U+2699 | `⚙` | Configuração |
| Relâmpago | U+26A1 | `⚡` | Servidor, energia, performance |
| Cadeado | U+1F512 | `🔒` | Segurança, admin |
| Chave | U+1F511 | `🔑` | Autenticação |
| Pasta | U+1F4C1 | `📁` | Diretório |
| Documento | U+1F4C4 | `📄` | Arquivo |
| Lápis | U+270F | `✏` | Edição |
| Caixa de seleção | U+2611 | `☑` | Checkbox marcado |
| Caixa vazia | U+2610 | `☐` | Checkbox desmarcado |
| Símbolo de aviso | U+26A0 | `⚠` | Alerta, warning |
| Símbolo de proibido | U+1F6AB | `🚫` | Bloqueado, negado |
| Olho | U+1F441 | `👁` | Visualizar, mostrar |
| Calendário | U+1F4C5 | `📅` | Data, prazo |
| Tag | U+1F3F7 | `🏷` | Tag, label |
| Coração | U+2764 | `❤` | Favorito |
| Seta de Git | U+2B06 | `⬆` | Ahead no Git |
| Seta de Git | U+2B07 | `⬇` | Behind no Git |

### 18.2 Símbolos Reservados do Sistema

| Caracter | Uso Exclusivo em |
|----------|------------------|
| `●` | Status online/carregando (nunca use para bullet) |
| `○` | Estado inativo (nunca use para checkbox) |
| `■` | Tarefa em andamento (nunca use para decoração) |
| `□` | Tarefa pendente (checkbox) |
| `✓` | Sucesso, concluído (nunca use para menu) |
| `✗` | Erro, cancelado |
| `⚠` | Alerta, warning |
| `ℹ` | Informação |
| `⏳` | Carregando |
| `⚡` | Servidor |
| `⎇` | Git (alternativo ao ícone de branch) |
| `📋` | Tarefas |
| `📜` | Log |
| `🎯` | Engine |
| `🔐` | Admin/segurança |

### 18.3 Regras de Largura de Caracteres

- Box-drawing e símbolos (U+2500–U+257F) têm largura fixa de 1 célula.
- Emojis (U+1Fxxx) têm largura de 2 células em terminais modernos.
- NUNCA misture emojis de largura 2 com texto monoespaçado sem padding explícito.
- Ícones de menu nunca devem quebrar o alinhamento vertical.
- Prefira símbolos Unicode (U+25xx, U+26xx) a emojis (U+1Fxxx) para elementos de interface.

### 18.4 Fallback Unicode

Se um caracter não estiver disponível na fonte atual:

| Simbolo Planejado | Fallback Nível 1 | Fallback Nível 2 |
|--------------------|------------------|------------------|
| `📋` (U+1F4CB) | `[#]` | `[T]` |
| `⚡` (U+26A1) | `[~]` | `[S]` |
| `🎯` (U+1F3AF) | `[*]` | `[E]` |
| `⎇` (U+2387) | `[G]` | `[G]` |
| `●` (U+25CF) | `[o]` | `[+]` |
| `■` (U+25A0) | `[#]` | `[=]` |
| `✓` (U+2713) | `[v]` | `[+]` |
| `✗` (U+2717) | `[x]` | `[-]` |

---

## 19. Wireframes em ASCII

### 19.1 Terminal Vazio (Primeira Execução)

```
┌─────────────────────────────────────────────────────────────────┐
│  ~                    —                    —  Bem-vindo(a)!     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        Thinker Terminal                         │
│                     ─────────────────────                         │
│                      Ambiente de desenvolvimento                 │
│                                                                  │
│              — Bem-vindo! Nenhum dado ainda.                     │
│              Use :help para começar                              │
│                                                                  │
│              PS C:\Users\user>                                   │
│                                                                  │
│              _   ← cursor piscante                              │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ✓  0/0 │ ✗ 0 │ ⚡ — │ 📦 — · │ 🔐 —                           │
└─────────────────────────────────────────────────────────────────┘
```

### 19.2 Estado Normal — Com Tarefas e Git

```
┌─────────────────────────────────────────────────────────────────┐
│  think │ main │ ✓ limpo           ●  "Refatorar UX"  00:12:34  │
├──────────────────┬──────────────────────────────────────────────┤
│  📋 Tarefas (3) │  PowerShell 7.5.0                            │
│                  │  PS C:\project> npm run dev                  │
│  ■ Refatorar UX  │  ✔ Starting development server...           │
│    🔴 20/01      │  ✔ Local: http://localhost:5173            │
│  ■ Bug #42       │                                              │
│    🟡 22/01      │                                              │
│  □ Testes        │                                              │
│    🟢 25/01      │                                              │
│                  │                                              │
│  ✓ 5 │ ✗ 1       │                                              │
├──────────────────┴──────────────────────────────────────────────┤
│  ✓  5/5 │ ✗ 1 │ ⚡ 480ms │ 📦 v2.1.0 │ 🔐 admin               │
└─────────────────────────────────────────────────────────────────┘
```

### 19.3 Estado Expandido — Dashboard Completo

```
┌─────────────────────────────────────────────────────────────────┐
│  think │ fix/crash-handler ⚠  │ ⏱  "Corrigir crash"  00:05:12 │
├──────────┬──────────────────────────────────────────────────────┤
│  📋 Tare-│  ⎇ Git: fix/crash-handler     ⚡ Servidor            │
│  fas (5) │  ────────────────────────     ─────────────          │
│          │                              ● Online     320ms     │
│  ■ Crash │  !M src/main.js               🎯 Komodo 14.1        │
│  ■ Refac │  !M src/handler.js            depth: 22             │
│  □ Testes│  !A src/crash.log             📊 uptime: 8h 22m     │
│  □ Doc   │                              📦 v2.2.0-rc1          │
│  □ Deploy│                                                     │
│          │  ---                                                 │
│  ✓ 12    │  ● 3 commits ahead of main                          │
│  ✗ 2     │  ⚠ conflito em main.js                              │
├──────────┴──────────────────────────────────────────────────────┤
│  📜 Log (últimos eventos)                                      │
│  ─────────────────────────────────────────────────────         │
│  [14:32:01]  ✓  Deploy: build #420 concluído                   │
│  [14:30:45]  ✗  Deploy: build #419 falhou (teste unitário)    │
│  [14:28:12]  ✓  Cache engine hit ratio: 94%                   │
│  [14:25:00]  ⚠  Latência alta detectada: 1200ms               │
├─────────────────────────────────────────────────────────────────┤
│  ✓  12/14 │ ✗ 2 │ ⚡ 320ms │ 📦 v2.2.0-rc1 │ 🔐 admin        │
└─────────────────────────────────────────────────────────────────┘
```

### 19.4 Estado Compacto

```
┌─────────────────────────────────────────────────────────────────┐
│  think │ main │ ✓ limpo           ●  "Refatorar UX"  00:12:34  │
├─────────────────────────────────────────────────────────────────┤
│  PowerShell 7.5.0                                              │
│  PS C:\project>                                                │
│  _                                                              │
├─────────────────────────────────────────────────────────────────┤
│  ✓  5/5 │ ✗ 1 │ ⚡ 480ms │ 📦 v2.1.0 │ 🔐 admin               │
└─────────────────────────────────────────────────────────────────┘
```

### 19.5 Fora do Git

```
┌─────────────────────────────────────────────────────────────────┐
│  ~                    📁 projeto            —  0 tarefas        │
├──────────────────┬──────────────────────────────────────────────┤
│  📋 Tarefas (0) │  PowerShell 7.5.0                            │
│                  │  PS C:\Users\user\Documents\projeto>        │
│  — Nenhuma       │                                              │
│  tarefa pendente │                                              │
│                  │                                              │
│                  │                                              │
│                  │                                              │
├──────────────────┴──────────────────────────────────────────────┤
│  ✓  0/0 │ ✗ 0 │ ⚡ — │ 📦 — · │ 🔐 —                          │
└─────────────────────────────────────────────────────────────────┘
```

### 19.6 Servidor Offline — Estado de Erro

```
┌─────────────────────────────────────────────────────────────────┐
│  ~                    —                    —  ⚠ Servidor off   │
├──────────────────┬──────────────────────────────────────────────┤
│  📋 Tarefas (3) │  ● Servidor: OFFLINE                         │
│                  │  ✗ Falha ao conectar em localhost:5000      │
│  ■ Refatorar UX  │                                              │
│    🔴 20/01      │  Possíveis causas:                          │
│  ■ Bug #42       │  • Servidor não está rodando                │
│    🟡 22/01      │  • Porta 5000 já está em uso               │
│  □ Testes        │  • Firewall bloqueando conexão              │
│    🟢 25/01      │                                              │
│                  │  Tente: :server start                       │
│  ✓ 5 │ ✗ 1       │                                              │
├──────────────────┴──────────────────────────────────────────────┤
│  ✓  5/5 │ ✗ 1 │ ⚡ ❌ │ 📦 — · │ 🔐 —                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 20. Checklist Visual

### 20.1 Checklist de Layout

- [ ] Todas as 5 zonas estão presentes no estado Normal/Expandido?
- [ ] A largura total do terminal é preenchida sem espaços sobrando?
- [ ] O grid de 12 colunas está sendo respeitado?
- [ ] Gutters têm exatamente 1 caractere?
- [ ] Nenhum elemento ocupa 5, 7, 8, 9, 10 ou 11 colunas?
- [ ] O painel lateral tem exatamente C1-2 (≈16%) no estado Normal?
- [ ] O painel lateral expandido tem exatamente C1-3 (≈25%)?
- [ ] As barras de status (Z0, Z4) têm exatamente 1 linha?
- [ ] O espaçamento entre painéis é exatamente md (3 caracteres)?
- [ ] O padding interno de cada painel segue a tabela da seção 6.2?

### 20.2 Checklist de Alinhamento

- [ ] Todos os textos na mesma coluna estão alinhados verticalmente?
- [ ] Ícones e labels têm exatamente xs (1 caractere) de espaçamento?
- [ ] Labels estão alinhados à esquerda dentro do widget?
- [ ] Números estão alinhados à direita?
- [ ] Badges de status estão centralizados?
- [ ] A hierarquia de indentação está correta (1 para subitens, 2 para sub-subitens)?
- [ ] Nomes de branch não excedem 25 caracteres sem truncamento?
- [ ] Nenhum texto está colidindo com bordas de painel?
- [ ] O caracter `…` está sendo usado para truncamento?

### 20.3 Checklist de Cores

- [ ] As 5 cores de interface (bg-primary, bg-secondary, bg-elevated, border-subtle, text-primary) estão consistentes em todos os painéis?
- [ ] Cores de estado (verde, vermelho, amarelo, azul) são usadas exclusivamente para seus significados definidos?
- [ ] Nenhuma informação depende exclusivamente de cor para ser transmitida?
- [ ] O contraste WCAG AA (4.5:1) é mantido em todas as combinações?
- [ ] O modo monocromático fallback está implementado?
- [ ] O estado offline usa vermelho em todos os lugares apropriados?
- [ ] O estado online usa verde em todos os lugares apropriados?

### 20.4 Checklist de Unicode

- [ ] Box-drawing está perfeitamente alinhado em todas as bordas?
- [ ] Cantos e junções (`┌┐└┘├┤┬┴┼`) formam ângulos perfeitos de 90° sem gaps?
- [ ] Nenhum emoji de largura 2 está desalinhado com texto adjacente?
- [ ] Símbolos reservados da seção 18.2 estão sendo usados apenas para seus propósitos definidos?
- [ ] O fallback Unicode está disponível para cada símbolo?
- [ ] Caracteres especiais (setas, bullets, checks) renderizam corretamente na fonte escolhida?

### 20.5 Checklist de Estados

- [ ] Estado Compacto tem ≤ 3 linhas?
- [ ] Estado Normal mostra Z0 + Z1 (parcial) + Z4?
- [ ] Estado Expandido mostra todas as zonas?
- [ ] Estado vazio mostra mensagem descritiva em texto terciário?
- [ ] Estado de erro mostra mensagem clara em vermelho com sugestão de ação?
- [ ] Estado de carregamento mostra indicador `⏳`?
- [ ] Fora do Git mostra indicador "—" no lugar da branch?
- [ ] Sem tarefas mostra "— Nenhuma tarefa pendente"?
- [ ] Git com conflitos mostra badge `⚠` em vermelho?
- [ ] Servidor offline mostra todas as métricas como "—" ou "❌"?

### 20.6 Checklist de Responsividade

- [ ] Em `xs` (< 80), o terminal força estado Compacto?
- [ ] Em `sm` (80-99), o painel lateral está colapsável?
- [ ] Em `md` (100-139), o painel lateral está visível (C1-2)?
- [ ] Em `lg` (140-179), widgets estão em 2-3 colunas?
- [ ] Em `xl` (≥ 180), o layout suporta painel expandido?
- [ ] Ao redimensionar para baixo, widgets são movidos/colapsados/escondidos em ordem?
- [ ] Nunca há distorção ou quebra de layout no redimensionamento?
- [ ] A largura mínima de 4 caracteres por coluna é respeitada?

---

## 21. Anti-padrões — O Que NÃO PODE Acontecer

### 21.1 Bordas e Box-Drawing

```
❌ BORDA TORTA (cantos não conectam)
┌────────────────┐
│ Widget         │
│ ┌──────────┐   │
│ │ Sub-box   │   │
│ └──────────┘   │
└────────────────┘

❌ BORDA QUEBRADA (gap entre caracteres)
┌───┬───┐
│ A │ B │
├───┼───┤    ← Falta ─ para conectar as bordas
│ C │ D │
└───┴───┘

❌ CAIXAS ANINHADAS DESALINHADAS
┌──────┐
│ Painel A
│ ┌──┐
│ │ B │    ← A torre de B não alinha com A
│ └──┘
└──────┘
```

**Regra:** Toda borda deve se conectar perfeitamente. Use os caracteres de junção corretos (├ ┤ ┬ ┴ ┼) para interseções. Nunca aninhe caixas box-drawing — prefira linhas de separação (`─`) ou espaçamento.

### 21.2 Alinhamento

```
❌ CABEÇALHOS DESALINHADOS COM CONTEÚDO
Tarefa         Status    Prazo
Refatorar UX  Andamento 20/01
  Bug #42     Revisão   22/01    ← Indentação quebra o grid
Adicionar testes Concluído 25/01  ← Espaçamento inconsistente

❌ VALORES NUMÉRICOS ALINHADOS À ESQUERDA
Tempo: 12s
Tempo: 120s     ← Alinhamento à direita preserva ordem de magnitude
Tempo: 1s
```

**Regra:** Colunas em listas devem ser rigidamente alinhadas. Números sempre à direita. Se um valor excede a largura da coluna, trunque, nunca expanda a coluna.

### 21.3 Cores

```
❌ INFORMAÇÃO TRANSMITIDA APENAS POR COR
[Sucesso] [Erro] [Alerta]   ← Correto: ícone + cor

❌ CONTRASTE INSUFICIENTE
Texto branco (#E0E0E0) sobre fundo amarelo (#FFC857)
→ Ratio 1.5:1, ilegível

❌ USO INCONSISTENTE DE CORES
• Online = verde (correto)
• Online = azul em outro widget (incorreto)

❌ CORES BRIGHT EM PLANO DE FUNDO
Usar #FF0000 puro para borda de erro
→ Prefira #FF5555 (vermelho suave) para reduzir fadiga visual
```

**Regra:** Cores têm significado fixo e imutável. Nunca reutilize uma cor para um significado diferente. Nunca use cores sem um ícone ou label acompanhando. Nunca use cores com ratio < 4.5:1.

### 21.4 Unicode

```
❌ MISTURA DE BOX-DRAWING COM CARACTERES COMUNS
│─ Tarefa 1  │  ← Hífen onde deveria ser — (emdash) ou │
└───────┴───────┘

❌ EMOJIS QUEBRANDO ALINHAMENTO
📋 Tarefas (3)    ← 2 células de largura
│ Tarefa 1        ← 1 célula de largura
→ A linha do emoji está 1 célula mais curta

❌ CARACTERES PROIBIDOS EM INTERFACE
Usar * para bullet em vez de ●
Usar > para seta em vez de → ou ►
Usar v para check em vez de ✓
```

**Regra:** Use sempre os símbolos definidos na seção 18.1. Nunca substitua símbolos de interface por caracteres ASCII comuns. Verifique a largura de cada caractere Unicode no terminal alvo.

### 21.5 Layout e Estrutura

```
❌ PAINEL SEM BORDA INFERIOR
┌──────────────────┐
│ Widget título    │
│ Conteúdo aqui    │
└──────────────────┘  ← Correto: toda caixa fecha

❌ ELEMENTO FLUTUANTE SEM CONTEXTO
        ⚠ Erro de conexão
→ Sem indicador de qual componente falhou

❌ LARGURA DE COLUNA MENOR QUE O CONTEÚDO
Nome  Status
│ Refatorar UX (truncado)
→ A coluna "Nome" tem apenas 6 caracteres, "Refatorar UX" tem 13

❌ INFORMAÇÃO DE NÍVEL 1 NA BARRA INFERIOR
Z4: ⚠ Servidor offline detectado!
→ Informação crítica deve estar em Z0 ou Z1, nunca em Z4
```

**Regra:** Barras de status inferiores são para informação passiva (Nível 3). Nunca coloque alertas ou erros críticos na Z4. Nunca permita que um elemento fique visualmente "solto" sem pertencer a um container.

### 21.6 Estados e Transições

```
❌ PAINEL VAZIO SEM MENSAGEM
┌──────────────────┐
│ 📋 Tarefas (0)   │
│                  │  ← Espaço em branco sem explicação
│                  │
└──────────────────┘

❌ TRANSIÇÃO BRUSCA DE LAYOUT
Ao mudar de Compacto → Expandido, o terminal "pula" 20 linhas
→ O usuário perde a referência visual de onde estava

❌ WIDGED COM DADOS DESATUALIZADOS
📋 Tarefas (3) → mostra 3 tarefas
→ Mas uma foi concluída há 5 minutos e não foi removida
```

**Regra:** Todo estado vazio precisa de mensagem. Toda transição de estado precisa preservar a continuidade visual. Dados devem ser atualizados em tempo real (ou com polling máximo de 5s).

### 21.7 Comportamentos Proibidos (Resumo)

| # | Comportamento | Consequência |
|---|---------------|--------------|
| 1 | Bordas box-drawing com gaps | Rejeitar na revisão |
| 2 | Caixas aninhadas (box in box) | Rejeitar na revisão |
| 3 | Informação transmitida só por cor | Rejeitar na revisão |
| 4 | Cores com contraste < 4.5:1 | Rejeitar na revisão |
| 5 | Unicode de largura 2 sem padding | Rejeitar na revisão |
| 6 | Números alinhados à esquerda | Rejeitar na revisão |
| 7 | Estado vazio sem mensagem | Rejeitar na revisão |
| 8 | Informação N1 na barra inferior | Rejeitar na revisão |
| 9 | Layout mudando sem reflow clean | Rejeitar na revisão |
| 10 | Widgets ocupando 5/7/8/9/10/11 cols | Rejeitar na revisão |
| 11 | Cabeçalhos desalinhados com colunas | Rejeitar na revisão |
| 12 | Mais de 3 níveis de indentação | Rejeitar na revisão |
| 13 | Uso de bordas arredondadas | Rejeitar na revisão |
| 14 | Símbolo ASCII onde deveria ser Unicode | Rejeitar na revisão |
| 15 | Símbolo Unicode sem fallback ASCII | Rejeitar na revisão |

---

## Apêndice A — Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **Zona** | Uma das 5 divisões verticais da interface (Z0-Z4) |
| **Grid de 12 colunas** | Sistema de layout horizontal que divide o terminal em 12 unidades iguais |
| **Gutter** | Espaço de exatamente 1 caractere entre colunas |
| **Widget** | Componente de interface que exibe informações dentro de um painel |
| **Card** | Unidade individual de conteúdo dentro de um widget (ex: uma tarefa) |
| **Painel lateral** | Zona à esquerda (C1-2) que contém widgets |
| **Dashboard** | Zona 1, acima do terminal, que contém widgets em grid |
| **Breakpoint** | Largura de terminal que dispara uma mudança de layout |
| **Reflow** | Reorganização instantânea do layout ao redimensionar |
| **Estado Compacto** | Modo de exibição mínima (≤ 3 linhas acima do prompt) |
| **Estado Normal** | Modo de exibição padrão (5-10 linhas acima do prompt) |
| **Estado Expandido** | Modo de exibição máxima (dashboard + painel + terminal + output) |
| **Box-drawing** | Conjunto de caracteres Unicode (U+2500–257F) para desenhar bordas em terminal |
| **Nerd Font** | Fonte monoespaçada com glifos extras para ícones e símbolos |

---

## Apêndice B — Histórico de Revisão

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-07-11 | Lead Software Architect + Lead UX Engineer | Documento inicial — especificação completa da interface |

---

> **Este documento é a fonte única de verdade para toda a interface do Thinker Terminal.**
> Qualquer implementação que desrespeite estas regras deve ser rejeitada em code review.
> Qualquer dúvida não coberta por este documento deve ser levada ao arquiteto antes da implementação.
