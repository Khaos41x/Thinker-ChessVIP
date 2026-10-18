# Fix Spec — Auto Adjust Rating no TC172

## Objetivo

Quando `Auto Rating` estiver habilitado no fluxo legado de `/getmove`, resolver o rating do oponente no DOM atual do Chess.com e enviar `opponentRating + 100` como `elo`, preservando integralmente a interface TC172.

## Diagnóstico confirmado

1. `AutoAdjustRating.setOpponentRating()` aplica `+200`, enquanto o requisito atual é `+100`.
2. `getOpponentRating()` consulta `.player-component`, `.board-layout-player`, `.user-tagline-component`, `.user-tagline` e o seletor genérico `[class*='player']` em todo o documento.
3. A escolha do oponente usa a metade superior da viewport. Ela não está vinculada ao tabuleiro nem ao elemento do oponente já resolvido pelo Scout.
4. A atualização ocorre apenas 500 ms depois de `OpponentIntel.checkOpponent()` detectar um username diferente. Se o rating ainda não tiver sido renderizado, não há nova tentativa específica para atualizar o Elo.
5. O payload de `/getmove` já envia `currentElo`. Portanto, a falha está antes dele: `autoAdjust.getCurrentDifficulty()` permanece no Elo base quando o scraping não atualiza o estado.

## Alterações permitidas em `script.js`

### 1. Política explícita de delta

- Adicionar `AUTO_ADJUST_OPPONENT_DELTA = 100` junto às constantes existentes.
- Substituir o literal `200` em `setOpponentRating()` pela constante.
- Manter saturação em `AUTO_ADJUST_MAX_ELO` e acrescentar saturação inferior em `AUTO_ADJUST_MIN_ELO`.

### 2. Parsing puro e validado

- Extrair uma função pura para converter texto ou atributo em rating.
- Aceitar apenas inteiros dentro do envelope configurado.
- Priorizar valores associados semanticamente a rating, incluindo texto entre parênteses.
- Rejeitar relógios, percentuais, IDs e números fora do envelope.

### 3. Resolução do elemento do oponente

Ordem determinística:

1. Reutilizar `OpponentIntel.getOpponentElement()`, que já resolve o jogador superior pelo layout do tabuleiro e exclui navegação, chat, sidebar e painéis próprios.
2. Subir desse nó até o contêiner do jogador por seletores específicos de top player.
3. Consultar descendentes de rating por atributos estáveis (`data-cy`, `data-testid`, `data-test-element`) e classes contendo `rating`.
4. Como fallback, analisar apenas o texto do contêiner de jogador associado ao tabuleiro.
5. Se nenhum rating válido existir, retornar `null`; não pesquisar globalmente com `[class*='player']`.

### 4. Atualização antes do cálculo do payload

- Criar uma rotina idempotente `refreshAutoAdjustOpponentRating()`.
- Chamá-la quando o toggle for habilitado.
- Chamá-la quando o Scout detectar ou trocar o oponente.
- Chamá-la imediatamente antes do cálculo de `legacyElo` em `runGame()`.
- Quando houver rating válido, atualizar `AutoAdjustRating` antes de calcular `currentElo`, a chave de cache e o payload.
- Quando não houver rating, manter o Elo base do slider para evitar reutilizar rating obsoleto de outra partida.

### 5. Payload preservado

O formato continuará:

```js
{
  fen,
  elo: currentElo,
  time: chessBot.time,
}
```

Com `Auto Rating` efetivo:

```text
currentElo = clamp(opponentRating + 100, 800, 3200)
```

Com o toggle desligado ou sem rating válido:

```text
currentElo = chessBot.elo
```

O mecanismo de Session Control continuará com a precedência atual por meio de `isLegacyAutoAdjustEffective()` e `sessionControlBridge.moveSelectionElo()`.

## Proibições e invariantes

Não alterar:

- blocos CSS;
- `menuHtml`;
- HTML dos painéis;
- seletores usados exclusivamente para montagem visual;
- `createMenu()` ou topologia de injeção;
- `position`, `z-index`, `isolation`, `display` ou `pointer-events`;
- IDs, classes ou estrutura do Thinker Panel e Scout;
- formato do payload ou endpoint `/getmove`.

## Testes herméticos

1. Elemento top player com rating entre parênteses produz `rating + 100`.
2. Rating exposto por `data-cy`, `data-testid` ou classe com `rating` é reconhecido.
3. Relógio `1:00`, números do username e elementos fora do contêiner do tabuleiro são ignorados.
4. Rating `3150` satura em `3200`.
5. Toggle desligado mantém o Elo do slider.
6. Toggle ligado com rating indisponível usa o Elo base, sem valor persistido de outra partida.
7. O request capturado para `/getmove` contém o Elo ajustado.
8. Uma verificação estática confirma que nenhum bloco de CSS, `menuHtml` ou rotina de montagem mudou.

## Critérios de aceite

- Oponente 2000 resulta em `elo: 2100` no `/getmove`.
- Alteração de oponente atualiza o Elo antes da próxima requisição.
- O slider permanece como fallback operacional.
- Nenhuma diferença visual ou estrutural na UI.
- Testes JavaScript executados sem rede e sem browser externo.
