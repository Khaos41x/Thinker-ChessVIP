# Thinker Chess — status, F12 e menu de engines

Implementação em três blocos, com fontes e builds determinísticos. Versão servida: **2026-10-26.6**. Nenhuma alteração na autorização de análise, recomendação, Auto Play, banner, setas, artwork, storage ou página raiz. Sem push.

## Resultado verificado

- Status estável: em90s, zero mutações nos indicadores depois de estabilizados, zero recriação, CLS0 nas duas superfícies. Falha isolada preserva o estado; perda confirmada e primeiro sucesso causam transições estáticas.
- F12: zero console.log/info/debug/warn/error de produção, zero exceções e zero Issues no perfil isolado. O transporte GM reproduzido fora da página não gera erros de rede na página. Fetch da Config ainda pode produzir mensagens de conexão recusada do próprio navegador, reduzidas pelo backoff, sem mascaramento.
- Menu: listbox compartilhado, fundo dos inputs, borda/raio existentes, opções32px, padding12px, gap4px, destaque neutro e check SVG. Original select/ID/valor/change continuam sendo a fonte de verdade. Nenhum painel muda ao abrir.
- Servidor real: `/config`200, `/health`ready, versão `.6`, os três engines instalados no registro. [Resultado sanitizado](live.json). A consulta não inicializa análise nem amplia permissões.

## Causa raiz e medições

Config executava textContent e atributos com os mesmos valores a cada ciclo. Seu refresh de registro projetava Initializing mesmo com erro conhecido, depois voltava ao erro, repetidamente. Console também reescrevia o mesmo texto e interrompia definitivamente a recuperação após a primeira falha. As consultas de configuração e registro podiam bloquear uma à outra. Não foi encontrada uma keyframe específica de shake: havia alternância de estados e transições genéricas.

| Janela90s | Config antes → depois | Console antes → depois |
|---|---:|---:|
| Callbacks de mutação em estado estável | 540 →0 | 264 →0 |
| Recriação de indicadores | 0 →0 | 0 →0 |
| CLS estável | 0 →0 | 0 →0 |
| CLS na janela falha/recuperação | 0 →0 | 0 →0 |

O baseline Config inclui três mudanças genuínas de heartbeat durante a montagem da segunda superfície. O baseline de falha tem callbacks duplicados porque o observador antigo não era desconectado entre janelas; esses callbacks não são contados como transições distintas. A captura final desconecta observadores corretamente. [Bruto antes](before/observation.json), [depois](after/observation.json), [por indicador](status-mutations.csv), [linha temporal](timeline.csv).

Nos primeiros60s da janela estável, o registro temporal mostra reescritas recorrentes no baseline e nenhuma depois. O CSV temporal registra as únicas mudanças reais durante perda/recuperação; não há passagem intermediária por Initializing em verificação de fundo. Retry e seleção continuam usando os textos existentes de inicialização/troca, somente por ação explícita.

| Requisições/minuto medidas | Antes | Depois |
|---|---:|---:|
| Config: load + status + engines, minuto saudável |90|90|
| Console: todos os canais locais registrados, minuto saudável |178|178|
| Config: mesmos endpoints, janela de30s offline escalada |84|12|
| Console offline |0 após parar de recuperar|tentativas com backoff e recuperação automática|

[Contagens e canais](request-rates.csv). Rating Goal possui seu próprio GET de preferência, separado desse agregado; também recebe backoff/pausa. As taxas offline são janelas declaradas, não promessa de uma taxa constante: o espaçamento cresce até30s.

Política: pelo menos3 falhas consecutivas **e**6s desde o último sucesso; backoff2/4/8/16/30s. Volta no primeiro sucesso; Retry reinicia a política e compartilha uma consulta já em andamento. GET de metadados no console tem timeout5s; POST operacional mantém30s. Config mantém timeout4s. A tolerância saudável de500ms evita perder um tick legado por poucos milissegundos de resposta; tentativas com falha não são antecipadas. [Teste de falhas/Retry/visibilidade](behavior/report.json).

**Exceção operacional necessária:** ocultar Chess.com pausa verificações de engine e preferências visuais. Não pausa os heartbeats/comandos/acknowledgements de sessão nem a aplicação de configurações: isso quebraria Start/Export e sincronização quando o usuário abre a Config em outra aba. Esses canais são `session-relay` e `workspace-sync` nos registros. Não há promessa falsa de zero HTTP total numa aba oculta; há zero verificação dispensável. `test_session_relay_visibility.js` e o teste GM cobrem Export/ack oculto, reconexão independente e salvamento de edição pendente feita offline.

## Mapa de comunicação

[Inventário de temporizadores antes](communication-inventory.json) contém arquivo, linha e chamada. Agrupamento por responsabilidade:

