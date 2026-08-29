window.DEMO_SELLER_USERS = [
  {vendedor:"Vendedor 01",codigo:"481201",lojas:["Loja 01","Loja 02"]},
  {vendedor:"Vendedor 02",codigo:"593814",lojas:["Loja 03","Loja 04"]},
  {vendedor:"Vendedor 03",codigo:"726405",lojas:["Loja 05","Loja 06"]},
  {vendedor:"Vendedor 04",codigo:"318672",lojas:["Loja 07","Loja 08"]},
  {vendedor:"Vendedor 05",codigo:"845391",lojas:["Loja 09","Loja 10"]},
  {vendedor:"Vendedor 06",codigo:"267954",lojas:["Loja 11","Loja 12"]},
  {vendedor:"Vendedor 07",codigo:"914628",lojas:["Loja 13","Loja 14"]},
  {vendedor:"Vendedor 08",codigo:"652173",lojas:["Loja 15","Loja 16"]},
  {vendedor:"Vendedor 09",codigo:"437860",lojas:["Loja 17","Loja 18"]},
  {vendedor:"Vendedor 10",codigo:"785246",lojas:["Loja 19","Loja 20"]}
];

window.DEMO_SELLER_ROWS = (() => {
  const products = [
    { nome:"Pão sovado", ideal:150 },
    { nome:"Pão de Sanduiche", ideal:110 },
    { nome:"Pão de HOT DOG", ideal:130 },
    { nome:"Pão de Hamburguer", ideal:120 },
    { nome:"Pão Caseiro", ideal:90 }
  ];
  const rows = [];
  for (let store = 1; store <= 20; store++) {
    products.forEach((p, idx) => {
      const estoqueAtual = 12 + ((store * 11 + (idx + 1) * 17) % 68);
      const estoqueIdeal = p.ideal + ((store % 4) * 5);
      rows.push({
        cliente:`Loja ${String(store).padStart(2,'0')}`,
        produto:p.nome,
        estoqueAtual,
        estoqueIdeal,
        sugestao:Math.max(estoqueIdeal - estoqueAtual, 0),
        atualizadoEm:"DADOS DE TESTE"
      });
    });
  }
  return rows;
})();
