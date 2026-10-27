# Thinker Chess — atalhos, status e console

## Entrega

1. `7442e96`: link externo acessível no título de Core, sem mudança de geometria.
2. `bb50558`: linha da Config após a prontidão real do socket.
3. `d772b0c`: raiz Thinker Chess com negociação HTML/texto e a arte existente.
4. Commit deste relatório: pausa de sincronização enquanto o servidor está inacessível, retomada e regressões finais de console.

Não houve push nesta tarefa. O servidor real foi reiniciado de forma controlada quando Bot/Auto Moves/Auto Queue estavam desligados, sessão `IDLE` e nenhuma análise estava rodando. Responde em `127.0.0.1:5050`: `/`, `/config` e `/health` passaram; entrega do userscript `2026-10-26.4`. As preferências não foram alteradas por esse reinício. O terminal anterior não foi fechado pela automação; apenas o processo `app.py` que possuía o socket e seu Komodo filho foram encerrados, e o app atualizado foi iniciado oculto. Os logs privados não foram incluídos nos commits.

## Item 0 — inventário anterior à implementação

[`brand-inventory.json`](brand-inventory.json) contém cada ocorrência textual de `kryp`/`v2.2`, com arquivo, linha e contexto: **10.943 ocorrências em 113 arquivos**, incluindo cópias históricas de baselines, fontes, testes, documentação e logs textuais. Não foram pesquisados objetos `.git`, dependências `node_modules`, bytecode ou binários de engine. [`brand-paths.json`](brand-paths.json) registra os caminhos encontrados: nenhum nome de arquivo/pasta relativo ao projeto correspondeu ao padrão.

Ocorrências relevantes ao produto em execução:

| Local anterior | Conteúdo / uso | Tratamento |
|---|---|---|
| `app.py:2` | Comentário `KRYPBOT LOCAL ENGINE SERVER - v2.2` | Preservado: comentário técnico |
| `app.py:206` | Banner `Thinker Chess VIP v2.2` | Preservado, conforme instrução explícita |
| `app.py:887–889` | `/` devolvia `KrypBot v2.2 ONLINE` | Página HTML nova e texto simples de compatibilidade |
| `script.js`, logger e erros de Eval | Prefixo `[KrypBot]` | Atualizado para `[Thinker Chess]`, mantendo os guards de debug |
| `tests/test_server.py:301` | Comparação literal antiga `KrypBot v2.1 (Komodo) ONLINE` | Atualizada para status 200 e `Thinker Chess ONLINE` |
| `tests/speed.py`, `speed_test.py`, `server_speed.py` | Texto de raiz das aplicações experimentais `KrypBot SPEED…` | Somente a marca foi substituída |
| IDs, seletores e globals `krypbot…` | Contratos internos entre módulos e testes | Preservados |
| `TC157.user.js`, docs e baselines | Fonte histórica e referências de sessões anteriores | Inventariados, sem migração ou reescrita histórica |

Metadados em uso: `@name TC172`, `@namespace http://tampermonkey.net/`, `@description Chess Bot com Servidor Local`. Nenhum deles contém KrypBot e não foram renomeados. A versão anterior à tarefa era `2026-10-26.3`, não `2026-10-24.x`; a final é `.4`. O banner de terminal usa uma versão histórica separada, `v2.2`, e o qualificador VIP; não foi alterado.

### Consumidores de `/`

- O userscript e a External Config não dependem do corpo da raiz: usam APIs específicas.
- `tests/test_server.py` era o consumidor com comparação literal do corpo de `/`; foi atualizado no mesmo commit da rota.
- `tests/test_recommendation_pipeline_chrome.js` usa a raiz do seu próprio fixture (`recommendation_pipeline_fixture.py`), verifica `.ok` e usa o documento vazio como host; não depende da marca do app.
- Os testes novos de status verificam HTML, texto, status 200 e `Vary: Accept`. Os experimentos de speed têm aplicações próprias, sem dependência do corpo da raiz de produção.
- Não foi encontrado outro consumidor de produção procurando `KrypBot`/`ONLINE` na resposta da raiz. Clientes que procuravam apenas `ONLINE` continuam recebendo a palavra na resposta de texto.

### Transporte e status existentes

