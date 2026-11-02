# Pulso

Super app iOS que une en un solo flujo lo que en el documento de ecosistema hacían
YAZIO, Hevy, Strava, Bring! y Mercadona. Diseño oscuro con anillos al estilo Fitness de Apple.

## Cómo encaja todo

```
 Apple Watch / iPhone / Strava ──► Apple Salud ──► energía activa del día
                                        ▲                │
  Sesión de fuerza (Pulso) ─────────────┤                ▼
        └──► Strava (WeightTraining)    │      Objetivo kcal + macros (plan del día)
                                        │                │
  Comidas: foto IA · código de barras ──┘                ▼
        └──► "A la compra"  ──►  Lista por pasillos  ──►  Buscador Mercadona
```

| Pestaña | Qué hace | Sustituye a |
|---|---|---|
| Resumen | Anillos Ingesta / Proteína / Actividad, plan del día, ayuno, agua | Fitness |
| Nutrición | Diario por comidas, cámara inteligente (Claude), escáner EAN (Open Food Facts), macros que se reajustan con la actividad real, ayuno 16:8 · 18:6 · 20:4 · OMAD con avisos | YAZIO |
| Entreno · Fuerza | Series, reps, peso, RPE, descanso, sobrecarga progresiva sugerida, 1RM (Epley), volumen por grupo muscular. Al terminar: se guarda en Salud y se sube a Strava | Hevy |
| Entreno · Running | Carreras de Strava (ritmo, desnivel, FC, zona) o de Salud si no hay Strava | Strava |
| Compra | Lista agrupada por pasillos en orden de tienda, compra semanal del plan en un toque, compartir, pedido guiado en tienda.mercadona.es | Bring! + Mercadona |

Para no contar dos veces un entreno, el gasto calórico **solo** sale de la energía activa de Salud.
Strava se usa para métricas de carrera y para publicar las sesiones de fuerza.

## Estructura

- `Packages/PulsoCore`: lógica pura y probada (balance energético, ayuno, 1RM, pasillos, plan semanal).
- `Pulso/`: app SwiftUI + SwiftData + HealthKit + Charts.

## Puesta en marcha

1. Instala **Xcode** (este Mac solo tiene Command Line Tools) y actívalo:
   `sudo xcode-select -s /Applications/Xcode.app`
2. `brew install xcodegen && xcodegen` → abre `Pulso.xcodeproj`, elige tu equipo de firma.
3. Strava: crea una app en <https://www.strava.com/settings/api> con *Authorization Callback Domain* = `localhost`,
   copia `Config/Secrets.example.xcconfig` a `Config/Secrets.xcconfig` y rellena ID y secreto.
4. Cámara inteligente: en Ajustes de la app pega tu clave de la API de Anthropic.
5. HealthKit necesita un iPhone real para tener datos (en el simulador puedes añadir muestras desde Salud).

Tests del núcleo: `./scripts/test-core.sh`

## Límites conocidos

- Mercadona no tiene API pública de carrito: Pulso abre su buscador por producto.
- El `client_secret` de Strava va en la app (válido para uso personal). Para publicarla, mueve el intercambio de tokens a un backend.
- Compartir la lista con otra persona en tiempo real (como Bring!) requiere CloudKit compartido: siguiente paso.
- App de Apple Watch propia: no incluida; el Watch ya alimenta Salud y Strava.
