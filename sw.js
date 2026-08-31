const CACHE='reposicao-v5-1-fr-static-1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./demo-data.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./assets/products/fr-logo.webp','./assets/products/pao-sovado.webp','./assets/products/pao-sanduiche.webp','./assets/products/pao-hot-dog.webp','./assets/products/pao-hamburguer.webp','./assets/products/pao-caseiro.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