O URL base continua sendo a única constante `SERVER_URL`. As chamadas privilegiadas usam `GM_xmlhttpRequest`; o fetch do módulo de dados públicos é separado. Grants preservados: `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `unsafeWindow`. Connect preservados: `localhost`, `127.0.0.1`, `api.chess.com`. Não há `GM_openInTab`, e não foi acrescentado grant.

Status existentes: `/health` (JSON de saúde/Komodo), `/metrics`, `/config/status` (conexão/sincronização da UI), `/config/engines` (registry para preferências), `/eval-bar/engines` e `/eval-bar/status` (interfaces de análise com os guards existentes). Nenhum contrato de autorização ou endpoint de engine foi alterado. Não foi criada uma segunda autoridade de configuração.

## Item 1 — atalho

O SVG de 16×16 usa `currentColor`, traço 1.5 e área de link 24×24. O link deriva de `SERVER_URL + '/config'`, com `_blank`, `noopener noreferrer`, `title` e `aria-label` autorizados. Usa flex no título, sem posicionamento absoluto. O título mantém 25px externos: linha de texto 16px, espaçamento e divisória existentes. O SVG fica centrado nessa linha; a área clicável aproveita o padding sem reflow.

Repouso usa `--tc-console-muted`; hover/foco usa `--tc-console-text`. A borda de foco neutra é a regra atual do console. A margem interna de −1px do SVG compensa o espaço reservado da borda para manter a borda direita alinhada: **link = SVG = toggle, diferença 0px**. Não há sombra, fundo ou cor nova.

Teste real de novas abas em Chromium: Enter, Espaço, clique normal, clique do meio e Ctrl+clique abriram `/config`. Tab alcança o link. Não há preflight nem condicionamento ao estado do servidor: o link pode abrir a aba mesmo indisponível, usando o erro nativo do navegador. O cenário específico de desligar o servidor real em 5050 para clicar no link não foi repetido; não se interrompeu novamente o app saudável para esse teste.

No console minimizado de 154px, o Core e seu atalho ficam ocultos, como os outros controles. Não foi criado um segundo atalho fora do painel. Uma indicação opcional de disponibilidade poderia reaproveitar os estados existentes `Ready`/`Error`; não foi acrescentada.

Screenshots: [1440](after/console-1440.png), [1086](after/console-1086.png), [800](after/console-800.png), [repouso 300%](after/shortcut-rest-300.png), [hover 300%](after/shortcut-hover-300.png), [Tab 300%](after/shortcut-keyboard-300.png). Antes: os mesmos nomes em `before/`.

## Item 2 — terminal

`serve_local` já cria o socket e verifica o bind antes de chamar `ready`. O callback mantém `Rodando…` e imprime a linha seguinte com o mesmo `Log.success`, usando `bound_port` real. O host permanece o mesmo bind explícito `127.0.0.1`. Nenhum outro texto do banner ou tratamento de token foi alterado.

`python tests/test_server_startup.py`: **3 testes aprovados**, incluindo porta efêmera, verificação do socket ao ler a prontidão, URL Config com a mesma porta, colisão sem falsa prontidão e reinício. [`item2-startup.json`](item2-startup.json) contém evidência com capability de fixture redigida.

No app real atualizado, [`live-server.json`](live-server.json) registra as duas linhas públicas, sem token, e HTTP 200 de raiz/Config/health.

## Item 3 — página raiz

HTML contém somente o cavalo, `Thinker Chess`, ponto + `Online`, e `Open External Config`. Reutiliza `/config/assets/panel.css`, seus tokens e o botão `.compact-button`. O título usa o texto `#DEDED9`; o painel e a borda usam os tokens `#252523`/`#3A3A36`. A largura máxima tem token próprio de 360px; margens e gaps derivam de `--space`.

O WebP é **o mesmo `assets/banner-horse.webp`**, nativo 140×280 e exibido em 70×140 CSS px: DPR 2 não amplia além do original. Nenhum arquivo de arte, banner ou regra responsiva do banner foi modificado. Sem JS ou fontes externas na raiz.

Negociação: Accept explicitamente HTML → página HTML 200; sem HTML, inclusive `*/*` → `text/plain` com `Thinker Chess ONLINE`, 200. Cabeçalho `Vary: Accept`. O consumidor literal de teste foi migrado. IDs/storage/globals não foram renomeados.

`python tests/test_status_page.py`: **3 testes aprovados**. Chromium: **8 combinações** (390/768/1440/2560 × DPR 1/2), centralização e retângulos inteiros, sem overflow nem requisição externa. [390](root/status-390-dpr1.png), [1440](root/status-1440-dpr1.png), [2560](root/status-2560-dpr1.png), [DPR 2](root/status-1440-dpr2.png), [dados](root/report.json).

## Item 4 — console e desconexão

Classificação completa das mensagens solicitadas: [`console-classification.md`](console-classification.md). A maioria pertence aos bundles do site, publicidade e outra extensão. O fornecedor exato do GIF 451 permanece não verificável pela captura: não se atribuiu um domínio que não aparece nela.

