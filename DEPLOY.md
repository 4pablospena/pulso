# Pulso en tu iPhone (Vercel + Upstash)

**Desplegada en <https://pulso-one-phi.vercel.app>** (proyecto `pulso`, base `pulso-db` en Frankfurt).
El token de Salud está en `~/pulso-health-token.txt`.

Unos 15 minutos. Todo es gratis (planes Hobby de Vercel y Free de Upstash).

## 1. Cuenta y sesión en Vercel

1. Crea una cuenta en <https://vercel.com/signup> (puedes entrar con GitHub).
2. En la terminal, dentro de esta carpeta:

```bash
npx vercel@65.9.0 login
```

## 2. Primer despliegue

```bash
npx vercel@65.9.0 deploy --prod
```

Acepta las preguntas por defecto (nuevo proyecto, nombre `pulso`). Al terminar te dará una URL tipo `https://pulso-xxxx.vercel.app`.
Aún no funcionará del todo: faltan la base de datos y las claves.

## 3. Base de datos (Upstash)

En <https://vercel.com/dashboard> → proyecto **pulso** → **Storage** → **Create Database** → **Upstash for Redis** → plan **Free** → conéctala al proyecto.
Vercel añade solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.

## 4. Claves

En el proyecto → **Settings → Environment Variables** (entorno *Production*):

| Variable | Valor |
|---|---|
| `NUXT_APP_PASSWORD` | La contraseña con la que entrarás a la app (larga; el iPhone la recordará) |
| `NUXT_HEALTH_INGEST_TOKEN` | Un texto aleatorio largo; genéralo con `openssl rand -hex 24` |
| `NUXT_ANTHROPIC_API_KEY` | Tu clave de la API de Anthropic (cámara inteligente) |
| `NUXT_STRAVA_CLIENT_ID` / `NUXT_STRAVA_CLIENT_SECRET` | De <https://www.strava.com/settings/api> |

Sin `NUXT_APP_PASSWORD` la app quedaría abierta a cualquiera que tenga la URL: no te la saltes.

Después, vuelve a desplegar para que las coja:

```bash
npx vercel@65.9.0 deploy --prod
```

## 5. Sube tus datos actuales (opcional)

Para conservar perfil, rutinas, entrenos, plan y lista de la compra del Mac:

```bash
npx vercel@65.9.0 env pull .env.vercel
```

```bash
node --env-file=.env.vercel scripts/upload-data.mjs
```

Borra `.env.vercel` después (contiene las claves).

## 6. En el iPhone

1. Abre la URL en **Safari** e inicia sesión (deja que el llavero guarde la contraseña).
2. **Compartir → Añadir a pantalla de inicio**. Se abre a pantalla completa, con su icono, como una app más.

## 7. Integraciones con la URL nueva

- **Strava**: en <https://www.strava.com/settings/api> pon como *Authorization Callback Domain* tu dominio
  (`pulso-xxxx.vercel.app`, sin `https://`). Luego conecta desde Ajustes en la app.
- **Apple Salud** (Health Auto Export → Automatizaciones → REST API):
  URL `https://pulso-xxxx.vercel.app/api/health/ingest`, formato JSON,
  cabecera `Authorization: Bearer <tu NUXT_HEALTH_INGEST_TOKEN>`.

## Actualizar

Cada vez que cambies algo:

```bash
npx vercel@65.9.0 deploy --prod
```
