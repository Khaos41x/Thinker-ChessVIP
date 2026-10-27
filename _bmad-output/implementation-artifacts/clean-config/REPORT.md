# External Config — limpeza autorizada

Aplicados somente A–D. E foi medido e interrompido conforme a regra do pedido: não há solução dentro dos limites sem aplicar P7, que foi reservado à aprovação. P1–P9 existem apenas em previews isolados; nenhuma dessas propostas foi aplicada ao produto.

## Resultado e commits

| Item | Commit | Resultado |
|---|---|---|
| A | `0c803ae` | Nova migração única dos quatro campos; histórico preservado |
| B | `dca46e0` | Technical details ausente do DOM normal; disponível em `?debug=1` |
| C | `b73dd6a` | Banner e Clean View: linha 40px + hint 24px, fonte 11px |
| D | `8f913cd` | Hint completo em até duas linhas na mesma reserva de 40px |
| E | commit de documentação desta entrega | Sem alteração de layout; opções e limites registrados |

O servidor real foi reiniciado de forma controlada, sem análise ativa e com Bot/Auto Moves/Auto Queue desligados. `/health` retorna ready, `/config` retorna 200. Os quatro valores atuais são null. O Rating Goal anterior era 1300; os outros três já estavam null. [Registro sanitizado](live-migration.json). Nenhum token ou banco foi incluído no commit. Nenhum push realizado.

## Auditoria integral e evidências

[Inventário de elementos](audit-elements.csv): texto exato/valor, seletor, viewport, estado, visibilidade, fonte, público, redundância e recomendação, antes e depois. [Dados brutos antes](before/audit.json) e [depois](after/audit.json) preservam também posições e estados disabled. [Painéis](panel-measurements.csv), [linhas](control-rows.csv), [tabela resumida](panel-table.md), [validação](validation.json).

Foram capturados 60 estados por fase: cinco larguras (1440, 1280, 1024, 768, 390) × padrão, Bot, Auto Rating, Smart Pacing, todos ligados, conectado/atualizado, desatualizado, ausente, Loading, Error, servidor indisponível e Immediate. É uma matriz de cobertura por estado, não o produto cartesiano de todas as flags. As projeções de heartbeat, atraso e HTTP 503 usam os contratos existentes em fixture de teste; não representam uma partida real nem alteração de gameplay. A indisponibilidade dessa matriz é uma falha HTTP projetada, não a interrupção física do servidor.

Console: 12 comparações estáveis (1086, 1280, 1440, 1920, 1033, 800 × Smart Pacing desligado/ligado). Baseline do userscript `c884834`, capturado após concluir a animação existente. Diferenças de retângulos de painéis/títulos e cores computadas: **zero**. [Antes](before/console.json), [depois](after/console.json). A única mudança funcional de console é a migração A solicitada; não houve CSS/layout/copy de console.

Na Config: linhas 40px, desvio de centro 0px; fontes visíveis ≥11px; painéis com x/y/largura/altura inteiros; nenhum overflow horizontal nos cinco viewports; caudas de painéis ≤12px. Nenhuma regra de cor de componente foi modificada. Comparação de cores computadas de todos os elementos contra a folha CSS de `c884834`: dez estados (cinco larguras × toggles ligados/desligados), zero diferenças, incluindo texto/fundo/borda/outline/sombra; [resultado](colors/report.json). Essa comparação substitui a folha somente no browser de teste via CDP, sem mudar CSP do produto. Não se declara uma nova certificação de contraste de cada estado do navegador: as cores existentes foram preservadas.

## Dependências dos elementos suspeitos

| Elemento / fonte | Leitura e dependência | Cobertura / conclusão |
|---|---|---|
| Technical details; `panel.js renderEngines` | Antes: details fechado no DOM, sem flag. Apenas projeção de JSON, nenhuma dependência operacional | `test_config_debug.mjs`: normal/debug=0 ausente, debug=1 presente; JSON de três engines preservado |
| Local server connected; `#connection` | Resultado de comunicação HTTP/configuração | Matriz conectado/indisponível; não equivale a Chess.com conectado |
| Chess.com; `#userscript-connection` | Heartbeat do userscript | Atualizado, desatualizado e ausente na matriz |
| Analysis inactive; `#execution-state` | Execução de análise, distinta de disponibilidade do registro | Ready não prova pesquisa ativa: pode estar Ready e inactive corretamente |
| Linha de versão; `#client-build-state` | Versão local e versão reportada pelo heartbeat | Sem heartbeat: Local version … Reload…; atual: Userscript … up to date; antigo: Userscript update required …; sem versão de servidor: Restart…; navegador sem versão: not verified |
| Install/update; `#userscript-update` | Acesso ao arquivo local; label condicional de atualização | Mantido em todos os casos; ausência de heartbeat não prova ausência de instalação |
| Analysis; `#analysis-engine-message` | Descrição do registro e autorização, só apresentação | D: antes nowrap/ellipsis; agora texto completo sem aumentar Engine; 15 combinações engine/viewport |
| Disabled; `#banner-display-state` | `panel.js poll`, mapa bannerLabels; banner=false tem precedência | Console possui toggle, sem esse hint textual. C preserva texto e regra |
| Workspace / Clean View | ghostMode compartilhado; oculta visuais segundo regra existente | C muda somente caixa de hint. Mover controle é P7, não aplicado |
| Auto Play | Preferências compartilhadas e comandos pelo bridge autorizado | Start exige Duration válida; Finish usa fluxo existente; Export depende de bridge conectado |
| Win-rate targets…; `#session-target-help` | Aviso estático em index.html e apresentação compartilhada | Mantido integralmente. Primeira frase coerente com vazio; “Configure both before starting” continua contradizendo a política que permite ambas as metas vazias com Duration válida |
| Disponibilidade; `#session-availability` | Projeção de conexão/Bot/validação/fase da sessão | Texto por estado existente, não substitui o aviso estático |
| Settings saved; `#save-state` | Save aceito; revisão aplicada no tab usa acknowledgement próprio | Não é equivalente a análise ativa. P6 é só proposta |
| Refresh; `#retry` | Handler limpa timer, tenta salvar pendências, poll e refreshEngines | Não reinicia engine saudável nem altera autorização |
| Rodapé; `.footnote` | Orientação estática; sem consumidor operacional | P3/P6, mantido |
| Move Timing; `#timing-value` | Random mostra intervalo; Immediate mostra nome do modo; Timing oculto por Smart Pacing | Resumo de estado, não preferência extra; mantido |
| Strength; `#elo-value` | Valor atual de config.elo; no console displayElo | 3200 só duplica Max3200 quando está no máximo. Valor 1800 não é redundante |
| Subtítulo; `.intro` | Branding estático | P9, mantido |

