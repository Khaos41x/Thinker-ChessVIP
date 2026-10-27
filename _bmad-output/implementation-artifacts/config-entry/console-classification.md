# Classificação do console

As mensagens abaixo vêm da captura fornecida pelo usuário. A execução automatizada separada está em `quiet/console-report.json`. O fixture não carrega anúncios, extensões de terceiros ou os bundles fechados do Chess.com; não se apresenta essa execução como uma captura autenticada do site.

| Mensagem / recurso | Nível observado | Origem na captura | Classificação | Evidência e limite |
|---|---|---|---|---|
| `Version: 2026.10.8 / 1.189.0` | log | `browser.B1rLLymbcR.js:506` | Chess.com | Bundle do site; não corresponde à versão nem ao arquivo do userscript |
| `Raven v1.25.2-sydwjj` | log | Mesmo bundle `browser…js` | Chess.com | Saída do bundle do site; não existe logger Raven no produto |
| `The AudioContext was not allowed to start` | warning | `shared…chunk.js`, `client…chunk.js` | Chess.com | Inicialização de áudio do site; não é erro emitido pelo logger do Thinker Chess |
| `Could not find a View Model linked to Artboard confetti_v2` | error | `browser…js:506` | Chess.com | Artboard de confete do bundle do site; o produto não usa esse artboard |
| `[GPT] Slot.setTargeting is deprecated` | warning | `browser…js:506` | Anúncio integrado ao site | API de publicidade; não é uma chamada do userscript |
| `canModifyExistingMovesOnMainLine is not an editable option in this mode` | warning | `browser…js:506` | Chess.com | Opção do editor/tabuleiro nativo; não é usada no código do produto |
| `Element Cloner content script loaded` | log | `injector-main.js:947` | Extensão de terceiros | Mensagem explícita de content script; não pertence ao userscript entregue nem aos módulos do produto. O ID/nome da extensão não é legível na captura |
| `injector-main.js` | origem de mensagem | Arquivo indicado pelo F12 | Extensão de terceiros | É a origem de `Element Cloner`; o produto não fornece esse arquivo |
| `CEE wasm load: source=streaming…` | log | `browser…js:506` | Chess.com | Loader do bundle nativo; os motores WASM locais do produto executam no sidecar Node, sem esse logger na página |
| `Mixed Content` com `ssum-sec.casalemedia.com/usermatch` e `rtb2-useast.delivrdsp.ai/sync` | warning | Documento de sincronização publicitária, URLs explícitas | Anúncio | A cadeia é de sincronização publicitária externa; não é a conexão HTTP de loopback do produto |
| `ERR_CONNECTION_RESET` em `…c-sync.smartadserver…` | error de rede | URL do recurso publicitário | Anúncio | Host publicitário explícito na captura; nenhuma alteração feita nesse tráfego |
| `Failed to load resource … 451`, `711890.gif` | error de rede | Somente o nome do GIF aparece | **Fornecedor/categoria exata indeterminados** | O produto não solicita esse GIF. A captura não mostra o domínio nem o iniciador; sem inspeção do perfil real não é possível distinguir com segurança Chess.com de anúncio. Não foi inventada uma atribuição |

Não foi sobrescrito `console`, `window.onerror` ou um handler global de rejeições. Nenhuma mensagem foi escondida no produto, nem se introduziu bloqueio de rede de terceiros. A função preexistente `removeAds` também não foi alterada nesta tarefa.

## Mensagens nossas

- `debug()` já é condicionado a `const DEBUG = false`.
- `log()` usa esse helper; o prefixo histórico foi atualizado para `[Thinker Chess]` no item 3.
- `reportEvalBarDiagnostic()` só escreve com `evalBarV2Diagnostics` explicitamente ativado; o padrão continua desligado. Não foi apagada uma preferência deliberada de diagnóstico.
- As falhas esperadas de conexão de Config/registry são guardadas como estado e não geram logs de produção. Após a perda de conexão, os dois leitores de `/config/load` e a atualização de registry pausam; Retry ou ação de usuário reativa a sincronização. A cadência saudável, a autorização, os timers de recomendação e os de Auto Play não foram modificados.

## Evidência automatizada

`node tests/browser/test_console_quiet.mjs` executa o userscript completo em Chromium isolado com Flask real, desligado e reiniciado durante o teste. A ponte CDP encaminha o GM fora da página, reproduzindo a separação do transporte de extensão sem esconder console ou erros globais.

Estados: sem userscript, Ready, Bot ligado/desligado com confirmação do radio aceito, Smart Pacing ligado/desligado, troca de Arrow Color, servidor desligado, Error, pausa de consultas, Retry/reconexão e reload. O teste captura `Runtime.consoleAPICalled`, `Log.entryAdded`, `Runtime.exceptionThrown` e `Network.loadingFailed`, e verifica as origens.

Resultado final: zero mensagens do produto, zero exceções não tratadas e zero erros de rede na página. Mensagens de terceiros carregadas no fixture: nenhuma. Isso não afirma que os anúncios do Chess.com ou outra extensão ficarão silenciosos.

Não foi obtido screenshot do F12 autenticado. Os dados completos capturados pelo protocolo estão em `quiet/console-report.json`; `quiet/error.png` mostra a UI no estado Error.
