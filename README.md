# FinancIA 💚

> Gestión de finanzas personales con IA, optimizada para el contexto económico argentino.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth-green?logo=supabase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## ¿Qué es FinancIA?

Aplicación web progresiva (PWA) para gestionar finanzas personales en Argentina. Contempla la realidad del mercado local: multimoneda (ARS/USD), cotizaciones en tiempo real (blue, MEP, oficial, cripto), tarjetas de crédito con cuotas, presupuestos por categoría y un analista financiero con IA.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Estado | Zustand con persistencia en localStorage |
| Animaciones | Framer Motion |
| Auth | Supabase (Google OAuth) |
| Base de datos | Supabase (PostgreSQL) — *en implementación* |
| IA | Google Gemini 2.0 Flash Lite (via API Route) |
| Cotizaciones | dolarapi.com + bluelytics.com.ar (fallback) |
| Deploy | Vercel |

---

## Funcionalidades actuales

### ✅ Operativas
- **Dashboard** — balance neto, ingresos/egresos del mes, alertas
- **Movimientos** — registro de ingresos y gastos con multimoneda
- **Tarjetas** — gestión de tarjetas de crédito/débito con límites y cuotas
- **Presupuestos** — límites por categoría con alertas al 80%
- **Proyección** — estimación de gastos futuros
- **Reporte PDF** — exportación del resumen mensual
- **Importar CSV** — carga masiva de transacciones
- **Configuración** — perfil, cotizaciones en tiempo real, tema de color
- **Cotizaciones en tiempo real** — blue, oficial, MEP, cripto, tarjeta, mayorista
- **Auth con Google** — login/logout via Supabase OAuth
- **Navegación mobile** — drawer lateral + FAB para nuevo movimiento
- **Deploy en Vercel** — app online en `financ-ia-9vug.vercel.app`

### 🔒 Próximamente
- **Analista IA** — chat con Gemini para análisis financiero personalizado
- **Lector de PDF** — importación automática de resúmenes de tarjeta
- **Supabase DB** — sincronización de datos en la nube entre dispositivos
- **Notificaciones push** — alertas de vencimientos y gastos
- **Predicción de gastos** — ML con series temporales

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Analista IA (Gemini server-side)
│   │   ├── cotizaciones/route.ts      # Cotizaciones en tiempo real
│   │   └── parse-statement/route.ts  # Lector PDF tarjetas (pendiente)
│   ├── auth/callback/route.ts        # Callback OAuth Supabase
│   ├── configuracion/page.tsx
│   ├── ia/page.tsx                   # Analista IA (próximamente)
│   ├── importar/page.tsx
│   ├── movimientos/page.tsx
│   ├── presupuestos/page.tsx
│   ├── proyeccion/page.tsx
│   ├── reporte/page.tsx
│   ├── tarjetas/page.tsx
│   ├── layout.tsx
│   └── page.tsx                      # Dashboard
├── components/
│   ├── motion/                       # Animaciones reutilizables
│   ├── AlertsPanel.tsx
│   ├── AppLayout.tsx                 # Layout principal (desktop/mobile)
│   ├── AppShell.tsx                  # FAB desktop
│   ├── AuthProvider.tsx              # Contexto de autenticación
│   ├── BottomNav.tsx                 # Navegación mobile (drawer)
│   ├── BudgetPanel.tsx
│   ├── CardCredit.tsx
│   ├── CardStatementUploader.tsx     # Lector PDF (pendiente activar)
│   ├── CategoryLineChart.tsx
│   ├── CotizacionesWidget.tsx        # Widget cotizaciones en tiempo real
│   ├── FixedIncomeReminder.tsx
│   ├── MultiCurrencyBalance.tsx
│   ├── OnboardingWizard.tsx
│   ├── ServiceWorkerRegister.tsx
│   ├── Sidebar.tsx                   # Navegación desktop
│   ├── ThemeProvider.tsx
│   ├── TransactionForm.tsx
│   └── UserMenu.tsx
├── lib/
│   ├── csv.ts                        # Exportación CSV
│   ├── csvImport.ts                  # Importación CSV
│   ├── pdfReport.ts                  # Generación reporte PDF
│   ├── statementParser.ts            # Parser resúmenes bancarios (pendiente)
│   ├── supabase.ts                   # Cliente Supabase
│   └── syncStore.ts                  # Sync Zustand ↔ Supabase
└── store/
    └── useFinanceStore.ts            # Store global Zustand
```

---

## Variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Gemini AI (solo servidor, NO usar prefijo NEXT_PUBLIC_)
GEMINI_API_KEY=AIzaSy...
```

> ⚠️ Nunca commitear `.env.local`. Ya está en `.gitignore`.

---

## Configuración de Supabase

### Google OAuth
1. Supabase → Authentication → Providers → Google → Enable
2. Copiar el Callback URL
3. Google Cloud Console → Credentials → OAuth Client → agregar el Callback URL
4. Pegar Client ID y Secret en Supabase

### URL Configuration
- **Site URL:** `https://tu-app.vercel.app`
- **Redirect URLs:** `https://tu-app.vercel.app/auth/callback`

### Base de datos (pendiente)
```sql
-- Tabla para sincronización del store
CREATE TABLE financia_data (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE financia_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own data"
  ON financia_data FOR ALL
  USING (auth.uid() = user_id);
```

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel

1. Conectar repo de GitHub en vercel.com
2. Agregar variables de entorno en Settings → Environment Variables
3. Deploy automático en cada `git push` a `main`

**URL de producción:** https://financ-ia-9vug.vercel.app

---

## Seguridad

- API keys de IA solo en servidor (Route Handlers, sin prefijo `NEXT_PUBLIC_`)
- Autenticación via Supabase OAuth — sin manejo de contraseñas
- Row Level Security habilitado en Supabase (cuando se active la DB)
- Variables sensibles nunca expuestas al cliente

---

## Roadmap

### v1 — MVP (actual)
- [x] Dashboard con balance multimoneda
- [x] Registro de movimientos
- [x] Tarjetas de crédito con cuotas
- [x] Presupuestos por categoría
- [x] Cotizaciones en tiempo real
- [x] Auth con Google
- [x] Deploy en Vercel
- [x] Navegación mobile

### v2 — Datos en la nube
- [ ] Supabase DB — sync entre dispositivos
- [ ] Analista IA operativo
- [ ] Lector de PDF de resúmenes bancarios
- [ ] Notificaciones push

### v3 — IA avanzada
- [ ] Predicción de gastos con series temporales
- [ ] Categorización automática con ML
- [ ] Recomendaciones personalizadas anti-inflación
- [ ] Integración con billeteras (MercadoPago API)

---

## Nombres comerciales sugeridos

- **FinancIA** *(actual)* — directo, fácil de recordar, IA implícita
- **Mango** — argentinismo para dinero, memorable
- **Billetera Verde** — referencia al dólar y al ahorro

---

*Desarrollado para el mercado argentino 🇦🇷*