Export Diagnostics hoje exporta estado/eventos de sessão (`script.js exportDiagnostic` → `frontend/session_control/telemetry.js diagnosticExport`), **não** o JSON completo do registro de engines/NNUE/recursos. Sem Chess.com/bridge, o botão fica indisponível; conectado pode exportar a sessão/diagnóstico disponível sem exigir uma partida ativa. Não foi ampliado: proposta separada seria anexar um snapshot do registro ao arquivo, sem incluir token. Depende de autorização.

## Persistência e migração A

Servidor: `external-config-preference.json` contém Duration/Min/Max; envelope antigo `sessionFieldsVersion:1`, novo `autoPlayFieldsVersion:2`. SQLite `rating-tracker.db`, tabela metadata, contém `ratingTarget`; nova metadata `autoPlayFieldsVersion='2'`. A primeira leitura/abertura sem v2 limpa os valores autorizados; salvamentos posteriores preservam o que o usuário digitou. Tabelas de histórico e demais preferências não são apagadas.

Navegador: compatibilidade de três campos em localStorage/sessionStorage (`sessionDurationMinutes`, `sessionMinimumPercent`, `sessionMaximumPercent`), nova chave `thinker.autoPlayFields.v2='1'`; a chave anterior `thinker.sessionFields.v1` permanece compatível. Rating Goal não possui valor canônico persistido no navegador: o componente lê `/rating-goals/target`; sua limpeza acontece no servidor. Não foram inventadas nem removidas chaves de terceiros.

As duas superfícies leem as mesmas preferências/target. Duration vazia permanece null/empty, sem NaN nem conversão silenciosa a 0. Start fica desabilitado; Min/Max ambos vazios significam sem meta de win rate, valores fora do intervalo e Min>Max continuam rejeitados. Rating Goal vazio significa sem meta de rating.

## E: limite confirmado, sem aplicar

Desktop padrão: antes coluna esquerda551 / Engine508 (diferença43); depois esquerda557 / Engine476 (diferença81). Core175, Visuals239, Workspace119, gaps12, caudas12. Smart Pacing ligado: Engine362, diferença195. Linhas já estão no teto40px. Três junções ×8px absorvem no máximo24px, insuficientes para81px.

Esticar Engine até557 alinha, mas produz cauda93px: rejeitado. Preview P7 move Clean View para Visuals: esquerda490, Engine476, diferença14. P7 + distribuição adicional 2+4+4+4px entre seções fecha490/490 com cauda12 no padrão. Porém Smart Pacing ligado ainda deixa diferença118px. Portanto essa alternativa precisa da decisão P7 e de uma decisão explícita para o estado Timing oculto; não foi aplicada por conta própria. [Todas as medidas das opções](proposal-measurements.md).

## Testes executados

- Python: test_autoplay_v2 (2), test_empty_session_preferences (2), test_rating_tracker (53), test_rating_session_goal (34), test_rating_tracker_reliability (17): passaram.
- Node: preferências vazias, campo de target, guard de sessão/rating, sessão Phase09.1, 14 suites session_control: passaram. Build determinístico `--check`: passou.
- Chromium: test_all_autoplay_empty, test_config_debug, test_engine_hint (15 casos), test_clean_config (60 Config +12 console), test_clean_config_colors (10 casos), capture_clean_console_baseline, preview_clean_config: passaram. Sem exceções não tratadas nos fluxos auditados.
- Migração real: servidor PID antigo4748 reiniciado em6824; health ready, Config200; Rating Goal1300→null; outros três null; marker2 em JSON/SQLite; contagens de histórico iguais.

Testes visuais e de interação: **Chromium local com fixture fiel e Flask real**. Não foi validado nesta entrega o Chess.com real autenticado com Tampermonkey nem se a extensão instalada já carregou a versão `.5`. Não há alegação de atualização automática da extensão.

## Capturas

| Largura | Antes | Depois |
|---|---|---|
| 1440 | [imagem](before/config-1440.png) | [imagem](after/config-1440.png) |
| 1024 | [imagem](before/config-1024.png) | [imagem](after/config-1024.png) |
| 390 | [imagem](before/config-390.png) | [imagem](after/config-390.png) |

Estados adicionais em `after/config-*-1440.png`; previews independentes e decisões P1–P9 em [PROPOSALS.md](PROPOSALS.md). As propostas não devem ser interpretadas como screenshots do produto implementado.
