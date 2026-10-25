# Alturas naturais e caudas

Antes: linhas com caixa de 40px mas margem de 6px antes de Auto Moves, Banner e Arrow Color. Engine Ready 412px; com Retry separado 446px e cauda do Visuals 46px. A margem de 6px foi introduzida em 2898896; o agrupamento anterior c8ba23f já aplicava margem entre controles. A linha de Retry sem reserva existe desde b9624eb.

Depois: Core 171px + gap12px + Visuals211px = coluna natural394px. Engine394px em Ready, Error e Retry. As divisórias entre seções reais usam 4px de padding, sem margens entre linhas de controle. Timing usa line-height16px, igual à faixa de feedback. Nenhuma linha recebe altura desigual e nenhum preenchimento foi posto no fim dos painéis.

Caudas de Core, Visuals e Engine padrão:12px depois da última caixa de linha. O espaço simétrico de 8px dentro de uma linha40px com toggle24px não é cauda de painel: ele existe igualmente acima e abaixo do controle. Smart Pacing mantém altura394px com o conteúdo no topo; Scout continua alinhado ao Auto Play, inclusive vazio.

A altura de 394px foi medida no navegador, não apenas calculada. Estados finais e screenshots em ../block-2/states.json; a matriz de todos os viewports será preservada em ../after/.
