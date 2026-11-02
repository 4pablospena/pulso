#!/bin/sh
# Configura en Vercel las notificaciones push de Pulso:
#  1. Genera las claves VAPID y las guarda en Vercel (la privada como dato sensible; no se muestra).
#  2. Añade QStash de Upstash (plan gratuito) para los avisos programados:
#     fin de ayuno, comidas, agua y fin del descanso entre series.
# Ejecútalo una sola vez desde la carpeta del proyecto: ./scripts/setup-push.sh
set -e
cd "$(dirname "$0")/.."
VERCEL="npx -y vercel@65.9.0"

echo "→ Generando claves VAPID…"
KEYS=$(node -e "const k=require('web-push').generateVAPIDKeys();console.log(k.publicKey+' '+k.privateKey)")
PUBLIC=${KEYS% *}
PRIVATE=${KEYS#* }

printf '%s' "$PUBLIC" | $VERCEL env add NUXT_PUBLIC_VAPID_PUBLIC_KEY production
printf '%s' "$PRIVATE" | $VERCEL env add NUXT_VAPID_PRIVATE_KEY production --sensitive
unset PRIVATE KEYS

echo "→ Añadiendo QStash (Upstash, plan gratuito)…"
$VERCEL integration add upstash/upstash-qstash --billing-plan free --name pulso-qstash --no-env-pull

echo "✓ Listo. El próximo despliegue ya tendrá notificaciones."
