# Acabamento definitivo — verificação

Build: `2026-10-25.1`. Sem push. Trabalho anterior não relacionado foi preservado.

## O que foi confirmado no produto em execução

Dois processos Flask do mesmo checkout escutavam na porta 5050. A API recebia requisições na instância antiga, com estado/configuração diferentes da fonte atual. O header de versão sozinho não detectava essa divergência. A instância antiga e seu Komodo filho foram encerrados; foi mantida a instância da fonte atual, com verificações de módulo e persistência. Evidência: `after/duplicate-flask-before.json` e `after/live-server.json`. Isso confirma a causa da API obsoleta; não prova, por si só, a causa da ausência de setas no Chess.com autenticado.

O seletor de preferências usa o registry real, sem exigir heartbeat ou autorização de análise. A execução continua sujeita à autorização existente. `/getmove` continua usando Komodo; selecionar Stockfish na análise da Eval Bar não altera esse consumidor legado.

## Medições e tabelas

A investigação inicial está em [before/STAGE1.md](before/STAGE1.md). Ela inclui dependências dos controles, origem dos 8px adicionais, tamanhos de texto, paleta, diferenças entre interfaces e valores anteriores de `.myhigh`.

Matriz final: 68 estados, console em 1086/1280/1440/1920/1033/800 e Config em 1440/1280/1024/768/390, Bot e Smart Pacing ligados/desligados, Scout vazio/populado. Critérios automatizados: linhas de controles de 40px, centros de texto/controle sem desvio, nenhum controle fracionário, textos visíveis >=11px, caudas de 12px nos painéis fixos, bordas desktop alinhadas em 0px, coluna esquerda estável ao alternar Smart Pacing.

- [Alturas e caudas antes/depois, dois estados](after/panel-table.md)
- [Todas as linhas, centros e divisórias](after/control-rows.csv)
- [Todos os painéis e viewports](after/panel-heights-and-tails.csv)
- [Posições das quatro seções do Engine](after/engine-sections.csv)
- [Dados brutos](after/audit.json)

Em 1440px: Core 177px, Visuals 223px, Engine 412px; caudas 12px no estado padrão. Smart Pacing ligado mantém as três alturas e deixa a cauda aceita do Engine em 109px. Scout acompanha Auto Play, inclusive vazio; seu conteúdo dinâmico continua no topo. Na Config os cards têm altura natural: Core 175px, Visuals 240px, Workspace 112px, Engine 530px desligado / 379px ligado; todos terminam com padding de 12px. Não foi forçado espaçamento de 15px para preencher a coluna.

## Timing: decisão aplicada

A proposta anterior, em 1086px, media inputs 54/54px, Engine 391px e coluna esquerda 391px (natural 367px + 24px distribuídos). Segmented em linha própria produziria inputs 120/120px e Engine 431px, +40px; foi recusada e não aplicada. Compactar só gaps de 8 para 2px e separador de 11 para 3px produz 64/64px sem aumentar altura. Foi aplicada apenas no intervalo estreito; 1280px e acima preservam o Timing anterior. Após as quatro seções/linhas uniformes, a altura final do Engine é 412px; a coluna esquerda natural de 394px recebe 3×6px entre seções. O pixel restante das larguras é distribuído explicitamente pelos grids, inclusive em 800px.

## Cores e foco

Arrow Color mantém IDs `kb-color-picker`/`color` e storage `kb_color`. Default azul #3B82F6; verde legado migra uma única vez. Uma escolha deliberada de verde após a migração funciona e persiste. Customizados são preservados. O marcador de migração não substitui as chaves existentes.

`.myhigh` foi congelado no verde anteriormente salvo: borda `3px solid #10B981`, fundo `rgba(16,185,129,0.15)`, sombra `rgba(16,185,129,0.2) 0px 4px 12px`, opacidade 0.85 e raio 25%. Com Theme azul, antes, borda/fundo/sombra usavam #3B82F6; essa ligação foi removida conforme autorização.

A troca de swatch pelas duas interfaces comparou 140 componentes do console e 145 da Config: zero alterações de cor fora do swatch/setas. Setas conservam geometria, camada 11, `pointer-events:none` e opacidade 0.8. No Scout, apenas `of N` mudou de #777873 para o neutro autorizado #A0A19B. Paletas verdes de cada interface foram mantidas, incluindo sua diferença anterior. Os tokens de dimensão foram aproximados sem fundir as paletas independentes nem reescrever a arquitetura.

O diff bruto de cores de componentes está em `after/component-color-diff.json`: as diferenças são opacidade dos botões desabilitados para legibilidade e cinco amostras de Start que mudaram de disponibilidade entre capturas; não são novas cores de componentes. O teste específico de swatch mantém o estado fixo e exige zero diferenças.

Clique não produz aura; Tab usa borda neutra de 1px. As regressões adicionais verificam que foco não congela a borda do toggle no estado anterior nem suprime bordas reais de validação. Screenshots de mouse e teclado estão em `block-e/`.

## Testes executados

- Pipeline real `/getmove` com Komodo: 256 combinações de flags/lado/orientação, guarda de turno, DOM da seta, swatch e sincronização. [Evidência](block-a/pipeline/README.md)
- Registry real: quatro testes, Smallnet → Full → Komodo → Smallnet; NNUE/identidade, posições reais, cp/mate White-POV, cancelamento, recuperação, preferência e limpeza. [Benchmark](after/real-engine-benchmark.json)
- Session Control: 14 grupos passaram; Config backend: 7; cores/migração: 2; defaults: 4; entrega/versionamento: 2; Phase 09.1 Config: 3.
- Browser: Arrow Color nas duas superfícies e três orientações; Auto Play em 11 viewports; foco por mouse/teclado e erros reais de formulário; Scout integrado em seis viewports; auditoria final de 68 estados validada por `tests/validate_finish_audit.py`.
- Builds determinísticos de análise e Session Control e sintaxe do userscript verificados.

