# Bloco 0 — conexão e inicialização

O processo 27972 estava vivo, com um Komodo filho, mas sem qualquer listener TCP 5050. A entrada UDP 1936 não ocupa uma porta TCP. IPv4 e localhost/IPv6 falharam por curl.exe, portanto não era exclusivamente o navegador. Proxy WinHTTP direto, ProxyEnable=0 e nenhuma flag explícita de proxy nos processos Chrome consultados. As regras Python encontradas eram Allow/Inbound/Domain; nenhum firewall/proxy/antivírus foi desativado ou modificado.

`app.py` usava bind literal 127.0.0.1, porta 5050, sem variável de ambiente, sem reloader, no thread principal. O texto Rodando era impresso antes de app.run. O warmup do Komodo não comprova HTTP disponível. Uma nova inicialização padrão respondeu em 2.511s, /config 200 em IPv4 e localhost e /health ready=true; Chromium também acessou a Config e operou o registry real. Não foi encontrado outro listener TCP na captura inicial.

O mecanismo de falso sucesso foi reproduzido em porta efêmera ocupada: o código antigo imprime Rodando, falha no bind e continua como processo vivo. O stack mostrou o principal em threading._shutdown esperando a thread UCI em asyncio/windows_events. A causa exata do primeiro erro de bind do PID original não está disponível no seu log; não se afirma que esse PID sofreu a mesma colisão. A ausência de listener, a impressão prematura e a retenção do processo após falha são fatos distintos registrados.

Correção pequena: reservar exclusivamente o socket antes do warmup; anunciar Rodando somente depois do bind; fechar recursos no encerramento/falha. Porta ocupada agora termina com erro antes de iniciar Komodo e sem anunciar sucesso. Continua em 127.0.0.1:5050, com o mesmo servidor threaded Werkzeug, rotas e autorização.

Os testes sobem o app real em porta efêmera, exigem conexão TCP quando a linha Rodando aparece, /config 200, /health ready e registry com três engines. Um segundo processo na mesma porta precisa sair sem sucesso falso nem warmup. Tempo observado entre Rodando e /config está em startup-test.json; o socket já deve existir antes da mensagem, não apenas depois de um sleep.

## Saídas brutas

- initial-listeners-curl.txt: primeira captura.
- process-startup-proxy.txt: processo vivo, startup e proxy.
- firewall-server-internals.txt: regras e código da biblioteca que abre o servidor.
- failed-bind-before.txt: falha reproduzida e stack.
- startup-probe.txt: porta efêmera aberta imediatamente.
- restart-curl-health.txt: novo app padrão, headers e resultados curl.
- startup-test.json: regressão real, sem token de produção.

## Engines e capability

Komodo do servidor alimenta /getmove e o melhor lance das setas. O seletor Stockfish/Komodo alimenta a análise da Eval Bar; ele não substitui silenciosamente /getmove. O token é gerado por secrets.token_urlsafe(32) somente se não há arquivo/configuração existente. O arquivo em LOCALAPPDATA/ThinkerChessVIP/capability.json é reutilizado nos reinícios. A variável THINKER_CAPABILITY_TOKEN pode definir explicitamente outro token; rotação é operação separada. O userscript usa GM_getValue/GM_setValue em thinkerEngineCapability, envia Bearer e remove o valor em resposta 401. Não lê diretamente o arquivo do Windows. Token antigo resulta em HTTP 401 (invalid_capability), não em ERR_CONNECTION_REFUSED. Cannot reach analysis engine corresponde ao callback de falha de transporte; diagnóstico de autenticação deve considerar o status/response real. @connect já inclui localhost e 127.0.0.1.

Tokens reais não foram incluídos nas evidências. A única redação nas saídas de startup é o valor secreto de capability.
