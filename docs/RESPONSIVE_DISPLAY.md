# Responsividade, zoom e adaptação de display

Versão: **2026-10-29.1**. Data: 2026-10-29.

## Solução integrada

O console continua usando três colunas quando sua largura CSS útil comporta1034px e uma coluna abaixo desse limite. O limite máximo e o design existente foram preservados. As regras especiais que mudavam colunas na resolução exata1086px foram removidas. Timing e Auto Play agora usam consultas ao tamanho do próprio painel: reorganizam os controles quando não cabem, mantendo fonte, controles de32px, cores, arte e gaps principais de12px.

O posicionamento continua ancorado ao documento/tabuleiro; não tenta igualar tamanho físico entre monitores. A largura disponível usa pixels CSS e exclui a barra de rolagem. Uma conversão explícita atende contêineres posicionados, sem contratransformação por scale(). A arte não é mais reduzida em CSS por devicePixelRatio.

Leituras e escritas do layout ficam agrupadas por RAF. ResizeObserver acompanha os alvos atuais; observação de atributos mantém candidatos de sidebar ocultos, para detectar seu reaparecimento. Resize, scroll, visualViewport e mudança de densidade solicitam atualização. O teardown cancela frames e timer de reconciliação e remove observers/listeners e callback pendente da imagem.

O menu de engine usa os limites do visualViewport, margem de8px, altura disponível acima/abaixo e rolagem interna quando necessária. Se a âncora deixa a área visível, fecha sem alterar a preferência. O estado e a navegação por teclado continuam nos controles originais.

## Causas verificadas

| Causa | Evidência | Correção |
|---|---|---|
| Regras do console dependiam da janela, não do espaço do painel | Com wrapper1034px, Scout mudava de282px a1086 para296px a1440; regra exata de viewport | Mesma grade desktop e reflow por container queries |
| Auto Play forçava quatro campos e colunas3/4 de botões em painel estreito | Clipping a175/200%; overflow de página a200% na janela780×520 | Duas colunas e status reorganizado quando o painel tem menos de540px |
| Sidebar traduzida podia ficar sem atualização depois da troca de layout | Matriz de antes registrou banner em y24 enquanto a sidebar já estava em y54 | Atualização coalescida e renovação dos alvos observados, inclusive ocultos |
| Coordenadas do documento eram escritas como locais no workspace | Host com body posicionado e margem30px: x233 em vez de203 | Conversão para offsetParent; depois x203 |
| Limite da imagem dividia a largura nativa pelo DPR efetivo | Zoom real200% + escala simulada150%: imagem46px CSS, card inalterado | Layout da imagem em CSS:70px, mesma proporção e recurso original |
| Popup calculava apenas innerHeight e altura fixa | Fórmula não limitava os dois eixos/altura disponível em janela curta | Limites do visualViewport, altura adaptativa e reposicionamento |
| Cascade restaurava duas colunas do resumo mobile da Config | Regra tardia sobrepunha o breakpoint mobile | Regra mobile final coerente; Timing também reflowa pelo painel |
| Limpeza não cancelava o timer de reconciliação | Timer400ms permanecia fora do teardown | Cancelamento e limpeza idempotente verificados |

O Analysis Lab também deixou de impor largura mínima de documento320px e tem limite explícito de altura/rolagem no diálogo. Não foi alterada a lógica de análise/importação. A página raiz mantém o card atual, com quebra de título e limite do botão quando necessário.

## Inventário das superfícies

| Componente | Tratamento e validação |
|---|---|
| Console Core/Visuals/Engine/Auto Play | Grade e reflow; matriz de zoom/window e regressões funcionais |
| Opponent Scout | Layout original preservado; cenas com quatro aberturas, counts e ellipsis |
| Banner do cavalo e título | Arte e limites96/170px preservados; tracking e DPR corrigidos |
| Recent Form | Renderizador original; cenas populadas e ciclos de resize |
| Eval Bar V2 | Motor visual preservado; teste existente de alinhamento, scroll, cache, mate, cancelamento, autorização e desmontagem |
| Setas e destaques | Geometria/cores/opacity0.8 preservadas;256 casos com Komodo real |
| Menu de engine | Limites e reposicionamento corrigidos; teclado, cores e persistência verificados |
| Toast de sessão | CSS e comportamento atuais preservados; aviso existente testado em320×120px CSS sem disparar sessão |
| Disclosures e controle de recuperação | IDs/lógica preservados; modo legado minimizado não ganhou uma nova ação de minimizar |
| External Config | Todos os painéis, Timing, status e resumo mobile; matriz e persistência |
| Página raiz | Card/arte/link; matriz |
| Analysis Lab | Tabuleiro, engine, movimentos, configurações e diálogo de importação; matriz e edição durante resize |
| Color picker e tooltips nativos | Geridos pelo navegador/OS; sem substituição ou promessa de controle do popup nativo |
| Modais do Chess.com | Pertencem ao host; não modificados |