O teste antigo do registry esperava um arquivo antes de qualquer alteração de preferência. A preparação foi corrigida usando duas mudanças pela API real de preferências, antes de inicializar runtime. As verificações estritas de arquivo, reload e recuperação foram mantidas.

## Banner — Bloco I

Verificado em 1440×900: font-size 18.72px; texto 121.328125px / largura útil 144px = 84.26%. Já atende ao pedido; nenhuma alteração em texto, arte, posição ou responsividade. [Screenshot](block-i/banner-1440-900.png)

## Screenshots

Antes: `before/`. Depois: `after/`, com Bot/Smart Pacing/Scout identificados no nome, incluindo console 1440/1086/800 e Config 1440/1024/390. Setas locais: `block-a/pipeline/` e `block-b/`. Config no servidor de uso: `live/`.

- [Console 1440, Timing visível](after/console-1440-bot0-pacing0-scout1.png)
- [Console 1440, Smart Pacing ligado](after/console-1440-bot0-pacing1-scout1.png)
- [Console 1086](after/console-1086-bot0-pacing0-scout1.png)
- [Console empilhado](after/console-800-bot0-pacing0-scout1.png)
- [Config 1440](after/config-1440-bot0-pacing0.png)
- [Config 1024](after/config-1024-bot0-pacing0.png)
- [Config 390](after/config-390-bot0-pacing0.png)
- [Setas, brancas](block-a/pipeline/pipeline-white.png)
- [Setas, pretas](block-a/pipeline/pipeline-black.png)

## Copy e limites preservados

O aviso do Auto Play continua exatamente como solicitado, mesmo com 53/61 configurados: `Win-rate targets are not set by default. Configure both before starting. Win Rate is calculated from recorded results.` Ele está no `menuHtml` de `script.js`, elemento `#kb-session-target-help`, e em `frontend/external_config/index.html`, `#session-target-help`. A contradição foi reportada; texto/comportamento não foram ocultados nem reescritos.

Hints de Timing foram unificados com a única copy aprovada: `Enable Auto Moves to apply this timing.` Theme foi renomeado para Arrow Color. Nenhuma outra nova copy foi aplicada. Em 390px, quatro botões exigiriam ~119px para Export contra ~75px disponíveis; preservou-se a disposição móvel anterior, em duas colunas, sem truncar nem alterar texto. O rodapé de status mantém 2×2 conforme o pedido e passou sem overflow.

Toda a matriz automatizada usa Chromium local, sem autenticação no Chess.com. O pipeline real usa Flask e engines reais com adaptador de tabuleiro de teste; não move peças nem fabrica partidas. Ele não comprova cobertura das camadas da página autenticada ou a versão instalada no Tampermonkey. A verificação nativa autenticada permanece separada e será registrada conforme o acesso do navegador permitir.

## Commits e revisão

Blocos: A `450dbc5`, B `fc115d2`, C `2898896`, D `c8ba23f`, E `a3d0b4a`, F `27c11e3`, G `06a160c`, H `29b8aad`, I `c98c954`. O fechamento de QA reúne evidências finais, entrega da versão e correções dos casos encontrados na revisão.

Dois revisores independentes apontaram migração repetida de verde e foco congelando bordas; ambos foram corrigidos com regressões. A sugestão de voltar o status móvel para uma coluna foi rejeitada porque o pedido exige 2×2 e as medições de 390px passaram. Não se enfraqueceu a validação de persistência dos engines.

A troca pelas três opções também passou no servidor de uso em `127.0.0.1:5050`, por teclado, sem heartbeat do Chess.com: Full → Komodo → Smallnet, com reload entre opções. O status ficou Ready, não Active, a preferência original foi restaurada e nenhuma configuração/autoridade de análise mudou. Evidência: [live/preferences.json](live/preferences.json).

A instalação atual do Tampermonkey deve carregar `2026-10-25.1`, disponibilizada pelo endpoint `/thinker-chess.user.js`. A fonte anterior pode continuar na aba até a atualização/reload; um header atualizado não comprova qual userscript a aba executa.

## Benchmark real desta conferência

| Engine | Inicialização fria ms | Reuso aquecido ms | Primeiro resultado ms | Pico RSS amostrado MiB | CPU amostrada % | Cancelamento ms |
|---|---:|---:|---:|---:|---:|---:|
| stockfish-19-1mb | 584.0 | 2.74 | 2.5 | 215.6 | 297.7 | 1.7 |
| stockfish-19-94mb | 1246.3 | 2.80 | 2.9 | 614.0 | 294.6 | 1.8 |
| komodo-14.1 | 341.4 | 2.98 | 8.8 | 44.2 | 216.7 | 0.9 |

RSS é memória real do processo amostrada, não tamanho do arquivo NNUE. Os hashes completos e a confirmação `bufferLoaded: true` estão no benchmark. Houve fallback local de memória das réplicas de NNUE conforme o runtime informa; os testes confirmaram carregamento, avaliação e limpeza, não memória compartilhada indisponível no SO.

## Tentativa final de navegador autenticado

Computer Use encontrou as janelas Chrome, mas falhou ao ativar a janela alvo com `failed to activate captured window`. A seleção de janelas foi atualizada e houve uma única repetição, com o mesmo erro. Não foram usados DevTools, perfil ou cookies da sessão autenticada para contornar essa falha. A atualização/execução do Tampermonkey nessa aba permanece sem confirmação. A Config no servidor real e os testes Chromium isolados passaram; não são apresentados como validação autenticada.