Não se sobrescreveu console, onerror ou handlers globais. Os guards de debug existentes continuam desligados por padrão. Correção funcional: Config tem dois leitores (`pollExternalConfig` e a ponte de sessão); ambos deixam de consultar enquanto o estado é offline. Atualizações de registry também param em erro. Retry ou uma ação no console reativa a sincronização, preservando drafts pendentes. O intervalo de 1s da ponte quando saudável, o de 2s da Config, a autorização, a cadeia de recomendação e os intervalos de Auto Play permanecem iguais. A perda de conexão passa a projetar `Error` com a copy já existente, em vez de deixar `Ready` antigo.

`node tests/browser/test_console_quiet.mjs`: **aprovado** em todos os estados pedidos, com confirmação dos toggles. Flask real desligado/reiniciado e GM relayed fora da página. Zero mensagens nossas/exceções; consultas Config/registry não aumentam durante a pausa; Retry volta a Ready; reload aprovado. [Dados por origem](quiet/console-report.json), [UI Error](quiet/error.png). Nenhuma mensagem de terceiros é filtrada no produto.

### Fresta no modo empilhado

O wrapper é anexado ao `body`, `position:absolute`, `z-index:2147483647`, fundo transparente, `pointer-events:none`; filhos aceitam ponteiro. O cálculo usa o maior bottom de board/sidebar, a altura do viewport e o gap existente (112px empilhado), seguido pelo inset de 12px. A lista nativa de movimentos que se estenda além desses contêineres não entra nesse limite. Os gaps transparentes podem revelar esse conteúdo — mecanismo compatível com o `0.7s` da captura.

[`overlap/report.json`](overlap/report.json) mede os retângulos e [`stacked-gap.png`](overlap/stacked-gap.png) demonstra o mecanismo com um timer **sintético explicitamente colocado atrás do gap**. Não é uma medição da lista autenticada de movimentos, das abas ou do timer real do Chess.com. Não se alterou o layout: incluir o bottom da área nativa de Moves/Chat/Info/Openings mudaria o posicionamento aprovado; tornar o gap opaco mudaria o fundo. Essas opções dependem de autorização específica.

## Verificação final

[`geometry.csv`](geometry.csv): coordenadas, larguras, alturas e títulos antes/depois de cada painel, nos 6 viewports e Smart Pacing On/Off. [`panel-table.md`](panel-table.md) resume as dimensões, idênticas antes/depois. [`validation.json`](validation.json):

- 12 estados, todos os painéis e títulos iguais aos anteriores.
- Desktop: Visuals−Engine = 0px e Scout−Auto Play = 0px nos oito estados.
- Gaps 12px, dimensões/posições inteiras e nenhum overflow do console.
- Nenhum texto visível abaixo de 11px; labels de toggle com fonte 0 (sem glyph) são intencionalmente ocultos e não contados como texto visível.
- Cores computadas de todos os componentes existentes idênticas; o novo link é excluído da comparação por não existir antes.
- Raiz: documento sem overflow nos oito estados medidos. O fixture mantém uma geometria de site de largura fixa; não se usa seu overflow de host como afirmação sobre o Chess.com real.

Demais regressões aprovadas: 14 suites em `tests/session_control`, `test_phase091_session.js`, `test_analysis_engine_selection.js`, 2 testes de entrega de userscript e builds determinísticos. A cadeia real de recomendações passou em **256 cenários com Komodo e Flask reais**, incluindo recuperação, guardas de turno/rota e cor. Nenhuma alteração foi feita no renderer das setas nesta tarefa.

Diffs de implementação: [item 1](item-1.diff), [item 2](item-2.diff), [item 3](item-3.diff), [item 4](item-4.diff). Os arquivos de medição contêm os resultados brutos.

## Limites e decisões preservadas

Testes de interface: **Chromium isolado**, com fontes reais, Flask/registry e motores reais onde indicado. Não foi executado o fluxo no perfil autenticado com Tampermonkey, nem capturado F12 nativo desse perfil. A evidência por origem vem do protocolo do navegador local; as mensagens do print foram classificadas com os limites acima. O último status de entrega registra `.4` disponível no servidor, sem heartbeat autenticado confirmado naquele instante; não se afirma que a extensão real foi atualizada automaticamente.

Permanecem para decisão: nome/versão do banner `Thinker Chess VIP v2.2`, metadado `TC172`, migração de identificadores internos históricos, conteúdo extra na raiz, indicador extra no atalho e mudança de posicionamento no modo empilhado. Nada disso foi aplicado. A classificação exata do GIF 451 e a inspeção dos retângulos nativos dependem de acesso ao navegador real, indisponível nesta execução. Não se pede execução manual de comandos.
