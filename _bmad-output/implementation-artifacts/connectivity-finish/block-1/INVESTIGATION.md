# Analysis e setas — investigação e regressões

## Causa confirmada e limites

A captura inicial mostrou recusas reais em IPv4 e localhost e nenhum listener TCP. O Error/Cannot reach analysis engine é o caminho onerror do transporte, antes de existir resposta de registry. A falta de estado explica o select inicialmente vazio. Não é evidência de NNUE ausente, worker quebrado ou engine fraco. Após o conserto do Bloco0, a requisição protegida real de lista retornou200 com três engines e a Config real operou as três opções por teclado/reload sem heartbeat.

@connect já inclui localhost e127.0.0.1. O token correto retorna200, token ausente401/capability_required e token antigo401/invalid_capability; status, headers CORS e body estão em http-responses.json. Nenhum segredo foi registrado. O erro de transporte não se corrige trocando engine ou token às cegas. Nenhuma autorização, CORS, origem permitida ou controle de contexto foi relaxado.

A versão efetiva no Tampermonkey não pode ser deduzida do print. A observação real de /config/status registrou userscriptVersion=null e userscriptConnected=false, embora sessionConnected=true. Esse resultado é preservado em installed-version-observation.json; não é apresentado como prova de versão igual. A fixture usa a fonte atual do repositório. A atualização/reload da aba autenticada ainda depende do acesso de automação a essa aba, não de executar um comando manual.

## Histórico

Comparação read-only de sete checkpoints desde e1e705d, incluindo3a503f6, b9624eb,1926bde,c8ba23f e37b878f: geometria da seta idêntica; /getmove e chamada de desenho presentes. e1e705d fixou azul e0.8; fc115d2 religou Arrow Color sem alterar a geometria;37b878f tornou a migração única e preservou verde escolhido depois. Verde válido não zera fill nem opacidade; inválidos recebem fallback azul ou falham na validação do save.

Não foi identificado commit que introduziu a recusa de conexão; ela foi medida no socket do processo, e a inicialização prematura antecede o engine selector (61f2029). A comparação de código não é falsamente chamada de bisect executado em Chess.com autenticado. A linha Retry sem reserva foi introduzida em b9624eb e explica o crescimento de altura tratado no Bloco2. A margem entre controles aparece no agrupamento c8ba23f e nos6px de2898896, corrigidos no Bloco3.

Também foi executada a mesma prova HTTP/browser em seis versões históricas do controller (3a503f6 até 1985a33), sem checkout destrutivo: todas descobriram três opções com servidor disponível, mostraram erro sob transporte bloqueado e recuperaram. Veja controller-history/matrix.json. Isso isola a conexão; não constitui bisect completo da aplicação autenticada.

## Cadeia real de recomendação

/getmove continua usando Komodo, independente do seletor de análise. O teste integrado executa request_move real e a rota Flask real com Komodo:256 combinações de Bot/Auto Moves/Eval Bar/Banner/Recent Form/Smart Pacing, lado e orientação, além de turno oposto, troca de posição e reload. Uma resposta válida desenha a seta no ramo de recomendação. Bot desligado ou turno não autorizado não fazem pedido; Auto Moves ligado remove a seta e segue o agendamento existente. O teste registra o agendamento sem mover peças. No print recebido, Bot está desligado e o Scout espera adversário; não se deve inventar um melhor lance nesse estado.

O relatório pipeline/report.json registra requests, lances UCI reais, geração do processo, telemetria, erros da página e DOM. SVG fica dentro do tabuleiro, com rect não nulo, layer11, pointer-events:none e fill-opacity0.8. As screenshots pipeline-white.png e pipeline-black.png são de Chromium local com engine real.

O teste adicional arrow-ui/ carrega o userscript completo com seus painéis e verifica display, visibility, layer, container correto, bounds e interseções com banner/Scout/Recent Form existentes na fixture. Swatch das duas superfícies atualiza a seta imediatamente e não muda cores dos demais componentes. .myhigh continua com borda#10B981, fundo rgba(16,185,129,.15), sombra rgba(16,185,129,.2)0px4px12px. Esses são os valores antes/depois com o antigo padrão salvo; não há ligação remanescente com o swatch.

Os três engines foram revalidados de verdade nesta conferência: inicialização, hashes completos/NNUE carregado, posições cp/mate, sequência Smallnet→Full→Komodo→Smallnet, cancelamento, recuperação, preferência e limpeza. Evidência real-engine-benchmark.json. Nenhum pacote ou NNUE foi reinstalado/baixado.

## Copy vetada e validação nativa

Não existe placeholder inicial de erro na fonte. Foi proposto Engine unavailable, mas o usuário respondeu para manter a copy e apenas reportar; ele NÃO foi adicionado. Em erro após descoberta, os nomes conhecidos ficam visíveis no select desabilitado. Quando o servidor está disponível e a autenticação é válida, a regressão exige três opções.

Toda a evidência de DOM, camadas, eventos e screenshots desta pasta é Chromium local/fixture. As requisições live usam o servidor de uso, mas não comprovam o DOM da aba Chess.com nem a versão do Tampermonkey. A conferência autenticada será declarada separadamente, sem confundir essas evidências.