| Fluxo | Endpoint / cadência | Falha e apresentação |
|---|---|---|
| Config polling | `/config/load`, `/config/status`,2s | Histerese/backoff, sem overlap; atualiza cabeçalho, ack, Banner e sessão por diferença |
| Config registro | `/config/engines`,2s, timer independente | Histerese/backoff próprios; não retarda configuração saudável |
| Console registro | `/eval-bar/engines`, tick legado2s/eligibilidade1,5s | Mesmo limiar/backoff; pending único e retomada; não reinicia runtime saudável |
| Preferência engine | `/config/engines/select` ou `/eval-bar/engines/preference` | Ação do usuário, revisão/ack existentes, seleção anterior preservada em falha |
| Workspace sync | GET `/config/load`,2s | Aplica valores e heartbeat; backoff em perda, continua operacional oculto |
| Sessão externa | `/config/load` + `/config/session/bridge`,1s saudável | Comandos, autorização e ack; backoff só em falha; não é verificação visual |
| Config sessão | `/config/session/commands` e resultado300ms até12s | Apenas durante ação; sem mudar validação/idempotência |
| Saves Config | debounce200ms; conflito100ms; falha2500ms | Draft/revisão/erro existentes; não foi convertido em polling de status |
| Saves console | fila de snapshot e retry existente | Mantida; recuperação agora retoma também snapshot pendente |
| Rating Goal | `/rating-goals/target`,2s | Preferência: backoff, pausa visual, sem apagar draft ou valor salvo |
| Rating Tracker | snapshot15s, outbox com backoff até300s, guard da sessão | Evidência/rating operacional: preservado |
| Scout | API pública Chess.com, freshness60s/cache/retries existentes | Preservado; não consulta nosso status de engine |
| Recomendação | request_move10ms verifica gates; `/getmove` sob condições existentes | Preservado; não é heartbeat |
| Eval Bar | adaptador500ms; stream fetch/reader e cancelamento existentes | Preservado; sem EventSource/WebSocket novo |
| UI/local clocks | reconcile400ms, rotas250ms, lifecycle300ms, status1s, RAF/temporizadores de montagem | Não são consultas HTTP por si mesmos; não foram alterados |

Não há nova conexão WebSocket/EventSource. O streaming de análise existente é uma operação de engine, não foi convertido em polling. Remain intact: requestAnimationFrame, scaleY, τ110ms, Latest-Wins, FEN/caching/cancelamento e normalização.

## Estados e DOM

| Indicador | Origem real / atualização |
|---|---|
| Local server connected/offline | Resultado confirmado de load/status; sem apagar texto durante revalidação |
| Chess.com connected/disconnected/connection unknown | Heartbeat do userscript, distinto do servidor local |
| Analysis inactive/running/unavailable | Projeção do registro/execução, distinta de engine Ready |
| Linha de versão | Versão local e heartbeat/version reportada; mantém último valor na falha |
| Engine Ready/Active/Unavailable/Error/Connection Lost | Estados e significados existentes, conforme instalação/runtime/autorização/erro |
| Initializing/Switching | Primeira descoberta ou ação explícita; nunca ciclo saudável de fundo |
| Cannot reach analysis engine / Retry | Falha confirmada estática; Retry32px em reserva40px, largura64px |
| Settings saved / Applied in a Chess.com tab | Save aceito versus revisão aplicada no tab; nenhuma falsa confirmação |
| Auto Play e Rating Goal | Escrita por diferença em texto/atributos; relógio ativo ainda muda quando seu valor real muda |

Fontes: `panel.js`, `engine-selection.js`, `status-runtime.js`, `session_control/ui.js`, `target-field.js`. Nenhuma recriação periódica de indicador; options só são reconstruídas quando seu contrato muda. A linha de versão fixa a altura natural da primeira resposta aceita, recalculada no resize; o texto completo permanece em title. Não foi ocultada nem reescrita copy.

Status, mensagem, Retry e menu têm animation/transition none. Toggles/hover existentes continuam com suas transições originais e regras de prefers-reduced-motion existentes; não foram recoloridos. Não há spinner/fade/shake novo.

## Menu e acessibilidade

