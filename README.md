# Site do Vendedor V4.1

Compatível com `N8N_REPOSICAO_INTELIGENTE_V4.1_CORRIGIDO.json`.

Fluxo: login → uma das 2 lojas → estoque dos 5 produtos → calcular → revisar → confirmar pedido.

Configuração: abra com `?config=1` e informe a Production URL:
`https://SEU-N8N/webhook/reposicao-vendedor`

O site deriva automaticamente `/reposicao-vendedor-calcular` e `/reposicao-vendedor-confirmar`.


V4.5 PRODUÇÃO: já vem apontado para o webhook de produção do n8n. O modo demonstração só é usado se ativado explicitamente (?demo=1 ou botão de demonstração na configuração).
