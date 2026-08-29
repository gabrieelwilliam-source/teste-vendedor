(()=>{
  const $=s=>document.querySelector(s);
  const els={
    loginView:$('#loginView'),mainView:$('#mainView'),loginForm:$('#loginForm'),accessCode:$('#accessCode'),loginMessage:$('#loginMessage'),
    sellerName:$('#sellerName'),logout:$('#logoutBtn'),client:$('#clientSelect'),productsList:$('#productsList'),stockForm:$('#stockForm'),
    calculateBtn:$('#calculateBtn'),saveMessage:$('#saveMessage'),empty:$('#emptyState'),updated:$('#updatedAt'),refresh:$('#refreshBtn'),notice:$('#demoNotice'),
    adminOpen:$('#adminOpen'),adminOpenLogin:$('#adminOpenLogin'),modal:$('#adminModal'),apiUrl:$('#apiUrl'),adminClose:$('#adminClose'),saveConfig:$('#saveConfig'),clearConfig:$('#clearConfig'),testMessage:$('#testMessage')
  };
  const PRODUCT_ORDER=['Pão sovado','Pão de Sanduiche','Pão de HOT DOG','Pão de Hamburguer','Pão Caseiro'];
  let session=null;
  let rows=[];
  let lastResult=[];
  const clean=v=>String(v??'').trim();
  const num=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const s=clean(v).replace(/\s/g,'');if(/^[-+]?\d{1,3}(\.\d{3})*,\d+$/.test(s))return Number(s.replace(/\./g,'').replace(',','.'))||0;return Number(s.replace(',','.'))||0};
  const fmt=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(Math.max(0,Math.round(num(v))));
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const apiUrl=()=>localStorage.getItem('rv3_api_url')||localStorage.getItem('rv2_api_url')||'';
  const savedCode=()=>localStorage.getItem('rv3_access_code')||localStorage.getItem('rv2_access_code')||'';
  const normalizeRows=raw=>(Array.isArray(raw)?raw:Array.isArray(raw?.rows)?raw.rows:[]).map(r=>({
    cliente:clean(r.cliente??r.Cliente),produto:clean(r.produto??r.Produto),estoqueAtual:num(r.estoqueAtual??r['Estoque Atual']),
    estoqueIdeal:num(r.estoqueIdeal??r['Estoque Ideal']??(num(r.estoqueAtual)+num(r.sugestao))),
    sugestao:num(r.sugestao??r['Sugestão Reposição']??r['Sugestão de Reposição']),atualizadoEm:clean(r.atualizadoEm??r['Atualizado em'])
  })).filter(r=>r.cliente&&r.produto);

  function updateEndpoint(){
    const base=apiUrl();
    if(!base)return '';
    try{
      const u=new URL(base);
      const p=u.pathname.replace(/\/+$/,'');
      u.pathname=p.endsWith('/reposicao-vendedor')?p.replace(/\/reposicao-vendedor$/,'/reposicao-vendedor-atualizar'):`${p}-atualizar`;
      return u.toString();
    }catch{return base.replace(/\/+$/,'').replace(/\/reposicao-vendedor$/,'/reposicao-vendedor-atualizar')}
  }

  function setLoggedOut(message=''){
    session=null;rows=[];lastResult=[];els.mainView.classList.add('hidden');els.loginView.classList.remove('hidden');els.refresh.classList.add('hidden');
    els.loginMessage.textContent=message;els.accessCode.value='';setTimeout(()=>els.accessCode.focus(),50);
  }
  function setLoggedIn(data,isDemo){
    session={vendedor:data.vendedor||'Vendedor',lojas:Array.isArray(data.lojas)?data.lojas:[]};
    rows=normalizeRows(data.rows);lastResult=[];
    els.sellerName.textContent=session.vendedor;els.loginView.classList.add('hidden');els.mainView.classList.remove('hidden');els.refresh.classList.remove('hidden');
    els.notice.classList.toggle('hidden',!isDemo);fillClients();
    const d=new Date(data.updatedAt||Date.now());els.updated.textContent=`Dados carregados: ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(d)}`;
  }
  function demoLogin(code){
    const u=(window.DEMO_SELLER_USERS||[]).find(x=>x.codigo===code);if(!u)return null;
    return {ok:true,vendedor:u.vendedor,lojas:u.lojas,rows:(window.DEMO_SELLER_ROWS||[]).filter(r=>u.lojas.includes(r.cliente)),updatedAt:new Date().toISOString()};
  }
  async function login(code,quiet=false){
    code=clean(code).replace(/\D/g,'');
    if(code.length!==6){if(!quiet)els.loginMessage.textContent='Digite os 6 números do seu código.';return false}
    if(!quiet)els.loginMessage.textContent='Entrando...';
    const url=apiUrl();
    if(!url){const data=demoLogin(code);if(!data){els.loginMessage.textContent='Código inválido para a demonstração.';return false}localStorage.setItem('rv3_access_code',code);setLoggedIn(data,true);return true}
    try{
      const sep=url.includes('?')?'&':'?';
      const res=await fetch(`${url}${sep}codigo=${encodeURIComponent(code)}`,{headers:{Accept:'application/json'},cache:'no-store'});
      const data=await res.json().catch(()=>({ok:false,error:`Erro HTTP ${res.status}`}));
      if(!res.ok||data.ok===false)throw new Error(data.error||'Código de acesso inválido.');
      const normalized=normalizeRows(data);
      if(!normalized.length)throw new Error('Acesso válido, mas não há produtos cadastrados para suas lojas.');
      localStorage.setItem('rv3_access_code',code);setLoggedIn({...data,rows:normalized},false);return true;
    }catch(e){if(!quiet)els.loginMessage.textContent=e.message||'Não foi possível entrar.';else els.saveMessage.textContent='Não foi possível atualizar os dados agora.';return false}
  }
  function fillClients(){
    const allowed=session?.lojas?.length?session.lojas:[...new Set(rows.map(r=>r.cliente))];
    const available=allowed.filter(l=>rows.some(r=>r.cliente===l));
    els.client.innerHTML=available.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');renderProducts();
  }
  function storeRows(){
    const selected=els.client.value;
    return rows.filter(r=>r.cliente===selected).sort((a,b)=>{
      const ai=PRODUCT_ORDER.indexOf(a.produto),bi=PRODUCT_ORDER.indexOf(b.produto);
      if(ai!==-1||bi!==-1)return (ai===-1?999:ai)-(bi===-1?999:bi);
      return a.produto.localeCompare(b.produto,'pt-BR');
    });
  }
  function renderProducts(){
    lastResult=[];els.saveMessage.textContent='';
    const list=storeRows();
    if(!list.length){els.productsList.innerHTML='';els.productsList.classList.add('hidden');els.empty.classList.remove('hidden');els.calculateBtn.disabled=true;return}
    els.productsList.classList.remove('hidden');els.empty.classList.add('hidden');els.calculateBtn.disabled=false;
    els.productsList.innerHTML=list.map((r,i)=>`<article class="product-card" data-product="${esc(r.produto)}">
      <div class="product-top">
        <h3>${esc(r.produto)}</h3>
        <span class="last-stock">Último estoque: <strong>${fmt(r.estoqueAtual)}</strong></span>
      </div>
      <label class="stock-input-wrap">
        <span>ESTOQUE NA LOJA AGORA</span>
        <div class="stock-input-line">
          <input class="stock-input" data-index="${i}" data-product="${esc(r.produto)}" type="number" min="0" max="99999" step="1" inputmode="numeric" placeholder="0" required aria-label="Estoque atual de ${esc(r.produto)}">
          <small>unidades</small>
        </div>
      </label>
      <div class="suggestion-box hidden" data-result="${i}">
        <span>PEDIDO RECOMENDADO</span>
        <div class="suggestion-value"><b>PEDIR</b><strong>—</strong><small>unidades</small></div>
      </div>
    </article>`).join('');
  }
  function collectStock(){
    const inputs=[...els.productsList.querySelectorAll('.stock-input')];
    const items=[];
    for(const input of inputs){
      const raw=clean(input.value);
      const value=Number(raw);
      if(raw===''||!Number.isFinite(value)||value<0||!Number.isInteger(value)){
        input.focus();input.classList.add('input-error');
        throw new Error('Preencha o estoque dos 5 produtos usando números inteiros.');
      }
      input.classList.remove('input-error');
      items.push({produto:input.dataset.product,estoqueAtual:value});
    }
    return items;
  }
  function showResults(resultRows){
    lastResult=resultRows;
    const cards=[...els.productsList.querySelectorAll('.product-card')];
    cards.forEach((card,i)=>{
      const product=card.dataset.product;
      const r=resultRows.find(x=>clean(x.produto)===product);
      if(!r)return;
      const box=card.querySelector('.suggestion-box');
      const strong=box.querySelector('strong');
      const label=box.querySelector('b');
      const small=box.querySelector('small');
      const sug=Math.max(0,Math.round(num(r.sugestao)));
      strong.textContent=fmt(sug);
      if(sug===0){label.textContent='NÃO PEDIR';small.textContent='estoque suficiente';box.classList.add('no-order')}else{label.textContent='PEDIR';small.textContent='unidades';box.classList.remove('no-order')}
      box.classList.remove('hidden');
      const last=card.querySelector('.last-stock strong');if(last)last.textContent=fmt(r.estoqueAtual);
    });
  }
  function demoUpdate(loja,items){
    const updated=[];
    items.forEach(item=>{
      const r=rows.find(x=>x.cliente===loja&&x.produto===item.produto);
      if(!r)return;
      r.estoqueAtual=item.estoqueAtual;r.sugestao=Math.max(0,Math.round(r.estoqueIdeal-r.estoqueAtual));r.atualizadoEm=new Date().toISOString();
      const global=(window.DEMO_SELLER_ROWS||[]).find(x=>x.cliente===loja&&x.produto===item.produto);if(global)Object.assign(global,r);
      updated.push({...r});
    });
    return {ok:true,vendedor:session.vendedor,loja,updatedAt:new Date().toISOString(),rows:updated};
  }
  async function saveAndCalculate(e){
    e.preventDefault();els.saveMessage.textContent='';
    let items;try{items=collectStock()}catch(err){els.saveMessage.textContent=err.message;return}
    const loja=els.client.value;const codigo=savedCode();
    els.calculateBtn.disabled=true;els.calculateBtn.textContent='CALCULANDO...';
    try{
      let data;
      if(!apiUrl())data=demoUpdate(loja,items);
      else{
        const res=await fetch(updateEndpoint(),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','Accept':'application/json'},body:JSON.stringify({codigo,loja,itens:items}),cache:'no-store'});
        data=await res.json().catch(()=>({ok:false,error:`Erro HTTP ${res.status}`}));
        if(!res.ok||data.ok===false)throw new Error(data.error||'Não foi possível salvar o estoque.');
      }
      const normalized=normalizeRows(data);
      if(!normalized.length)throw new Error('O n8n não devolveu as sugestões dos produtos.');
      normalized.forEach(n=>{const current=rows.find(r=>r.cliente===n.cliente&&r.produto===n.produto);if(current)Object.assign(current,n)});
      showResults(normalized);
      const d=new Date(data.updatedAt||Date.now());els.updated.textContent=`Última contagem: ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(d)}`;
      els.saveMessage.textContent=apiUrl()?'✓ Estoque salvo na planilha. Pedido calculado.':'✓ Teste concluído. Em modo demonstração nada é enviado para a planilha.';
      els.saveMessage.classList.add('success');
    }catch(err){els.saveMessage.textContent=err.message||'Erro ao salvar o estoque.';els.saveMessage.classList.remove('success')}
    finally{els.calculateBtn.disabled=false;els.calculateBtn.textContent='SALVAR ESTOQUE E CALCULAR PEDIDO'}
  }
  function openAdmin(){els.apiUrl.value=apiUrl();els.testMessage.textContent='';els.modal.classList.remove('hidden')}
  function closeAdmin(){els.modal.classList.add('hidden')}
  function showAdminIfRequested(){if(new URLSearchParams(location.search).get('config')==='1'){els.adminOpen.classList.remove('hidden');els.adminOpenLogin.classList.remove('hidden')}}
  els.loginForm.addEventListener('submit',e=>{e.preventDefault();login(els.accessCode.value)});
  els.accessCode.addEventListener('input',()=>{els.accessCode.value=els.accessCode.value.replace(/\D/g,'').slice(0,6)});
  els.client.addEventListener('change',renderProducts);
  els.stockForm.addEventListener('submit',saveAndCalculate);
  els.productsList.addEventListener('input',e=>{if(e.target.classList.contains('stock-input')){e.target.classList.remove('input-error');els.saveMessage.textContent='';}});
  els.logout.addEventListener('click',()=>{localStorage.removeItem('rv3_access_code');localStorage.removeItem('rv2_access_code');setLoggedOut()});
  els.refresh.addEventListener('click',()=>{const c=savedCode();if(c)login(c,true)});
  els.adminOpen.addEventListener('click',openAdmin);els.adminOpenLogin.addEventListener('click',openAdmin);els.adminClose.addEventListener('click',closeAdmin);els.modal.addEventListener('click',e=>{if(e.target===els.modal)closeAdmin()});
  els.saveConfig.addEventListener('click',()=>{localStorage.setItem('rv3_api_url',els.apiUrl.value.trim());localStorage.removeItem('rv3_access_code');els.testMessage.textContent='Configuração salva.';setTimeout(()=>{closeAdmin();setLoggedOut('Digite seu código para entrar.')},500)});
  els.clearConfig.addEventListener('click',()=>{localStorage.removeItem('rv3_api_url');localStorage.removeItem('rv2_api_url');localStorage.removeItem('rv3_access_code');localStorage.removeItem('rv2_access_code');closeAdmin();setLoggedOut('Modo demonstração ativado.')});
  showAdminIfRequested();
  const remembered=savedCode();if(remembered)login(remembered,true);else setLoggedOut();
})();
