# Tela do Vendedor — Reposição Simples

Interface propositalmente simples para vendedores: **Loja → Produto → Estoque atual → Pedido sugerido**.

## Para testar
Abra `index.html`. O site inicia em modo demonstração.

## Para conectar ao mesmo n8n do dashboard do gestor
O site usa o mesmo formato JSON do workflow `N8N_DASHBOARD_REPOSICAO_GOOGLE_SHEETS.json`.

1. Deixe o workflow do n8n ativo.
2. Abra o site acrescentando `?config=1` ao endereço. Exemplo local: `index.html?config=1`.
3. Clique em **Configurar** no rodapé.
4. Cole a Production URL do webhook.
5. Clique em **Salvar e testar**.

Depois disso, abra normalmente sem `?config=1`. O botão de configuração fica escondido para o vendedor.

## Comportamento
- A lista de lojas e produtos vem automaticamente da API.
- Para cada combinação, o site usa o registro mais recente (ex.: maior número de `Semana`).
- Valores são exibidos arredondados em unidades inteiras.
- Atualiza automaticamente a cada 60 segundos e também pelo botão ↻.

## Atalho por loja/produto
Também é possível pré-selecionar uma loja e produto na URL:
`index.html?cliente=Nome%20da%20Loja&produto=Nome%20do%20Produto`

Isso pode ser usado futuramente para criar um link ou QR Code por loja.
