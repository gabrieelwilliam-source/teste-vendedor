(()=>{
  const $=s=>document.querySelector(s);
  const els={
    loginView:$('#loginView'),mainView:$('#mainView'),loginForm:$('#loginForm'),accessCode:$('#accessCode'),loginMessage:$('#loginMessage'),
    sellerName:$('#sellerName'),logout:$('#logoutBtn'),client:$('#clientSelect'),countView:$('#countView'),products:$('#productsList'),stockForm:$('#stockForm'),
    countMessage:$('#countMessage'),calculateBtn:$('#calculateBtn'),reviewView:$('#reviewView'),reviewList:$('#reviewList'),suggestedTotal:$('#suggestedTotal'),
    confirmedTotal:$('#confirmedTotal'),deviationTotal:$('#deviationTotal'),deviationBox:$('#deviationBox'),confirmMessage:$('#confirmMessage'),
    backToCount:$('#backToCount'),confirmBtn:$('#confirmOrderBtn'),successView:$('#successView'),protocol:$('#protocolValue'),newVisit:$('#newVisitBtn'),
    updated:$('#updatedAt'),refresh:$('#refreshBtn'),notice:$('#demoNotice'),adminOpen:$('#adminOpen'),adminOpenLogin:$('#adminOpenLogin'),modal:$('#adminModal'),
    apiUrl:$('#apiUrl'),testMessage:$('#testMessage'),adminClose:$('#adminClose'),saveConfig:$('#saveConfig'),clearConfig:$('#clearConfig')
  };
  const PRODUCTS=['Pão sovado','Pão de Sanduiche','Pão de HOT DOG','Pão de Hamburguer','Pão Caseiro'];
  const DEMO=window.REPOSICAO_DEMO_DATA||{sellers:[],state:[],history:[]};
  let session=null, stateRows=[], calculated=[], visitId='';
  const clean=v=>String(v??'').trim();
  const n=v=>Number(String(v??0).replace(',','.'))||0;
  const fmt=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(Math.max(0,Math.round(n(v))));
  const esc=v=>clean(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const DEFAULT_API_URL='https://app.vps7376.panel.icontainer.cloud/webhook/reposicao-vendedor';
  const forceDemo=()=>new URLSearchParams(location.search).get('demo')==='1'||localStorage.getItem('reposicao_v4_force_demo')==='1';
  const url=()=>forceDemo()?'':(localStorage.getItem('reposicao_v4_seller_url')||DEFAULT_API_URL);
  const code=()=>localStorage.getItem('reposicao_v4_code')||'';
  const isConfig=()=>new URLSearchParams(location.search).get('config')==='1';
  if(isConfig()){els.adminOpen.classList.remove('hidden');els.adminOpenLogin.classList.remove('hidden')}

  function endpoint(kind){
    const base=url(); if(!base)return '';
    try{
      const u=new URL(base), p=u.pathname.replace(/\/+$/,'');
      if(kind==='calcular')u.pathname=p.replace(/\/reposicao-vendedor$/,'/reposicao-vendedor-calcular');
      if(kind==='confirmar')u.pathname=p.replace(/\/reposicao-vendedor$/,'/reposicao-vendedor-confirmar');
      return u.toString();
    }catch{
      return base.replace(/\/+$/,'').replace(/\/reposicao-vendedor$/,kind==='calcular'?'/reposicao-vendedor-calcular':'/reposicao-vendedor-confirmar');
    }
  }
  async function jsonResponse(res){const text=await res.text();if(!text.trim())throw new Error(`Servidor sem resposta (HTTP ${res.status}).`);let obj;try{obj=JSON.parse(text)}catch{throw new Error(`Resposta inválida do servidor (HTTP ${res.status}).`)}return obj}
  function normalizeState(rows){return (Array.isArray(rows)?rows:[]).map(r=>({
    chave:clean(r.chave??r.Chave), vendedor:clean(r.vendedor??r.Vendedor), cliente:clean(r.cliente??r.Cliente), produto:clean(r.produto??r.Produto),
    estoqueAtual:n(r.estoqueAtual??r['Estoque Atual']), estoqueIdeal:n(r.estoqueIdeal??r['Estoque Ideal']), sugestao:n(r.sugestao??r['Sugestão Reposição']),
    ultimoPedido:n(r.ultimoPedido??r['Último Pedido Confirmado']), vendaEstimada:n(r.vendaEstimada??r['Venda Estimada Último Ciclo']), trocas:n(r.trocas??r['Trocas Último Ciclo']),
    atualizadoEm:clean(r.atualizadoEm??r['Última Atualização']??r['Atualizado em'])
  })).filter(r=>r.cliente&&r.produto)}
  function demoLogin(c){
    const s=DEMO.sellers.find(x=>String(x.codigo)===c&&x.ativo!==false); if(!s)return null;
    return {ok:true,vendedor:s.vendedor,lojas:s.lojas,rows:DEMO.state.filter(r=>s.lojas.includes(r.cliente)),updatedAt:new Date().toISOString(),demo:true};
  }
  async function login(c,quiet=false){
    c=clean(c).replace(/\D/g,'');
    if(c.length!==6){if(!quiet)els.loginMessage.textContent='Digite os 6 números do seu código.';return false}
    if(!quiet)els.loginMessage.textContent='Entrando...';
    try{
      let data;
      if(!url()) data=demoLogin(c);
      else{
        const sep=url().includes('?')?'&':'?';
        const res=await fetch(`${url()}${sep}codigo=${encodeURIComponent(c)}`,{headers:{Accept:'application/json'},cache:'no-store'});
        data=await jsonResponse(res); if(!res.ok||data.ok===false)throw new Error(data.error||'Acesso não autorizado.');
      }
      if(!data)throw new Error('Código não encontrado.');
      session={codigo:c,vendedor:data.vendedor||'Vendedor',lojas:data.lojas||[]}; stateRows=normalizeState(data.rows||[]);
      if(!stateRows.length)throw new Error('Nenhum produto cadastrado para suas lojas.');
      localStorage.setItem('reposicao_v4_code',c); renderLoggedIn(data.demo||!url(),data.updatedAt); return true;
    }catch(e){if(!quiet)els.loginMessage.textContent=e.message||'Não foi possível entrar.';return false}
  }
  function renderLoggedIn(demo,updatedAt){
    els.loginView.classList.add('hidden');els.mainView.classList.remove('hidden');els.refresh.classList.remove('hidden');els.sellerName.textContent=session.vendedor;
    els.notice.classList.toggle('hidden',!demo); els.client.innerHTML=session.lojas.filter(l=>stateRows.some(r=>r.cliente===l)).map(l=>`<option>${esc(l)}</option>`).join('');
    els.updated.textContent=`Dados carregados: ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(updatedAt||Date.now()))}`;
    startVisit();
  }
  function startVisit(){calculated=[];visitId='';els.reviewView.classList.add('hidden');els.successView.classList.add('hidden');els.countView.classList.remove('hidden');renderCount();window.scrollTo({top:0,behavior:'smooth'})}
  function storeRows(){return stateRows.filter(r=>r.cliente===els.client.value).sort((a,b)=>PRODUCTS.indexOf(a.produto)-PRODUCTS.indexOf(b.produto))}
  function renderCount(){
    els.countMessage.textContent=''; const rows=storeRows();
    els.products.innerHTML=rows.map((r,i)=>`<article class="product-card">
      <div class="product-top"><h3>${esc(r.produto)}</h3><div class="last-data">Último estoque: <strong>${fmt(r.estoqueAtual)}</strong><br>Último pedido: <strong>${fmt(r.ultimoPedido)}</strong></div></div>
      <label class="stock-box"><span>ESTOQUE NA LOJA AGORA</span><div class="stock-line"><input class="stock-input" data-product="${esc(r.produto)}" type="number" min="0" step="1" inputmode="numeric" placeholder="0" required><small>unidades</small></div></label>
    </article>`).join('');
  }
  function collectCount(){
    const items=[]; for(const input of els.products.querySelectorAll('.stock-input')){
      const raw=clean(input.value), val=Number(raw); input.classList.remove('input-error');
      if(raw===''||!Number.isInteger(val)||val<0||val>99999){input.classList.add('input-error');input.focus();throw new Error('Preencha o estoque dos 5 produtos com números inteiros.');}
      items.push({produto:input.dataset.product,estoqueAtual:val});
    }
    if(items.length!==5)throw new Error('Os 5 produtos precisam estar cadastrados nesta loja.'); return items;
  }
  function demoCalculate(loja,items){
    visitId=`DEMO-${Date.now()}`;
    const rows=items.map(it=>{
      const base=stateRows.find(r=>r.cliente===loja&&r.produto===it.produto); const prev=base.estoqueAtual, prevOrder=base.ultimoPedido;
      const venda=Math.max(0,Math.round(prev+prevOrder-it.estoqueAtual)); const sug=Math.max(0,Math.round(base.estoqueIdeal-it.estoqueAtual));
      base.estoqueAtual=it.estoqueAtual;base.vendaEstimada=venda;base.sugestao=sug;base.atualizadoEm=new Date().toISOString();
      return {...base,estoqueAnterior:prev,pedidoAnterior:prevOrder,vendaEstimada:venda,sugestao:sug,visitId};
    });
    return {ok:true,visitId,rows,updatedAt:new Date().toISOString()};
  }
  async function calculate(e){
    e.preventDefault(); els.countMessage.textContent=''; let items; try{items=collectCount()}catch(err){els.countMessage.textContent=err.message;return}
    els.calculateBtn.disabled=true;els.calculateBtn.textContent='CALCULANDO...';
    try{
      let data;
      if(!url()) data=demoCalculate(els.client.value,items);
      else{
        const res=await fetch(endpoint('calcular'),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','Accept':'application/json'},body:JSON.stringify({codigo:session.codigo,loja:els.client.value,itens:items}),cache:'no-store'});
        data=await jsonResponse(res); if(!res.ok||data.ok===false)throw new Error(data.error||'Não foi possível calcular.');
      }
      visitId=data.visitId||`VIS-${Date.now()}`;calculated=normalizeState(data.rows).map(r=>({...r,visitId}));
      renderReview();
    }catch(e){els.countMessage.textContent=e.message||'Erro ao calcular o pedido.'}
    finally{els.calculateBtn.disabled=false;els.calculateBtn.textContent='CALCULAR PEDIDO'}
  }
  function renderReview(){
    els.countView.classList.add('hidden');els.successView.classList.add('hidden');els.reviewView.classList.remove('hidden');
    els.reviewList.innerHTML=calculated.map(r=>`<article class="review-card" data-product="${esc(r.produto)}">
      <div class="review-card-head"><div><h3>${esc(r.produto)}</h3><div class="review-meta">Estoque contado: <b>${fmt(r.estoqueAtual)}</b> · Venda estimada desde a última visita: <b>${fmt(r.vendaEstimada)}</b></div></div></div>
      <div class="recommended"><span>PEDIDO RECOMENDADO</span><strong>${r.sugestao>0?fmt(r.sugestao):'NÃO PEDIR'}</strong></div>
      <div class="order-edit"><label>PEDIDO QUE VOU FAZER</label><div class="order-row"><input class="order-input" type="number" min="0" step="1" inputmode="numeric" value="${Math.round(r.sugestao)}" data-suggestion="${Math.round(r.sugestao)}" data-product="${esc(r.produto)}"><span class="delta-pill ok">Igual à sugestão</span></div></div>
    </article>`).join('');
    els.reviewList.querySelectorAll('.order-input').forEach(i=>i.addEventListener('input',updateReviewTotals)); updateReviewTotals();window.scrollTo({top:0,behavior:'smooth'});
  }
  function updateReviewTotals(){
    let suggested=0,confirmed=0;
    els.reviewList.querySelectorAll('.order-input').forEach(input=>{
      const s=n(input.dataset.suggestion),v=Math.max(0,Math.round(n(input.value))); suggested+=s;confirmed+=v;const d=v-s,pill=input.closest('.order-row').querySelector('.delta-pill');
      pill.className='delta-pill '+(Math.abs(d)<=Math.max(3,s*.05)?'ok':d>Math.max(8,s*.15)?'high':'warn');
      pill.textContent=d===0?'Igual à sugestão':`${d>0?'+':''}${fmt(d)} vs. sugestão`;
    });
    const diff=confirmed-suggested;els.suggestedTotal.textContent=fmt(suggested);els.confirmedTotal.textContent=fmt(confirmed);els.deviationTotal.textContent=`${diff>0?'+':''}${fmt(diff)}`;
    els.deviationBox.className='deviation '+(Math.abs(diff)<=Math.max(5,suggested*.05)?'ok':diff>Math.max(15,suggested*.15)?'high':'warn');
  }
  function collectOrder(){
    const items=[]; for(const input of els.reviewList.querySelectorAll('.order-input')){
      const v=Number(clean(input.value)); if(!Number.isInteger(v)||v<0||v>99999){input.focus();throw new Error('Confira as quantidades do pedido.');}
      const base=calculated.find(r=>r.produto===input.dataset.product);items.push({produto:base.produto,estoqueAtual:Math.round(base.estoqueAtual),sugestao:Math.round(base.sugestao),pedidoConfirmado:v,vendaEstimada:Math.round(base.vendaEstimada||0),trocas:Math.round(base.trocas||0)});
    } return items;
  }
  function demoConfirm(loja,items){
    const dt=new Date(),cycle=`${dt.toISOString().slice(0,10).replace(/-/g,'')}-${loja.replace(/\D/g,'')||'00'}-${Date.now().toString().slice(-5)}`;
    items.forEach(it=>{
      const st=DEMO.state.find(r=>r.cliente===loja&&r.produto===it.produto); if(st){st.estoqueAtual=it.estoqueAtual;st.sugestao=it.sugestao;st.ultimoPedido=it.pedidoConfirmado;st.vendaEstimada=it.vendaEstimada;st.atualizadoEm=dt.toISOString();st.ultimaVisita=dt.toISOString();}
      const diff=it.pedidoConfirmado-it.sugestao,adh=it.sugestao===0&&it.pedidoConfirmado===0?1:Math.max(0,1-Math.abs(diff)/Math.max(it.sugestao,1));
      DEMO.history.push({id:`${cycle}-${it.produto}`,dataHora:dt.toISOString(),data:dt.toISOString().slice(0,10),vendedor:session.vendedor,codigo:session.codigo,cliente:loja,produto:it.produto,estoqueContado:it.estoqueAtual,vendaEstimada:it.vendaEstimada,estoqueIdeal:(stateRows.find(r=>r.cliente===loja&&r.produto===it.produto)||{}).estoqueIdeal||0,sugestao:it.sugestao,pedidoConfirmado:it.pedidoConfirmado,diferencaPedido:diff,aderencia:adh,excessoPotencial:Math.max(0,diff),trocas:it.trocas||0,taxaTrocas:0,status:Math.abs(diff)<=Math.max(5,it.sugestao*.15)?'ALINHADO':diff>0?'ACIMA':'ABAIXO',origem:'SITE',cicloId:cycle});
    });
    return {ok:true,protocol:cycle,updatedAt:dt.toISOString()};
  }
  async function confirmOrder(){
    els.confirmMessage.textContent=''; let items;try{items=collectOrder()}catch(e){els.confirmMessage.textContent=e.message;return}
    els.confirmBtn.disabled=true;els.confirmBtn.textContent='CONFIRMANDO...';
    try{
      let data;
      if(!url())data=demoConfirm(els.client.value,items);
      else{
        const res=await fetch(endpoint('confirmar'),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','Accept':'application/json'},body:JSON.stringify({codigo:session.codigo,loja:els.client.value,visitId,itens:items}),cache:'no-store'});
        data=await jsonResponse(res);if(!res.ok||data.ok===false)throw new Error(data.error||'Não foi possível confirmar o pedido.');
      }
      items.forEach(it=>{const r=stateRows.find(x=>x.cliente===els.client.value&&x.produto===it.produto);if(r){r.estoqueAtual=it.estoqueAtual;r.sugestao=it.sugestao;r.ultimoPedido=it.pedidoConfirmado;r.vendaEstimada=it.vendaEstimada;r.atualizadoEm=data.updatedAt||new Date().toISOString()}});
      els.reviewView.classList.add('hidden');els.successView.classList.remove('hidden');els.protocol.textContent=data.protocol||visitId||'REGISTRADO';window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){els.confirmMessage.textContent=e.message||'Erro ao confirmar o pedido.'}
    finally{els.confirmBtn.disabled=false;els.confirmBtn.textContent='CONFIRMAR PEDIDO'}
  }
  function logout(){localStorage.removeItem('reposicao_v4_code');session=null;stateRows=[];calculated=[];els.mainView.classList.add('hidden');els.loginView.classList.remove('hidden');els.refresh.classList.add('hidden');els.accessCode.value='';els.loginMessage.textContent='';els.accessCode.focus()}
  function openConfig(){els.apiUrl.value=url();els.testMessage.textContent='';els.modal.classList.remove('hidden')}
  function closeConfig(){els.modal.classList.add('hidden')}
  els.loginForm.addEventListener('submit',e=>{e.preventDefault();login(els.accessCode.value)});els.logout.addEventListener('click',logout);els.client.addEventListener('change',startVisit);els.stockForm.addEventListener('submit',calculate);els.backToCount.addEventListener('click',()=>{els.reviewView.classList.add('hidden');els.countView.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})});els.confirmBtn.addEventListener('click',confirmOrder);els.newVisit.addEventListener('click',startVisit);els.refresh.addEventListener('click',()=>login(session?.codigo||code(),true));
  [els.adminOpen,els.adminOpenLogin].forEach(b=>b.addEventListener('click',openConfig));els.adminClose.addEventListener('click',closeConfig);els.modal.addEventListener('click',e=>{if(e.target===els.modal)closeConfig()});els.saveConfig.addEventListener('click',()=>{const v=els.apiUrl.value.trim();if(v&&!/^https?:\/\//i.test(v)){els.testMessage.textContent='Informe uma URL completa começando com http ou https.';return}localStorage.setItem('reposicao_v4_seller_url',v||DEFAULT_API_URL);localStorage.removeItem('reposicao_v4_force_demo');els.testMessage.textContent='Configuração salva.';setTimeout(()=>location.reload(),500)});els.clearConfig.addEventListener('click',()=>{localStorage.removeItem('reposicao_v4_seller_url');localStorage.setItem('reposicao_v4_force_demo','1');els.testMessage.textContent='Modo demonstração ativado.';setTimeout(()=>location.reload(),500)});
  const saved=code();if(saved)login(saved,true);else setTimeout(()=>els.accessCode.focus(),100);
})();
