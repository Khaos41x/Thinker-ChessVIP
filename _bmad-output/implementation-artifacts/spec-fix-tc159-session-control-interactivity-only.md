# Fix Spec — TC159 Session Control Interactivity Only

## Baseline imutável

- Referência: `C:\Users\2ln0g0tt7bkehifl\Desktop\TC159-2026-10-08.4.txt`
- SHA256: `CCB32E15C78D1DB1494B537B5F039E86227AB4F8EFCE2A03513E39620BE090D4`
- O `script.js` do commit `78be0ad` tem o mesmo conteúdo funcional da referência. A única diferença atual é `@name TC157` no lugar de `@name TC159`.
- HTML, CSS, seletores, dimensões, posição, montagem no DOM, Scout, banner e fluxo de layout são invariantes e não podem ser alterados.

## Diagnóstico

1. Os handlers do Session Control são conectados diretamente com `$(selector).on(...)` apenas durante o primeiro `createMenu()`.
2. Não existe um ciclo de vida próprio para reconectar handlers quando o SPA substitui nós ou quando a montagem é recuperada.
3. Não existe estado de rascunho para `Duration`, `Min win %` e `Max win %`; a UI não tem uma fronteira explícita entre edição e configuração validada.
4. `updateSessionPanel()` aplica o atributo nativo `disabled` ao `START` quando o rollout está `DISABLED` e ao `DRAIN` enquanto a fase é terminal. Um botão nativamente desabilitado não emite `click`, impedindo diagnóstico e feedback pelo handler.
5. A suíte da Fase 4 testa reducer, controller, persistência e build, mas não testa foco, edição dos campos, conexão dos handlers ou duplicidade de comandos.

## Correção proposta

### 1. Presenter comportamental isolado

Criar `frontend/session_control/ui.js` sem CSS e sem criação ou movimentação de DOM. O módulo recebe o painel já existente, lê os controles pelos IDs atuais e atualiza somente propriedades e textos existentes.

### 2. Draft State

Manter em memória os textos digitados nos três campos. Eventos `input` atualizam o draft sem disparar comandos. A configuração é validada somente no clique em `START`. Uma atualização periódica de status não escreve nesses campos e não remove foco ou seleção.

### 3. Binding idempotente

Usar delegação de eventos no `#kb-session-panel`. Cada montagem aborta o `AbortController` anterior antes de registrar o novo listener. O binding pode ser chamado repetidamente pelo reconciliador sem duplicar comandos.

### 4. Botões observáveis

Não usar `disabled` como transporte de estado operacional. Usar `aria-disabled`, `data-disabled-reason` e estilo já existente apenas quando compatível, mantendo o evento de clique observável. O handler retorna o motivo atual no campo `#kb-session-warning` quando a operação não puder prosseguir.

O comando válido continua passando pelo `sessionControlBridge`; reducer, rollout e regras transacionais permanecem como fonte de verdade.

### 5. Integração mínima

- Adicionar `ui` à região gerada pelo `scripts/build_userscript.py`.
- Substituir somente o bloco atual de binding dos três botões e a leitura direta dos três campos pela chamada ao presenter.
- Reexecutar o binding depois que o painel existir e durante reconciliação, sem tocar na lógica de montagem.

## Proibições

- Nenhuma alteração em `menuHtml`.
- Nenhuma alteração no bloco CSS injetado.
- Nenhuma alteração em `getThinkerMountHost()`, `OpponentIntel.ensureScoutWrapper()`, `reconcileThinkerUiShells()` ou `updateWorkspaceLayout()`.
- Nenhuma regra de `position`, `display`, `z-index`, `isolation`, `pointer-events`, margem, tamanho ou overflow.
- Nenhuma mudança no DOM pai, ordem dos painéis, banner ou Scout.

## Testes herméticos

1. Campo numérico recebe foco e preserva o valor digitado durante atualizações de status.
2. `input` atualiza somente o draft.
3. Um clique em `START` despacha exatamente um comando após múltiplos bindings.
4. Um clique em `DRAIN` despacha exatamente um comando após múltiplos bindings.
5. Estado indisponível produz aviso visível e telemetria sem perder o clique.
6. Substituição do painel aborta listeners antigos e conecta os novos.
7. Teste estático compara os blocos `css`, `menuHtml`, montagem e layout com a referência TC159 e falha diante de qualquer diferença.
8. `node tests/session_control/run.js` e `python scripts/build_userscript.py --check` devem passar sem rede ou binários externos.

## Critério de aceite

- Aparência e posição exatamente iguais ao TC159 de referência.
- Os três campos aceitam foco e edição.
- START, DRAIN e exportação sempre geram um resultado observável.
- Nenhum comando é disparado em duplicidade.
- O diff de produção contém apenas o presenter, sua integração comportamental e o bundle determinístico correspondente.