Chrome local:155.0.8059.86, base-select e Popover disponíveis. Chrome documenta estilização nativa desde135, mas suporte continua parcial entre navegadores; por isso foi escolhida a opção(b) solicitada, listbox próprio compartilhado. [Chrome](https://developer.chrome.com/blog/a-customizable-select), [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select).

O select original mantém seu retângulo no fluxo, ID, valor, opções, disabled e eventos. Um botão equivalente sobreposto representa combobox; o popup usa top layer, escapando do overflow do painel. Sem Popover, há portal fixo no body; sem primitivas necessárias, o native select permanece visível. Opções32px, padding12px, borda1px, gap4px, rolagem só acima de seis opções. Abertura para cima foi validada em host DOM fixo de borda; não se apresenta esse harness como uma partida real.

Fundo: `#1D1D1B`; neutro selecionado/hover: token de borda existente `#3A3A36`; texto/borda/raio/fontes são lidos do select atual. Check SVG usa currentColor. Sem azul do sistema, sombra, animação ou acento novo. Teclas: Enter/Espaço/Down abrem; setas/Home/End/typeahead navegam; Enter confirma; Escape fecha e devolve foco; Tab segue; clique fora fecha. AX tree confirma combobox/listbox/nomes; não houve teste com leitor de tela humano.

[Relatório11viewports](menu/report.json). Console1086/1280/1440/1920/1033/800; Config1440/1280/1024/768/390. Persistência após reload, overlay, vazio, disabled, seleção e teclado passaram; nenhum retângulo de painel muda ao abrir. A fixture tem canvas externo fixo1433px, portanto seu overflow global pré-existente em viewports menores foi separado do overflow introduzido pelo menu: o menu não aumenta scrollWidth, e a Config não tem overflow em390.

## Geometria, cores e limites de cobertura

[Comparação completa dos painéis](panel-comparison.csv), [validação](validation.json), [Config final](final/config.json), [console final](final/console.json), [cores](final/colors.json):60 estados Config e12 console, zero diferenças de x/y/largura/altura dos painéis existentes; zero diferenças de cores existentes. Linhas40px/desvio0, fontes visíveis≥11px; popup e painéis em pixels inteiros.

Console mantém Visuals=Engine e Scout=Auto Play, gaps12px e breakpoint1034. A diferença de81px entre coluna esquerda e Engine **na Config já existia no baseline `a7c0100`** e foi preservada; resolver isso era a alternativa E/P7 pendente da tarefa anterior e não foi incluído disfarçadamente nesta tarefa.

Escopo real: Chromium local, Flask real, registro instalado real e transporte GM fiel via CDP fora da página. Recomendação:256 casos com Flask/getmove/Komodo real e adaptador local sintético. **Não validado em Chess.com autenticado com Tampermonkey instalado**, nem Firefox/Safari executando a UI. A captura Page/CDP não inclui o popup nativo do sistema operacional: `native-before-300` mostra o controle nativo/fallback, não uma falsa captura do menu OS aberto. Os screenshots do novo menu aberto são reais.

## Entrega e navegação

- [Bloco1](BLOCK1.md), [Bloco2/classificação F12](BLOCK2.md), [timeline](timeline.csv), [mutações](status-mutations.csv), [requisições](request-rates.csv).
- Console aberto: [1440](menu/console-1440-open.png), [1086](menu/console-1086-open.png).
- Config aberta: [1440](menu/config-1440-open.png), [390](menu/config-390-open.png).
- 300% console: [repouso](menu/console-rest-300.png), [hover](menu/console-hover-300.png), [selecionado](menu/console-selected-300.png), [teclado](menu/console-keyboard-300.png), [disabled](menu/console-disabled-300.png).
- 300% Config: [repouso](menu/config-rest-300.png), [hover](menu/config-hover-300.png), [selecionado](menu/config-selected-300.png), [teclado](menu/config-keyboard-300.png), [disabled](menu/config-disabled-300.png).
- [Recomendação real](recommendation.json), [GM silencioso](quiet/console-report.json), [falhas e independência do registro](behavior/report.json), [servidor real](live.json).

Nenhum texto novo de produto foi necessário. O erro inicial sem seleção conhecida mantém a apresentação vazia/desabilitada existente, respeitando a decisão anterior de não criar placeholder. Parâmetros de histerese/backoff estão informados acima; nenhuma aprovação adicional foi usada para aplicar mudanças fora do pedido.

## Conferência final adicional

`all-indicators/report.json`:60s com indicadores de conexão, engine, Auto Play, Banner e picker focado; zero mutações, recriação e CLS. [Revisão](REVIEW.md) registra os casos corrigidos. `quiet/console-report.json` também confirma reconexão automática com preferência alterada offline e salva depois, sem Retry manual. O fluxo de sessão oculto mantém Export e acknowledgement mesmo quando o verificador visual estava offline.

A tentativa de conferir a extensão no Chrome real pela skill Computer Use foi interrompida pela própria ferramenta: “could not determine the current browser URL on Windows with enough confidence to enforce policy”. Não houve entrada na página, alteração da extensão, autenticação, leitura de perfil por outro caminho nem contorno. A limitação está separada dos testes locais aprovados.

Diff por bloco: [status/conexão](diffs/block1.diff), [F12](diffs/block2.diff), [menu](diffs/block3.diff).
