# Entrega — conectividade e acabamento

## Resultado e escopo comprovado

O servidor de uso responde em 127.0.0.1:5050, /config e /health retornam 200. O PID final é 16452, com listener IPv4 confirmado fora do sandbox. O sandbox não tem acesso à rede local: seu curl retorna Bad access; esse resultado não é confundido com a recusa TCP original medida no host.

A Config real permitiu escolher os três engines por teclado, confirmar, recarregar e restaurar a preferência inicial, sem heartbeat e sem ativar a Eval Bar. Três engines reais passaram inicialização, avaliação cp/mate, cancelamento e sequência Smallnet → Full → Komodo → Smallnet. Os hashes completos e o carregamento real de NNUE estão no benchmark. Nenhum asset foi baixado novamente.

A implementação servida é 2026-10-25.2. A versão instalada no Tampermonkey não foi comprovada pela observação HTTP: userscriptConnected=false e userscriptVersion=null. Não se afirma que os screenshots locais representam essa instalação.

## Blocos e causas

| Bloco | Commit | Resultado |
|---|---|---|
| 0 | 1985a33 | Bind exclusivo antes do warmup e da mensagem de pronto; limpeza em saída; três testes de processo real |
| 1 | 53e59d2 | Diagnóstico HTTP/token/histórico e 256 combinações reais do pipeline de recomendação |
| 2 | a8b7f42 | Mensagem e Retry na mesma linha de 40px; Retry 32px; altura estável |
| 3 | 0920c26 | Removidos 6px entre controles que produziam pitches alternados 46/40px |
| 4 | 08c35c4 | Core 171 + gap 12 + Visuals 211 = Engine 394px, sem cauda adicional padrão |
| 5 | fd5dc18 | Em 1086: inputs numéricos 64px, segmented 158px, padding 12px; 1280+ preservado |
| 6 | 3594f24 | Aviso medido e preservado; nenhuma copy/cor/visibilidade alterada |
| 7 | commit desta entrega | Paridade dos primitivos/Timing da Config, recuperação de opção indisponível, versão e conferência final |
| 8 | 448aec4 | Banner confirmado: 18,72px; texto 121,33px de 144px úteis (84,26%); nenhuma alteração |

A recusa original era real: Python vivo sem listener TCP5050. A mensagem Rodando era impressa antes de tentar bind. A reprodução com porta ocupada mostrou mensagem falsa de pronto seguida de falha de bind e processo mantido vivo pela thread UCI. Não foi recuperado o primeiro erro do processo original; por isso não se afirma que uma colisão de porta foi a causa daquele processo específico. Proxy/firewall não foram alterados. [Saídas brutas e investigação](BLOCK0.md).

Error/Cannot reach analysis engine é o ramo de falha de transporte, anterior ao registry. Com servidor disponível, a lista protegida retorna três opções; token ausente/antigo retorna 401, não recusa TCP. O token persistido em capability.json não muda em cada início. /getmove usa Komodo; o seletor controla a análise/Eval Bar. Não se expandiu autorização nem se trocou a engine dos consumidores legados. [Evidência e limites](block-1/INVESTIGATION.md).

A revisão adicional encontrou uma falha de recuperação: um engine indisponível desabilitava a seleção e Retry repetia a mesma opção inexistente. Retry agora atualiza a descoberta quando essa opção deixou de estar instalada; os disabled das opções acompanham a lista atual. Teste real de registry503 → Retry → Ready → outra opção passou, preservando a última preferência salva e sem inicializar runtime.

## Medições finais

[Tabela completa de alturas/caudas antes/depois](after/panel-table.md), [linhas e desvios](after/control-rows.csv), [posição das seções](after/engine-sections.csv), [68 estados completos](after/audit.json).

| Console desktop | Smart Pacing off: altura/cauda | Smart Pacing on: altura/cauda |
|---|---:|---:|
| Core | 171/12px | 171/12px |
| Visuals | 211/12px | 211/12px |
| Engine | 394/12px | 394/98px (exceção autorizada) |
| Auto Play | 252/12px | 252/12px |
| Scout vazio | 658/555px | 658/555px |
| Scout com quatro aberturas | 658/129px | 658/129px |

