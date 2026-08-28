(()=>{
  const $=s=>document.querySelector(s);
  const els={
    client:$('#clientSelect'),product:$('#productSelect'),stock:$('#stockValue'),order:$('#orderValue'),
    result:$('#result'),empty:$('#emptyState'),updated:$('#updatedAt'),refresh:$('#refreshBtn'),notice:$('#demoNotice'),
    adminOpen:$('#adminOpen'),modal:$('#adminModal'),apiUrl:$('#apiUrl'),apiKey:$('#apiKey'),adminClose:$('#adminClose'),
    saveTest:$('#saveTest'),testMessage:$('#testMessage')
  };
  let dataset=window.DEMO_DASHBOARD_DATA||{rows:[]};
  let live=false;

  const clean=v=>String(v??'').trim();
  const num=v=>{
    if(typeof v==='number') return Number.isFinite(v)?v:0;
    const s=clean(v).replace(/\s/g,'');
    if(/^[-+]?\d{1,3}(\.\d{3})*,\d+$/.test(s)) return Number(s.replace(/\./g,'').replace(',','.'))||0;
    return Number(s.replace(',','.'))||0;
  };
  const fmt=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(Math.max(0,Math.round(num(v))));
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function normalize(raw){
    const rows=Array.isArray(raw)?raw:Array.isArray(raw?.rows)?raw.rows:[];
    return rows.map((r,i)=>({
      cliente:clean(r.cliente??r.Cliente??'Não informado'),
      produto:clean(r.produto??r.Produto??'Não informado'),
      semana:clean(r.semana??r.Semana??''),
      estoqueAtual:num(r.estoqueAtual??r['Estoque Atual']),
      sugestao:num(r.sugestao??r['Sugestão Reposição']??r['Sugestão de Reposição']),
      _i:i
    })).filter(r=>r.cliente&&r.produto);
  }

  function config(){return{url:localStorage.getItem('rv_api_url')||'',key:localStorage.getItem('rv_api_key')||''}}

  function weekNumber(v){
    const m=String(v||'').match(/(\d+)/);
    return m?Number(m[1]):-1;
  }

  function fillClients(){
    const rows=normalize(dataset);
    const current=els.client.value;
    const clients=[...new Set(rows.map(r=>r.cliente))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    els.client.innerHTML=clients.length?clients.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(''):'<option>Sem lojas</option>';
    const qs=new URLSearchParams(location.search).get('cliente');
    if(clients.includes(current)) els.client.value=current;
    else if(qs&&clients.includes(qs)) els.client.value=qs;
    else if(clients[0]) els.client.value=clients[0];
    fillProducts();
  }

  function fillProducts(){
    const rows=normalize(dataset).filter(r=>r.cliente===els.client.value);
    const current=els.product.value;
    const products=[...new Set(rows.map(r=>r.produto))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    els.product.innerHTML=products.length?products.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join(''):'<option>Sem produtos</option>';
    const qs=new URLSearchParams(location.search).get('produto');
    if(products.includes(current)) els.product.value=current;
    else if(qs&&products.includes(qs)) els.product.value=qs;
    else if(products[0]) els.product.value=products[0];
    render();
  }

  function latestRow(){
    const rows=normalize(dataset).filter(r=>r.cliente===els.client.value&&r.produto===els.product.value);
    if(!rows.length) return null;
    rows.sort((a,b)=>{
      const wa=weekNumber(a.semana), wb=weekNumber(b.semana);
      if(wa!==wb) return wa-wb;
      return a._i-b._i;
    });
    return rows[rows.length-1];
  }

  function render(){
    const r=latestRow();
    if(!r){
      els.result.classList.add('hidden');els.empty.classList.remove('hidden');
      els.stock.textContent='—';els.order.textContent='—';return;
    }
    els.result.classList.remove('hidden');els.empty.classList.add('hidden');
    els.stock.textContent=fmt(r.estoqueAtual);
    els.order.textContent=fmt(r.sugestao);
    updateTime();
  }

  function updateTime(){
    const d=new Date(dataset.updatedAt||Date.now());
    const text=Number.isNaN(d.getTime())?'Dados atualizados':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(d);
    els.updated.textContent=`Última atualização: ${text}`;
  }

  function setMode(isLive){
    live=isLive;
    els.notice.classList.toggle('hidden',isLive);
  }

  async function loadLive(showMessage=false){
    const c=config();
    if(!c.url){dataset=window.DEMO_DASHBOARD_DATA;setMode(false);fillClients();return false}
    try{
      if(showMessage) els.testMessage.textContent='Testando conexão...';
      const headers={Accept:'application/json'};
      if(c.key) headers['x-dashboard-key']=c.key;
      const res=await fetch(c.url,{headers,cache:'no-store'});
      if(!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const raw=await res.json();
      const rows=normalize(raw);
      if(!rows.length) throw new Error('O n8n respondeu, mas não vieram dados válidos.');
      dataset={...raw,rows,updatedAt:raw.updatedAt||new Date().toISOString()};
      setMode(true);fillClients();
      if(showMessage) els.testMessage.textContent=`Conexão funcionando. ${rows.length} registros recebidos.`;
      return true;
    }catch(e){
      if(showMessage) els.testMessage.textContent=`Não foi possível conectar: ${e.message}`;
      return false;
    }
  }

  function showAdminIfRequested(){
    const q=new URLSearchParams(location.search);
    if(q.get('config')==='1') els.adminOpen.classList.remove('hidden');
  }

  function openAdmin(){
    const c=config();els.apiUrl.value=c.url;els.apiKey.value=c.key;els.testMessage.textContent='';els.modal.classList.remove('hidden');
  }
  function closeAdmin(){els.modal.classList.add('hidden')}

  els.client.addEventListener('change',fillProducts);
  els.product.addEventListener('change',render);
  els.refresh.addEventListener('click',async()=>{if(config().url) await loadLive(false); else render()});
  els.adminOpen.addEventListener('click',openAdmin);
  els.adminClose.addEventListener('click',closeAdmin);
  els.modal.addEventListener('click',e=>{if(e.target===els.modal)closeAdmin()});
  els.saveTest.addEventListener('click',async()=>{
    localStorage.setItem('rv_api_url',els.apiUrl.value.trim());
    localStorage.setItem('rv_api_key',els.apiKey.value.trim());
    const ok=await loadLive(true);
    if(ok) setTimeout(closeAdmin,900);
  });

  showAdminIfRequested();
  fillClients();setMode(false);
  if(config().url) loadLive(false);
  setInterval(()=>{if(config().url) loadLive(false)},60000);
})();
