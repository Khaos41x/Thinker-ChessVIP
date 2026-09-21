# Design QA — Painéis compactos e banner ancorado

## Evidências

- Referência do painel de configuração: `C:\Users\SOBOOA~1\AppData\Local\Temp\codex-clipboard-49119e7d-581f-4221-a8d1-940320f73785.png`
- Referência do Scout: `C:\Users\SOBOOA~1\AppData\Local\Temp\codex-clipboard-f5afb823-66c2-40c8-8b03-dba9eb7d1ef5.png`
- Implementação renderizada: `C:\Users\sobooa7iqytvqheo\Desktop\Thinker-ChessVIP\tests\artifacts\thinker-panels-final.png`
- Viewport da implementação: 1433 × 1500 CSS px, `deviceScaleFactor: 1`.
- Pixels das fontes: configuração 284 × 467; Scout 323 × 715.
- Pixels da captura implementada: 1433 × 1500. Não houve normalização de densidade; todas as evidências foram comparadas em densidade 1×.
- Estado: tema escuro, painel de configuração expandido, Scout com 50 partidas simuladas pela mesma estrutura da PubAPI, banner visível ao lado da sidebar.

## Comparação visual

As três imagens foram abertas juntas na mesma comparação. A implementação reproduz a superfície quase preta, borda discreta, raio de 20 px, tipografia compacta, controles alinhados, switches de 34 × 20 px, divisores, slider, inputs e hierarquia das referências. A largura útil do painel de configuração é 268 px, compatível com o painel visível dentro da referência de 284 px; o Scout tem 296 px, compatível com o painel visível dentro da referência de 323 px.

O Scout preserva o gráfico circular, resumo V/E/D, resultados por cor, desempenho por ritmo e aberturas mais jogadas. A cópia principal foi intencionalmente alterada de “aproveitamento/score” para “taxa de vitórias”, atendendo ao requisito de clareza e usando apenas `vitórias ÷ jogos`. As linhas por cor e ritmo também dizem explicitamente “vitórias”. Contagens de “outras aberturas” foram omitidas porque a PubAPI pode não fornecer uma abertura identificável para todas as partidas; exibi-las como abertura conhecida criaria falsa precisão.

O banner usa `position:absolute` nas coordenadas de documento da sidebar de notações. Assim, ele pertence ao mesmo plano do layout do Chess.com: não possui listener de scroll, não persegue o viewport e mantém sua posição ao lado da área de notações.

## Superfícies obrigatórias

- Tipografia: Inter com fallback Arial, pesos e hierarquia equivalentes; truncamento aplicado somente aos nomes longos de abertura.
- Espaçamento e ritmo: padding, divisores, gaps, raios e dimensões dos dois painéis alinhados às referências.
- Cores e tokens: fundo `#111216`, bordas `#202228`, texto branco/cinza e verde semântico reproduzidos.
- Imagens e ícones: banner original preservado; controles usam ícones de biblioteca embutidos como imagens, sem placeholders.
- Cópia e conteúdo: termos ambíguos removidos; todas as métricas visíveis identificam fórmula, amostra ou unidade.

## Interações e regressões

- Inputs, radios, slider, seletor de cor e fechamento continuam conectados aos handlers existentes.
- DOM final confirmou painel, Scout e banner montados.
- Banner final confirmado como absoluto e ancorado.
- Nenhum `SCORE` ou `% score` visível.
- Nenhum `SyntaxError`, `ReferenceError`, `TypeError` ou erro fatal no Chrome.
- Nenhuma chamada direta a `console.log/info/warn/trace/error/debug`.

## Histórico de comparação

1. P1: painéis antigos divergiam completamente das referências; substituídos pela estrutura compacta e pelos novos tokens visuais.
2. P1: banner fixo ao viewport mudava de posição relativa durante scroll; alterado para coordenadas absolutas de documento da sidebar.
3. P1: “Score” era semanticamente ambíguo; removido e substituído por taxa de vitórias calculada diretamente.
4. P2: inputs numéricos truncavam valores na primeira captura; largura e aparência nativa dos spinners foram corrigidas.
5. P2: símbolos aproximados diferiam dos ícones da referência; substituídos por ícones reais de biblioteca incorporados.

Não restam diferenças P0, P1 ou P2 acionáveis. A ausência das linhas “+ N em outras aberturas” é uma decisão de integridade dos dados, não uma divergência visual acidental.

final result: passed