Scout permanece ancorado no topo; sua cauda é dinâmica em qualquer estado, conforme aprovação. Não influencia o conteúdo dos demais painéis. Visuals/Engine e Scout/Auto Play terminam com diferença 0px. Todas as linhas padrão têm 40px e desvio de centro 0px; gaps12px; nenhum controle fracionário ou overflow horizontal. A 800px a distribuição inteira dos inputs foi validada. Config390px tem inputs numéricos67px com segmented na mesma linha.

Ready/Error/Retry do Engine: console394px e Config508px, sem crescimento de painel. A primeira falha sem lista conhecida continua com select vazio/desabilitado: não existe placeholder e a proposta de copy foi vetada. Após descoberta, o nome conhecido fica visível na falha.

2.100 pares de componentes/estados comparados, zero mudança inesperada de cor. No teste do swatch, 287 componentes externos às setas/swatch permaneceram iguais. .myhigh continua com borda #10B981, fundo rgba(16,185,129,.15), sombra rgba(16,185,129,.2) 0px 4px 12px. Arrow Color controla só as setas; geometria e opacidade0.8 preservadas.

## Testes executados

- Startup real: bind/health/lista, porta ocupada sem falso pronto e restart Windows após HTTP: 3 testes passaram.
- Registry real: 4 testes, 55,227s; três engines, NNUE, identidade, cp/mate, cancelamento, cache e limpeza passaram.
- Recomendação real: 256 combinações; Komodo → resposta → SVG; duas orientações e reload passaram. Nenhuma jogada real foi executada; agendamento de Auto Moves observado por recorder.
- Histórico do controller: seis checkpoints com HTTP real, transporte bloqueado e recuperação passaram. Não é bisect completo da aplicação autenticada.
- Auditoria Chromium: 48 estados console (1086/1280/1440/1920/1033/800) e20 Config (1440/1280/1024/768/390); Bot/Smart Pacing e Scout vazio/populado passaram.
- Erro/Retry com falha real de transporte, offline/reconnect, heartbeat expirado, Active com prova UCI real e retorno Ready mantendo PID passaram.
- Foco mouse/Tab, Scout, Auto Play, sincronia de cor, preferências reais em5050 passaram.
- Backend Config7, Phase091 Config3, defaults4, delivery2, cores2; controller de seleção/contexto/races, SessionControl14 grupos, geometria de setas e defaultsUI passaram.
- Builds determinísticos analysis e userscript --check passaram. Preservação dos trechos não relacionados verificada em after/preservation.json.

## Screenshots

[Console1440 padrão](after/console-1440-bot1-pacing0-scout1.png) · [Smart Pacing ligado](after/console-1440-bot1-pacing1-scout1.png) · [1086](after/console-1086-bot1-pacing0-scout1.png) · [800 empilhado](after/console-800-bot1-pacing0-scout1.png).

[Config1440](after/config-1440-bot0-pacing0.png) · [1024](after/config-1024-bot0-pacing0.png) · [390](after/config-390-bot0-pacing0.png) · [Antes](before/).

[Ready](block-2/config-ready.png) · [Initializing/Retry](block-2/config-initializing.png) · [Error](block-2/config-error.png) · [Seta brancas](block-1/pipeline/pipeline-white.png) · [Seta pretas](block-1/pipeline/pipeline-black.png).

Foco e Scout: block-7/focus e block-7/scout. Desconexão e Active reais no processo isolado: block-7/connections.json e screenshots390. Resultados de performance: block-1/real-engine-benchmark.json. Diffs de fontes separados por bloco: diffs/.

## Decisões pendentes e limites

- Aviso Auto Play preservado literalmente apesar de53/61 salvos. #9AB7A3 versus hint #AAABA5; ambos11px. A proposta de igualar só o estilo não foi aplicada. Trecho/seletor em block-6/OBSERVATION.md.
- Timing1280+ conserva o layout aprovado, inclusive padding antigo; nenhuma nova linha acrescentada. Comparação dos cenários em block-5/.
- Placeholder inicial foi vetado, portanto não foi inventado.
- Screenshots/DOM/eventos são Chromium local com fixture fiel e processos Flask/engine reais. A Config também foi exercitada no servidor de uso5050. Chess.com autenticado com Tampermonkey não está comprovado por esses testes; sua versão instalada permanece desconhecida até inspeção nativa.
- Sem push. Alterações anteriores de Eval Bar, rating, arte e demais trabalho não relacionado continuam fora destes commits.
