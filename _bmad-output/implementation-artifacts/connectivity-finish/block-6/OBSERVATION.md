# Aviso do Auto Play — somente observação

Seletor: #kb-session-target-help. Computado: cor rgb(154,183,163) / #9AB7A3, font-size11px, font-weight400, line-height16px, margin8px0. O hint de Timing usa #AAABA5, também11px/400/16px, margin-top8px. Portanto não há tamanho maior na fonte atual medida; há uma diferença cromática.

A cor vem da classe compartilhada .kb-session-queue-note no CSS do console. O acabamento anterior aumentou a fonte dessa classe para11px por acessibilidade, preservando sua cor verde. Não existe leitura de Arrow Color nessa regra.

Valores efetivamente salvos e exibidos nesta medição: Min Wins53, Max Wins61. A frase descreve os defaults nulos do schema, mas continua pedindo configuração mesmo quando ambos já estão preenchidos; essa instrução é redundante/mal contextualizada nesse estado.

Trecho mantido no menuHtml de script.js:

    <div id="kb-session-target-help" class="kb-session-queue-note">Win-rate targets are not set by default. Configure both before starting. Win Rate is calculated from recorded results.</div>

Proposta NÃO aplicada: usar no aviso a mesma cor neutra #AAABA5 do Timing, mantendo11px/16px e espaçamento8px. Nenhuma mudança de copy e nenhum ocultamento são propostos nesta tarefa. Alterar a cor continua dependendo de autorização.
