// با تغییر فایل‌های اصلی، عدد نسخه را بالا ببرید
const V = "catalog-v2";
const FILES = ["./", "./index.html", "./index.json", "./manifest.webmanifest",
  "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];

self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  const put = res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; };
  // کاتالوگ همیشه اول از شبکه (تازه)، و در حالت آفلاین از کش
  if (u.pathname.endsWith("index.json")) {
    e.respondWith(fetch(r).then(put).catch(() => caches.match(r, { ignoreSearch: true })));
    return;
  }
  // بقیه: سریع از کش و در پس‌زمینه تازه
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(put).catch(() => hit || caches.match("./index.html"));
    e.waitUntil(net.catch(() => {}));
    return hit || net;
  }));
});
