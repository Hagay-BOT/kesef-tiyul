// REV: לשנות בכל פריסה של sw.js. הדף עצמו מתעדכן גם בלי זה (רענון ברקע)
const REV='10';
const CACHE='kesef-'+REV;
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE)
    .then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'}))))
    .then(()=>self.skipWaiting()));
});
// מוחקים רק מטמונים שלנו: באותו דומיין (hagay-bot.github.io) יושבות אפליקציות אחרות
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k.startsWith('kesef-')&&k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
// הדף: מהמטמון מיד (נפתח גם בלי קליטה), ובמקביל מביאים גרסה טרייה לפעם הבאה.
// זה גם מרפא מטמון שנמחק.
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin)return;
  if(r.mode==='navigate'){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match('./index.html');
      const net=fetch('./index.html',{cache:'reload'})
        .then(res=>{if(res.ok)c.put('./index.html',res.clone());return res})
        .catch(()=>null);
      if(hit){e.waitUntil(net);return hit}
      return (await net)||Response.error();
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:true});
    if(hit)return hit;
    const res=await fetch(r);
    if(res.ok)c.put(r,res.clone());
    return res;
  }));
});
