---
title: Corrigir injeção do userscript na navegação SPA do Chess.com
status: done
route: one-shot
date: 2026-09-20
---

# Intent

Garantir que o Tampermonkey carregue o Thinker Chess mesmo quando o usuário abre outra página do Chess.com e navega internamente para `/play/online`, sem recarregamento completo. O painel de configuração, o Scout e o banner devem ser montados uma única vez quando uma rota compatível ou o tabuleiro estiver disponível.

## Implementação

- Cobertura de metadados ampliada para todo o domínio do Chess.com, com bloqueio de frames.
- Inicialização funcional mantida restrita às rotas de jogo e puzzle ou à presença real do host do tabuleiro.
- Observador leve de rota encerra-se assim que a aplicação inicia.
- Proteção idempotente impede timers, painéis e listeners duplicados.
- Polling do servidor e loops funcionais passam a iniciar somente depois da ativação válida.

## Validação

- Sintaxe integral do userscript validada pelo Node.js.
- Testes de Scout, cache, endpoint, concorrência, layout e marcadores do bootstrap aprovados.
- Execução integral em Chrome headless confirmou painel, Scout e banner montados e banner visível.
- Nenhum erro JavaScript fatal encontrado durante a montagem.

# Suggested Review Order

1. Metadados `@match` e `@noframes` no cabeçalho de `script.js`.
2. Funções `isThinkerSupportedRoute`, `maybeStartThinkerUserscript` e `installThinkerRouteBootstrap`.
3. Guarda idempotente em `startThinkerUserscript`.
4. Regressões em `tests/test_scout_logic.js` e fixture de navegador.
