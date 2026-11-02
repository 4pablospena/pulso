# Pulso

Super app web (Nuxt 4) que une en un solo flujo lo que en el documento de ecosistema hacían
YAZIO, Hevy, Strava, Bring! y Mercadona. Estilo oscuro con anillos, como Fitness de Apple.
Se instala en el iPhone como app («Compartir → Añadir a pantalla de inicio»).

## Cómo encaja todo

```
 Apple Watch / iPhone ─► Apple Salud ─► Health Auto Export / Atajo ─► /api/health/ingest ─┐
 Strava (OAuth) ─────────────────────────────────────────────────────────────────────────┤
 Sesión de fuerza en Pulso ─► Strava (WeightTraining) ──────────────────────────────────┤
                                                                                         ▼
                                       Energía activa del día ─► objetivo kcal + macros (plan del día)
                                                                                         │
 Comidas: foto (Claude) · código de barras (Open Food Facts) · básicos ──► "a la compra" ▼
                                       Lista por pasillos ─► buscador de tienda.mercadona.es
```

| Pestaña | Qué hace | Sustituye a |
|---|---|---|
| Resumen | Anillos Ingesta / Proteína / Actividad, entreno del día, siguiente comida del plan, ayuno, agua | Fitness |
| Nutrición | 4 planes nutricionales (mediterránea proteica, definición 16:8, vegetariana, batch cooking) con 34 recetas; raciones ajustadas a tu objetivo, «✓ Comido» en un toque, cambiar comidas; foto (Claude), código de barras y ayuno | YAZIO |
| Balance | Historial de 7/30 días: comidas frente a quemadas por día, déficit o superávit, medias, días en objetivo, cumplimiento del plan y evolución del peso (manual o desde Salud) frente a lo que predice el balance. Nutrición permite navegar a días pasados y registrar en ellos | YAZIO |
| Entreno · Plan | Base de 71 ejercicios en español con fotos y técnica, rutinas editables, semana configurable, sobrecarga progresiva sugerida | Hevy |
| Entreno · Progreso | Racha semanal, sesiones por semana, series por grupo, récords (1RM, peso, reps, volumen) y ficha de progreso por ejercicio | Hevy |
| Entreno · Running | Carreras de Strava (ritmo, desnivel, FC, zona) o de Apple Salud | Strava |
| Compra | Lista de la semana calculada desde el plan: ingredientes sumados → productos y nº de envases de Mercadona por pasillo; despensa aparte; pedido guiado | Bring! + Mercadona |

Para no contar dos veces un entreno, el gasto sale de Apple Salud cuando hay datos (más las sesiones de Pulso
que Salud no tenga); si no, de Strava + Pulso.

## En el iPhone

Para tenerla siempre disponible como una app más, sigue [DEPLOY.md](DEPLOY.md) (Vercel + Upstash, gratis).

## Arranque

```bash
npm install
cp .env.example .env   # y rellena las claves
npm run dev            # http://localhost:3000
```

- **Strava**: crea una app en <https://www.strava.com/settings/api> con *Authorization Callback Domain* = `localhost`
  (en producción, tu dominio). Conecta desde Ajustes.
- **Apple Salud**: la web no puede leer HealthKit directamente. Usa la app *Health Auto Export* (automatización REST API, JSON)
  o un Atajo que haga POST a `/api/health/ingest` con `Authorization: Bearer $NUXT_HEALTH_INGEST_TOKEN`.
  Las instrucciones exactas están en Ajustes. Para que el iPhone llegue al servidor, despliégalo
  (Vercel, Fly, un VPS…) o usa un túnel en desarrollo.
- **Cámara inteligente**: `NUXT_ANTHROPIC_API_KEY`.

Tests del núcleo: `npm test` · Tipos: `npm run typecheck`

## Estructura

- `shared/core/`: lógica pura y probada (balance energético, ayuno, 1RM, progreso, planes, lista de la compra).
- `shared/data/`: ejercicios, ingredientes (con producto y formato de Mercadona), recetas y planes nutricionales.
  Las fotos de ejercicios son de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio público).
  Los valores nutricionales son medios de referencia y los formatos de Mercadona, orientativos.
- `server/`: API Nitro (datos en `.data/db`, Strava, Claude, Open Food Facts, webhook de Salud).
- `app/`: interfaz Vue.
- `_archive/ios-swift/`: primera versión nativa en Swift, ya no se usa.

## Límites conocidos

- Acceso con una única contraseña (`NUXT_APP_PASSWORD`): pensada para uso personal.
- La web no escribe en Apple Salud: las sesiones de fuerza llegan a Strava, no al anillo de Actividad.
  Si quieres eso, el siguiente paso es empaquetar esta misma app con Capacitor y un plugin de HealthKit.
- Los avisos del ayuno solo saltan con la app abierta (las notificaciones push necesitan Web Push).
- Mercadona no tiene API pública de carrito: Pulso abre su buscador por producto.
