# Thinker Analysis Lab

MVP local de uma área de análise inspirada no fluxo de trabalho do Lichess. O tabuleiro, a navegação PGN/FEN e o Stockfish rodam no navegador; nenhuma posição é enviada para uma API de análise.

## Executar

Requisitos: Node.js `^20.19.0` ou `>=22.12.0` e um navegador moderno baseado em Chromium ou Firefox.

```powershell
cd analysis_lab
npm install
npm run dev
```

O comando de desenvolvimento copia o JavaScript/WASM do pacote fixado `@lichess-org/stockfish-web`, verifica a rede NNUE oficial por tamanho e SHA-256 e a coloca em `public/engine/`. Essa pasta, `node_modules/` e `dist/` são ignorados pelo Git. O servidor Vite adiciona os cabeçalhos COOP/COEP necessários para `SharedArrayBuffer` e WebAssembly com threads.

Outros comandos:

```powershell
npm test
npm run build
npm run smoke:engine
npm run preview
```

O build inclui `dist/_headers` para hosts estáticos compatíveis com esse formato. Em outros servidores, configure os três cabeçalhos declarados em `public/_headers` para todas as respostas; sem eles, o navegador desativa a engine de forma explícita e mantém o visualizador disponível.

## Arquitetura

```text
interface/main.js
      │
      ├── ChessSession ── valida FEN/PGN e mantém a linha principal
      │
      └── StockfishAdapter ── carrega WASM + NNUE e detecta capacidades
                    │
                    └── UciProtocol ── serializa buscas e interpreta `info`
```

`UciProtocol.compute()` mantém no máximo uma busca ativa. Quando a posição muda, envia `stop`, descarta informações da busca interrompida e só inicia o trabalho mais recente após `bestmove`. Além disso, cada resultado carrega um `searchId`; a interface rejeita qualquer resultado que não corresponda à posição atual.

## O que o Lichess faz atualmente

- O cadastro de engines do Lichess seleciona implementações conforme capacidades do navegador. Em navegadores compatíveis, a opção preferida é o Stockfish 19 com rede pequena de aproximadamente 1 MB; o build maior também fica disponível. Consulte [`engines.ts`](https://github.com/lichess-org/lila/blob/master/ui/lib/src/ceval/engines/engines.ts).
- O adaptador importa dinamicamente o módulo, fornece memória WASM compartilhada, baixa a NNUE, armazena arquivos grandes localmente e conecta a saída ao protocolo. Consulte [`stockfishWebEngine.ts`](https://github.com/lichess-org/lila/blob/master/ui/lib/src/ceval/engines/stockfishWebEngine.ts).
- O protocolo configura `Threads`, `Hash` e `MultiPV`, mantém uma busca ativa, interrompe-a antes da próxima e converte as mensagens UCI em avaliações estruturadas. Consulte [`protocol.ts`](https://github.com/lichess-org/lila/blob/master/ui/lib/src/ceval/protocol.ts).
- O controlador mede desempenho por quantidade de threads, encerra o worker quando outra aba assume a análise e pausa em situações móveis específicas. Consulte [`ctrl.ts`](https://github.com/lichess-org/lila/blob/master/ui/lib/src/ceval/ctrl.ts).
- Os builds oficiais ficam em [`lichess-org/stockfish-web`](https://github.com/lichess-org/stockfish-web). O projeto avisa que o pacote é otimizado para a infraestrutura do Lichess e não é uma integração pronta de uso geral.

O desenho é eficiente porque separa três problemas: execução pesada fora da thread da interface, orçamento explícito de recursos e cancelamento rigoroso de trabalho obsoleto. A força não vem de “profundidade máxima” fixa; ela vem de usar busca iterativa, NNUE, telemetria contínua e um limite previsível de tempo ou nós.

## Limites deste MVP

- Xadrez padrão e linha principal somente; variantes e árvore de variações ficam para uma etapa posterior.
- Promoção feita pelo tabuleiro escolhe dama automaticamente.
- Não há cloud evaluation, cache IndexedDB/OPFS, tablebases, acurácia ou classificação de erros.
- O build local usa o Stockfish 19 smallnet para reduzir download e memória. A troca para o build de rede grande deve ser uma decisão explícita de produto.

## Licenças

O código do laboratório é parte do Thinker Chess. Stockfish e `@lichess-org/stockfish-web` possuem licenças próprias de software livre. O build inclui `THIRD_PARTY_NOTICES.txt` junto dos assets, com licença, versão, origem e hash da NNUE; qualquer distribuição pública deve preservar esse aviso e cumprir os termos aplicáveis. Os binários preparados localmente não são versionados neste repositório.