Não foram encontradas coordenadas de arraste/posições personalizadas persistidas para estes painéis. Nenhuma chave foi migrada, removida ou normalizada. localStorage e preferências existentes foram preservados.

## Testes efetivamente executados

- Antes:281 cenários —280 combinações e uma translação. Quatro ocorrências: banner atrasado, dois clippings e um overflow. Zero exceções JavaScript.
- Depois:361 cenários —360 combinações e uma translação. Zero violações verificadas e zero exceções.
- Zoom **nativo do Chrome**:67/75/80/90/100/110/125/150/175/200%. Perfis temporários separados; sem emulação de viewport/DPR para produzir esses resultados.
- Janelas de conteúdo de referência a100%:1280×720,1366×768,1440×900,1920×1080,2560×1440; extras780×520,980×640,640×480,640×240. O JSON registra o viewport CSS realmente medido em cada zoom. Não são resoluções físicas de monitor.
- Quatro superfícies em cada combinação: Config, console em host sintético responsivo, raiz e Analysis Lab real via Vite.
- Zoom dinâmico via configurações nativas do próprio Chrome isolado: seis mudanças em cada uma das duas superfícies, sem reload; mesmos nós e engine preservados. Reload separado confirmou preferência.
- Menus abertos durante resize; diálogo mantém o texto em edição durante resize.200 eventos de resize sem mudança de tamanho produziram zero mutações nos painéis observados.
- Escala de exibição150% foi **simulada**, separadamente do zoom nativo. Não equivale a mover entre monitores físicos. Comparação adicional em DPR3 comprovou imagem46→70px CSS com card preservado.
- Scout/Recent Form: quatro larguras reais medidas1086/1440/780/500 e nove transições por fase, sem deriva. Chrome impôs mínimo de janela500px no pedido320; essa cena não é rotulada como teste real de320px.
- Status60s: zero mutações repetidas, recriação e CLS. Menu:11 larguras, teclado, seleção e persistência. Session Control:14 suites. Backend Config:3 testes. Setas:256 casos com Flask/Komodo reais. Eval Bar: regressão completa aprovada.

A fixture antiga de polimento da Eval Bar gerava100 eventos ao longo de170,4ms, mas afirmava que todos cabiam numa janela de100ms. Somente seu relógio sintético foi corrigido para50ms. Nenhum intervalo de produção nem asserção foi relaxado.

## Limitações e validação manual de hardware

Os testes de console usam o userscript completo em um host local representativo; não uma sessão autenticada do Chess.com com Tampermonkey. Hardware com dois monitores e escalas distintas não está disponível. Não há alegação de teste físico em monitores da casa/escola, navegadores diferentes ou janelas CSS menores que a faixa registrada. Painéis longos usam a rolagem vertical da página intencionalmente.

O bitmap original continua140×280. Acima de DPR efetivo2 o navegador pode interpolar seus pixels; corrigir proporções CSS não cria resolução adicional nem promete nitidez idêntica a um vetor. Nenhuma arte foi redesenhada.

Validação manual complementar:

1. Usar `/config` e uma página de análise/pós-jogo já autorizada pelo aplicativo; conferir a versão2026-10-29.1 instalada.
2. Alternar os dez níveis de zoom nativo e redimensionar com menu/importação abertos; conferir textos, seleção, Tab/Escape e rolagem.
3. Mover a janela entre monitores com escala Windows100/150/200%, sem recarregar. Observar o espaço CSS disponível, não tamanho físico idêntico.
4. Conferir banner ao aparecer/desaparecer sidebar e quando não restam96px laterais; nesses casos ocultar a arte é o comportamento existente.
5. Registrar navegador/versão, zoom, viewport CSS e DPR junto às imagens, usando dados sintéticos e sem tokens/licenças.

## Arquivos e evidências

- `frontend/responsive/`: apresentação, conversão de coordenadas, workspace, banner, observers e cleanup legíveis.
- `frontend/eval_bar/engine-layout.js`: retirada das regras por resolução específica.
- `frontend/external_config/engine-picker.js`, `panel.css`: popover e reflow da Config.
- `frontend/status/index.html`, `analysis_lab/src/styles.css`: limites de página/card/diálogo.
- `scripts/build_analysis_engine.py`, `script.js`: integração e geração determinística.
- `tests/responsive_fixture.py`, `tests/browser/test_responsive_*.mjs`, `tests/test_responsive_lifecycle.js`: testes novos.
- Fixtures/testes existentes: atualização de contrato de layout, isolamento dos relatórios e relógio sintético da Eval Bar.

Relatório visual, matriz CSV/JSON e imagens: [responsive-display](../_bmad-output/implementation-artifacts/responsive-display/REPORT.md).

Nenhuma alteração em autenticação, licenciamento, endpoints, engine runtime, autoplay ou autorização. Sem dependências/frameworks novos e sem push.
