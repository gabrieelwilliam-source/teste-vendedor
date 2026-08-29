# Site do Vendedor — estoque → planilha → sugestão

Fluxo do vendedor:
1. Digita o código de 6 números.
2. Escolhe uma das 2 lojas liberadas para ele.
3. Digita o estoque atual dos 5 produtos.
4. Toca em **SALVAR ESTOQUE E CALCULAR PEDIDO**.
5. O site envia os dados ao n8n, que atualiza a planilha e devolve a sugestão de pedido.

## Configuração
Abra o site com `?config=1`, por exemplo:
`https://seusite.com/?config=1`

Cole somente a Production URL do webhook GET:
`https://SEU-N8N/webhook/reposicao-vendedor`

O site deriva automaticamente o endpoint POST:
`https://SEU-N8N/webhook/reposicao-vendedor-atualizar`

## Importante
O POST é enviado como `text/plain` contendo JSON para evitar problemas de CORS/preflight em hospedagens estáticas como GitHub Pages.
