const CACHE_NAME = 'financia-v1';

const STATIC_ASSETS = [
  '/',
  '/movimientos',
  '/proyeccion',
  '/presupuestos',
  '/tarjetas',
  '/ia',
  '/configuracion',
  '/manifest.json',
];

// Instalación: pre-cachea las rutas principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpia cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network First con fallback a caché
self.addEventListener('fetch', (event) => {
  // Solo interceptamos GET
  if (event.request.method !== 'GET') return;

  // No interceptamos las API calls de Gemini ni Supabase
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('generativelanguage') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardamos en caché si la respuesta es válida
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin conexión: servimos desde caché
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback a la raíz para rutas de la app
          return caches.match('/') || new Response('Sin conexión', { status: 503 });
        });
      })
  );
});