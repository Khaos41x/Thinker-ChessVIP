# P1–P9 — previews, não aplicados

Cada comparação é independente, com o mesmo estado inicial. Não somar as reduções de altura: propostas combinadas exigem nova medição. [Tabela completa desktop/mobile](proposal-measurements.md). Screenshots de 390 também existem com o mesmo nome substituindo `1440` por `390`.

| Item | Proposta e decisão necessária | Δ página em1440 /390 | Comparação1440 |
|---|---|---:|---|
| P1 | Uma linha com os três textos existentes e ponto; preservar dimensões distintas. Em390 pode quebrar linha. Servidor indisponível usa o erro existente, nunca mantém falso conectado. Aprovar consolidação? | −26 /−10 | [antes](proposals/P1-1440-before.png) · [preview](proposals/P1-1440-after.png) |
| P2 | Ocultar a versão quando atual; manter link no mesmo lugar. Desatualizado exibe aviso existente; ausente mantém caminho de instalação, sem concluir que heartbeat ausente significa extensão ausente. Aprovar regra condicional? | 0 /0 | [antes](proposals/P2-1440-before.png) · [preview](proposals/P2-1440-after.png) |
| P3 | Substituições de jargão abaixo, somente em preview. Aprovar a lista, individualmente se necessário? | 0 /−34 | [antes](proposals/P3-1440-before.png) · [preview](proposals/P3-1440-after.png) |
| P4 | Opção(a): sem bridge, esconder Start/Finish e resumo, manter metas/Export indisponível/avisos. Opção(b): manter tudo, estados honestos como hoje. Recomendo(b) até definir melhor o acesso ao diagnóstico. Escolher(a) ou(b)? | −51 /−91 para(a); 0 para(b) | [atual/b](proposals/P4-1440-before.png) · [a](proposals/P4-1440-after.png) |
| P5 | Um hint operacional por estado já existe; preview o coloca antes dos botões. O aviso Win-rate permanece integral. Reduzir tudo a um único hint exigiria autorização para alterar/ocultar esse aviso. Aprovar apenas a ordem proposta? | −8 /−8 | [antes](proposals/P5-1440-before.png) · [preview](proposals/P5-1440-after.png) |
| P6 | Refresh + um texto existente; Settings saved ao lado, transitório~1,5s sem mudar altura. Imagens demonstram instante salvo e estado final, não timer implementado. Aprovar esse rodapé? | −29 /−46 | [antes](proposals/P6-1440-before.png) · [salvo](proposals/P6-1440-after.png) · [final](proposals/P6-1440-settled.png) |
| P7 | Clean View em Visuals, mesmo controle/hint; remover painel Workspace. Esquerda490, Engine476, diferença14 no padrão. Smart Pacing ligado deixa diferença128. Aprovar movimento e discutir exceção de alinhamento para Timing oculto? | −67 /−67 | [antes](proposals/P7-1440-before.png) · [preview](proposals/P7-1440-after.png) |
| P8 | Preview remove outputs só da Config e reduz gap da strength. Recomendo manter valor atual: 3200 não é sempre igual ao máximo; Timing também informa modo. Gap entre caixas slider/legenda20→8px, track-centro/legenda28→16px. Aprovar apenas o gap, mantendo resumos? | 0 /−24 no preview completo; Engine−24 | [antes](proposals/P8-1440-before.png) · [preview](proposals/P8-1440-after.png) |
| P9 | Remover subtítulo ou escolher: “Your Thinker Chess settings.”, “Control Thinker Chess.”, “Everything in one place.” Recomendo remoção. Qual opção? | −21 /−21 na remoção | [antes](proposals/P9-1440-before.png) · [remoção](proposals/P9-1440-after.png) |

## P3 — substituições propostas, sem aplicação

| Atual | Proposta |
|---|---|
| Local server connected | Thinker Chess is running |
| Your controls. A separate workspace. | Your Thinker Chess settings. |
| NNUE network / MiB / descrição técnica do engine | Fast position analysis with Stockfish. (Dados exatos permanecem no debug; não converter MiB em MB.) |
| Analysis starts only in an authorized context. | Analysis is available on supported Chess.com pages. (Nenhuma ampliação de autorização.) |
| Reload Chess.com after updating the userscript. | Update the userscript, then reload Chess.com. |
| Session execution requires the connected Chess.com workspace. | Keep Chess.com open with Thinker Chess enabled to use Auto Play. |
| Preferences are saved on this local server. | Your settings are saved on this computer. |
| Applied in a Chess.com tab | Settings synced with Chess.com. (Somente após acknowledgement real.) |

O preview P3 demonstra hierarquia e simplificação; seu rodapé usa “Your settings are saved. Open Chess.com to use Auto Play.”. A formulação mais precisa da tabela acima depende da decisão de copy e não foi colocada no produto.

## E — alternativas de alinhamento

- [Esticar Engine](proposals/E_stretch-1440-after.png): borda0, cauda93px, viola regra; não recomendado.
- [P7 + espaçamento entre seções](proposals/E_P7-1440-after.png): esquerda490/Engine490, cauda12, padrão viável; depende de P7.
- [P7 com Smart Pacing](proposals/P7_SP-1440-after.png): esquerda490/Engine362, diferença128.
- [P7 + espaçamento com Smart Pacing](proposals/E_P7_SP-1440-after.png): esquerda490/Engine372, diferença118; não resolve o estado oculto dentro das regras atuais.

Nenhum painel do console é alterado por qualquer preview. Export Diagnostics sem os dados do engine é outra decisão: autorizar snapshot do registro no arquivo exportado, sem token, em tarefa separada.
