# Recuperação das setas de recomendação — 2026-10-26

## Checkpoint solicitado

Antes da correção, as 14 alterações de código/testes/asset já rastreadas foram preservadas no commit `9709e22` e enviadas para `origin/master`. O push confirmou `b9624eb..9709e22 master -> master`. Bancos, tokens, engines, NNUE, pastas privadas de baseline e artefatos temporários ficaram fora desse checkpoint. As alterações preexistentes de autorização da Eval Bar foram preservadas no checkpoint; esta correção não as modifica.

## Falha reproduzida

Na primeira leitura do servidor real, `/config/load` informou `hint:true`, `autoMove:false`, `ghostMode:true`, revisão 4. A regra `html.tc-clean-view :is(..., .myarrow, .myhigh) { display:none !important; }` oculta intencionalmente as setas nesse modo. Na leitura imediatamente anterior ao salvamento revisionado, a configuração já estava em revisão 7 com `ghostMode:false`; o salvamento confirmou o estado desligado e não alterou nenhuma preferência (`changedKeys:[]`). Não se atribui essa transição à correção. O comportamento de Clean View continua intacto.

O status real confirmou uma aba conectada e sincronizada, porém executando `2026-10-26.2`, enquanto o servidor passou a entregar `2026-10-26.3`. Evidência: [live-config.json](live-config.json). Portanto o código corrigido ainda não estava confirmado como instalado na extensão real.

O caminho real `/getmove` retornou HTTP 200 e `e2e4` pelo Komodo 14.1. Depois de remover o SVG mantendo o FEN, o diagnóstico permaneceu `recommendation`, mas `arrow` passou a `null`. O intervalo de recomendações continuava chamando `request_move`, que saía imediatamente em `if (fen === checkfen) return` e não recuperava o desenho.

Essa condição também impedia desenhar no novo tabuleiro após substituir o elemento mantendo o FEN. Inverter a orientação sem mudar o FEN mantinha a geometria anterior. A condição de deduplicação existe desde `b79d95f`; a investigação não demonstrou que um commit recente do seletor causou a reclamação específica no navegador do usuário.

`node tests/test_recommendation_pipeline_chrome.js --baseline` usa o código do checkpoint `9709e22`, sem modificar a árvore de trabalho. Falhou com:

```
AssertionError: A valid recommendation must survive overlay removal or board replacement at unchanged FEN
actual: null
expected: true
```

Evidência original: [before/recovery-false.json](before/recovery-false.json).

## Correção pontual

O renderer conserva somente a última recomendação desenhada e sua correlação de FEN, modo, rota, tabuleiro e orientação. No caminho de FEN repetido, recupera o SVG se ele sumiu, se o tabuleiro mudou ou se a orientação mudou. Reutiliza o lance recebido; não inicia outra busca nem recria uma seta saudável a cada tick.

Os controles de Bot, Auto Moves, identidade, turno e correlação continuam valendo. Não há mudança de motor, configuração, geometria, camada, cor, opacidade, banner, layout ou texto da interface. `/getmove` continua usando Komodo; o seletor de Analysis Engine continua servindo a análise da Eval Bar. A parte legada manuscrita de `script.js` contém o renderer e `request_move`; os blocos gerados foram regenerados pelo build existente. Versão entregue: `2026-10-26.3`.

## Verificação

| Verificação | Resultado |
|---|---|
| Regressão no checkpoint | Falha por seta ausente após remoção do SVG |
| Pipeline com Flask e Komodo reais | 256 combinações de flags/lado/orientação aprovadas |
| Remoção do SVG e troca do tabuleiro | Seta recuperada; uma única requisição por posição |
| Inversão da orientação sem mudar o FEN | Geometria atualizada sem nova requisição |
| Dez ticks com seta saudável | Mesmo elemento SVG preservado |
| Bot desligado, Auto Moves, turno do adversário, outra rota | Nenhuma recuperação indevida |
| Testes de autoridade | 64 casos aprovados |
| Recuperação de requests | Oito falhas, backoff, cache, stale guards, V2 e puzzles aprovados |
| Geometria em Chromium | 12 combinações de tamanho/DPR/orientação aprovadas; clique e arraste atravessam SVG |
| Cor pelo console e External Config | Aprovada; opacidade 0.8 mantida |
| Clean View pelo serviço de preferências e userscript completo | Ligado oculta a seta; desligado revela a mesma seta |
| Cores de outros componentes | Zero diferenças em 141 componentes do console e 146 da Config |
| Entrega do userscript | Dois testes aprovados |
| Builds determinísticos e sintaxe JS | Aprovados |
| Servidor existente em 5050 | `/health`: `status:ok`, `ready:true`; metadata entrega `2026-10-26.3` |

Comandos: `node tests/test_recommendation_pipeline_chrome.js`, `node tests/browser/test_arrow_color_sync.mjs --connectivity`, `node tests/test_move_authority.js`, `node tests/test_move_recovery.js`, `node tests/test_recommendation_arrows.js`, `node tests/test_recommendation_arrows_chrome.js`, `python tests/test_userscript_delivery.py`, `python scripts/build_analysis_engine.py --check`, `python scripts/build_userscript.py --check`, `node --check script.js`.

## Screenshots e escopo

- [Seta branca — pipeline real/local](after/pipeline-white.png)
- [Seta preta — pipeline real/local](after/pipeline-black.png)
- [Detalhe da geometria a 300%](geometry/tip-and-junction-300.png)
- [Resultados completos](after/report.json)

Os testes usam Chromium isolado, adaptador de jogo sintético e o caminho real Flask/Komodo. O teste de cor também executa o userscript completo com a Config local. Não houve manipulação de partida real.

**Não foi possível validar a reclamação no Chess.com autenticado com Tampermonkey.** A ferramenta de Computer Use bloqueou a inspeção do Chrome porque não conseguiu identificar a URL atual com segurança. A falha de recuperação descrita foi comprovada e corrigida; não se afirma que ela seja a única causa possível na aba real, nem que a extensão instalada tenha recebido automaticamente a nova versão. Nenhuma barreira foi contornada.
