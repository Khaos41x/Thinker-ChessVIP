# APRENDIZADOS — Thinker Chess VIP

Registro de lições aprendidas durante a manutenção do projeto. Atualize este arquivo quando descobrir algo novo que vale registrar.

---

## 1. O Auto Queue "não carregava" — o problema nunca foi o código

### O sintoma
O módulo Auto Queue parou de puxar novas partidas. Depois de várias rodadas de correção na detecção (MutationObserver, seletores flexíveis, clique reforçado, polling ativo), o console ficava **mudo** — só aparecia o log de inicialização e nada mais. No fim das contas, **o script nem rodava no navegador**.

### A causa raiz
O userscript era atualizado **copiando/colando** do editor de texto (Notepad) direto no editor do Tampermonkey. Esse caminho corrompe o cabeçalho do userscript:

- O clipboard/editor pode injetar **BOM** ou espaços/linhas em branco **antes de `// ==UserScript==`**.
- Quando isso acontece, o Tampermonkey **não reconhece o arquivo como userscript** e o script não executa de forma silenciosa (zero erro no console).

### A lição (regra de ouro)
> **NUNCA atualizar o userscript por copy-paste. Sempre importar o arquivo diretamente.**

Fluxo correto no Tampermonkey:
1. Dashboard → aba **Utilities** (Utilidades).
2. Bloco **"Import from file"** → **Choose File** → selecionar o `script.js` do projeto.
3. Confirmar. O Tampermonkey lê os bytes do arquivo, preservando UTF-8 e o cabeçalho.

Isso resolveu de uma vez todos os "bugs" aparentes (banner, scout do oponente, auto queue): o código já estava correto, ele só nunca era executado.

---

## 2. VSCode/VSCodium mostrando número de linhas errado = encoding

### O sintoma
O arquivo tinha **2.671 linhas** (verificado por contagem bruta de bytes `0x0A`/LF), mas o VSCode exibia **2.479** linhas. A diferença: **192** quebras de linha "sumindo".

### A causa
O `script.js` é **UTF-8 sem BOM** e cheio de acentos/em-dash. O VSCode usa *auto-detect* de encoding e estava interpretando o arquivo como um encoding de byte duplo (ex.: GBK/Shift_JIS). Nesse modo errado, certos bytes "liderança" **engolem o `\n` seguinte**, então várias quebras de linha deixam de contar.

### A lição
Não é bug da IDE em si, é o auto-detect. Corrigir de forma permanente no `settings.json`:

```json
"files.encoding": "utf8",
"files.autoGuessEncoding": false
```

O `files.autoGuessEncoding: false` é o que importa — desliga a adivinhação e força UTF-8.

> Não "corrija" adicionando BOM ao arquivo: em um userscript, o BOM no início pode quebrar a detecção do cabeçalho `// ==UserScript==`.

### Contagem de linhas "à prova de IDE" (sem depender de editor)
```powershell
# contar quebras de linha reais (LF)
$([System.IO.File]::ReadAllBytes("script.js").Where({$_ -eq 0x0A}).Count)
# validar sintaxe
node --check script.js
```

---

## 3. Arquitetura do Auto Queue (detecção de fim de partida no Chess.com)

### Por que a detecção simples falhava
O Chess.com:
- **Não garante os seletores do modal** — classes e `data-cy` mudam com o tempo.
- Renderiza tabuleiro e controles em **web components com shadow DOM** (ex.: `<wc-board>`). Nós internos **não aparecem** em `document.querySelectorAll`.
- Pode montar o modal de fim de jogo em **overlay global no `<body>`**, fora do `#board-layout-main`.

### Solução em camadas (o que funciona)
1. **Busca global + shadow DOM**: varrer `document.documentElement` + todos os `shadowRoot` alcançáveis (BFS). Sem isso, o botão dentro do web component é invisível para o DOM.
2. **MutationObserver amplo**: observar o `<body>` inteiro (`childList + subtree`) **mais** todos os shadow roots. Com debounce (~200ms) para não reagir a cada mutação da animação do modal.
3. **Polling ativo (radar de força bruta)**: `setInterval` de ~1000ms que varre a página procurando o botão independente do observer. Se o botão existe e está visível (`width/height > 0`), clica **mesmo sem achar a div de game-over**.
4. **Seletores flexíveis**: lista de possíveis seletores (data-attributes, `aria-label`, classes, hrefs) + **fallback por texto** com normalização (`.toLowerCase()` + `.replace(/\s+/g, " ")` + `.trim()`) para casar "Nova\nPartida", "  JOGAR  ", etc., independente de idioma/caixa/espaços.
5. **Clique reforçado**: `dispatchEvent` de `mouseover → pointerdown → mousedown → pointerup → mouseup → click`, todos com `bubbles: true` e `cancelable: true` (o React/chess.com pode ignorar `.click()` simples). `target.click()` apenas como reforço final.

### Como manter o seletor do botão atualizado (inspetor)
1. Deixe uma partida terminar (modal de fim de jogo aberto).
2. `F12` → inspeção (`Ctrl+Shift+C`).
3. Clique no botão "Play"/"Jogar"/"Nova partida".
4. Procure `data-test-element`, `data-cy`, `aria-label`, `data-control-view`, `href` ou classes.
5. Se o botão estiver **dentro de um web component**, o DevTools mostra a árvore do shadow DOM — copie o atributo de lá.
6. Adicione o seletor novo na lista `NEW_GAME_SELECTORS` do `script.js`.

### Guarda anti-falso-positivo
Como a busca é global, filtrar elementos dentro de `nav`/`[class*='menu']` para não clicar no "Play"/"Jogar" do menu superior durante a partida.

---

## 4. Logs de depuração

Todos os pontos críticos do Auto Queue logam com o prefixo `[TC AutoQueue]`, incluindo a **origem** da detecção (`[observer]` ou `[polling]`):
- Ativação do `MutationObserver` (e quantos shadow roots).
- Início do polling.
- Confirmação do fim de partida (logado uma vez por episódio para não inundar o console).
- Qual seletor/texto/fallback localizou o botão.
- Agendamento e execução do clique.

Para depurar: abrir o DevTools (`F12`), filtrar o console por `TC AutoQueue` e ver em qual etapa o fluxo para.

---

## 5. Checklist rápido de diagnóstico (userscript "não roda")

1. **`node --check script.js`** — se der erro de sintaxe, não é problema de navegador.
2. No console do navegador: `typeof window.krypbotUpdateUI`.
   - `undefined` ou ausência de log `[TC AutoQueue]` = o script **nem roda** → problema de instalação/encoding (ver seção 1).
3. Confirmar que o servidor local está ligado: `python app.py` (porta `5050`).
4. **Sempre** atualizar via **Import from file**, nunca copy-paste.