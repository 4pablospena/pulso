<script setup lang="ts">
import { bmr, GOAL_LABEL, type Goal } from '#shared/core/energy'
import { FASTING_PROTOCOLS } from '#shared/core/fasting'
import type { AppUser, IntegrationStatus, NotificationPrefs, Settings } from '#shared/types'

const { settings, save } = useSettings()
const { data: integrations, refresh } = useFetch<IntegrationStatus>('/api/integrations', { key: 'integrations' })
const route = useRoute()
const { show } = useToast()

const form = ref<Settings | null>(null)
watch(settings, (s) => { if (s && !form.value) form.value = structuredClone(toRaw(s)) }, { immediate: true })

const stravaMessages: Record<string, string> = {
  ok: 'Strava conectado',
  cancelado: 'Conexión con Strava cancelada',
  'sin-permiso-escritura': 'Acepta el permiso de subir actividades para enviar tus entrenos',
}
onMounted(() => { const s = route.query.strava as string | undefined; if (s) show(stravaMessages[s] ?? s) })

// Cuenta y personas de la casa
const { data: me } = useFetch<{ user: AppUser | null; healthToken: string | null; ingestUrl: string }>('/api/me', { key: 'me' })
const isAdmin = computed(() => me.value?.user?.role === 'admin')
const { data: people, refresh: refreshPeople } = useFetch<AppUser[]>('/api/users', {
  key: 'people', default: () => [], immediate: false,
})
watch(isAdmin, (admin) => admin && refreshPeople(), { immediate: true })

const newPerson = ref({ name: '', username: '', password: '' })
const adding = ref(false)
async function addPerson() {
  try {
    await $fetch('/api/users', { method: 'POST', body: newPerson.value })
    show(`Cuenta creada para ${newPerson.value.name || newPerson.value.username}`)
    newPerson.value = { name: '', username: '', password: '' }
    adding.value = false
    await refreshPeople()
  } catch (e: any) {
    show(e?.data?.message ?? 'No se pudo crear la cuenta')
  }
}
async function removePerson(u: AppUser) {
  if (!confirm(`¿Eliminar la cuenta de ${u.name} y todos sus datos personales? La lista de la compra se mantiene.`)) return
  await $fetch(`/api/users/${u.id}`, { method: 'DELETE' })
  await refreshPeople()
  show('Cuenta eliminada')
}

const passwords = ref({ current: '', next: '' })
const changingPassword = ref(false)
async function changePassword() {
  try {
    await $fetch('/api/me/password', { method: 'POST', body: passwords.value })
    passwords.value = { current: '', next: '' }
    changingPassword.value = false
    show('Contraseña cambiada')
  } catch (e: any) {
    show(e?.data?.message ?? 'No se pudo cambiar la contraseña')
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  // Borra los datos que el modo sin conexión guardó de esta cuenta.
  navigator.serviceWorker?.controller?.postMessage('clear-data')
  localStorage.removeItem('pulso-offline-queue')
  window.location.href = '/login'
}

async function copyToken() {
  if (!me.value?.healthToken) return
  await navigator.clipboard.writeText(me.value.healthToken)
  show('Token copiado')
}

// Notificaciones
const push = usePush()
const { data: pushStatus } = useFetch<{ configured: boolean; scheduling: boolean; devices: number }>('/api/push/status', { key: 'push-status' })
const NOTIFY: { key: keyof NotificationPrefs; label: string; hint: string; scheduled?: boolean }[] = [
  { key: 'shopping', label: 'Lista de la compra', hint: 'Cuando otra persona añade productos o recalcula la lista.' },
  { key: 'fasting', label: 'Ayuno', hint: 'Al terminar el ayuno y al cerrarse la ventana de ingesta.', scheduled: true },
  { key: 'meals', label: 'Comidas', hint: 'Recordatorio de cada comida planificada si aún no la has registrado.', scheduled: true },
  { key: 'water', label: 'Agua', hint: 'Si vas por detrás de tu objetivo (11, 13, 17 y 19 h).', scheduled: true },
  { key: 'rest', label: 'Descanso entre series', hint: 'Al acabar el descanso, aunque la pantalla esté apagada.', scheduled: true },
]
async function togglePush() {
  try {
    if (push.subscribed.value) await push.disable()
    else {
      await push.enable()
      await $fetch('/api/push/test', { method: 'POST' })
    }
    await refreshNuxtData('push-status')
  } catch (e: any) {
    show(e?.message ?? 'No se pudieron activar')
  }
}
async function setNotify(key: keyof NotificationPrefs, value: boolean) {
  await save({ notifications: { ...settings.value!.notifications, [key]: value } })
}

async function persist() {
  if (!form.value) return
  await save(form.value)
  show('Guardado')
}

async function disconnect() {
  await $fetch('/api/strava/disconnect', { method: 'POST' })
  await refresh()
  await refreshNuxtData(['strava', 'today'])
}

const lastSync = computed(() => integrations.value?.health.lastSync
  ? new Date(integrations.value.health.lastSync).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
  : 'nunca')
</script>

<template>
  <main class="page">
    <PageHeader title="Ajustes" :back="{ to: '/', label: 'Hoy' }" />

    <section v-if="me?.user" class="section">
      <div class="group">
        <div class="list icons">
          <div class="list-row">
            <span class="avatar">{{ me.user.name.slice(0, 1).toUpperCase() }}</span>
            <div class="stack grow">
              <span class="headline">{{ me.user.name }}</span>
              <span class="footnote muted">@{{ me.user.username }} · {{ me.user.role === 'admin' ? 'Administrador' : 'Miembro' }}</span>
            </div>
          </div>
          <button class="list-row tint" @click="changingPassword = !changingPassword">Cambiar contraseña</button>
          <form v-if="changingPassword" class="list-row" style="flex-direction: column; align-items: stretch; gap: 8px" @submit.prevent="changePassword">
            <input v-model="passwords.current" class="field" type="password" autocomplete="current-password" placeholder="Contraseña actual">
            <input v-model="passwords.next" class="field" type="password" autocomplete="new-password" placeholder="Nueva (mín. 8 caracteres)">
            <button class="btn small" style="align-self: flex-end" :disabled="!passwords.current || passwords.next.length < 8">Guardar</button>
          </form>
          <button class="list-row" style="color: var(--red)" @click="logout">Cerrar sesión</button>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-header">Notificaciones</h2>
      <div class="group">
        <div class="list">
          <div class="list-row">
            <IconTile name="bolt" color="var(--red)" />
            <span class="stack grow">
              <span>Notificaciones en este dispositivo</span>
              <span class="footnote muted">{{ push.subscribed.value ? 'Activadas' : !push.supported.value ? 'No disponibles en este navegador' : 'Desactivadas' }}</span>
            </span>
            <input type="checkbox" class="switch" :checked="push.subscribed.value" :disabled="!push.supported.value || !pushStatus?.configured" @change="togglePush">
          </div>
          <label v-for="n in NOTIFY" :key="n.key" class="list-row">
            <span class="stack grow">
              <span>{{ n.label }}</span>
              <span class="footnote muted">{{ n.hint }}</span>
            </span>
            <input type="checkbox" class="switch" :checked="settings?.notifications[n.key]" @change="setNotify(n.key, ($event.target as HTMLInputElement).checked)">
          </label>
        </div>
      </div>
      <p class="section-footer">
        <template v-if="!push.standalone.value">En el iPhone, las notificaciones solo funcionan con Pulso añadida a la pantalla de inicio (Compartir → Añadir a pantalla de inicio). </template>
        <template v-if="pushStatus && !pushStatus.configured">Falta configurar las claves VAPID en el servidor. </template>
        <template v-else-if="pushStatus && !pushStatus.scheduling">Los avisos de ayuno, comidas, agua y descanso necesitan QStash en el servidor. </template>
      </p>
    </section>

    <section v-if="isAdmin" class="section">
      <h2 class="section-header">Personas de la casa</h2>
      <div class="group">
        <div class="list icons">
          <div v-for="u in people" :key="u.id" class="list-row">
            <span class="avatar small">{{ u.name.slice(0, 1).toUpperCase() }}</span>
            <div class="stack grow">
              <span>{{ u.name }}</span>
              <span class="footnote muted">@{{ u.username }}{{ u.id === me?.user?.id ? ' · tú' : '' }}</span>
            </div>
            <button v-if="u.id !== me?.user?.id" class="footnote" style="color: var(--red)" @click="removePerson(u)">Eliminar</button>
          </div>
          <button v-if="!adding" class="list-row tint" @click="adding = true">
            <IconTile name="plus" color="var(--tertiary)" /> Añadir persona
          </button>
          <form v-else class="list-row" style="flex-direction: column; align-items: stretch; gap: 8px" @submit.prevent="addPerson">
            <input v-model="newPerson.name" class="field" placeholder="Nombre (p. ej. Ana)" autocomplete="off">
            <input v-model="newPerson.username" class="field" placeholder="Usuario para entrar (p. ej. ana)" autocapitalize="none" autocomplete="off">
            <input v-model="newPerson.password" class="field" type="password" placeholder="Contraseña inicial (mín. 8)" autocomplete="new-password">
            <div class="row" style="justify-content: flex-end">
              <button type="button" class="btn plain" style="--accent: var(--muted)" @click="adding = false">Cancelar</button>
              <button class="btn small" :disabled="!newPerson.username || newPerson.password.length < 8">Crear cuenta</button>
            </div>
          </form>
        </div>
      </div>
      <p class="section-footer">Cada persona tiene su perfil, plan, diario, entrenos y Strava. La lista de la compra es común. Pásale la dirección de la app, su usuario y su contraseña: podrá cambiarla en Ajustes.</p>
    </section>

    <section class="card">
      <h2 class="card-title">Integraciones</h2>
      <div class="list">
        <div class="list-row">
          <IconTile name="link" color="var(--run)" />
          <div class="grow">
            <div style="font-weight: 700">Strava</div>
            <div class="muted small">
              <template v-if="integrations?.strava.connected">{{ integrations.strava.athlete ?? 'Conectado' }} · lee carreras y sube tus sesiones de fuerza</template>
              <template v-else-if="integrations?.strava.configured">Sin conectar</template>
              <template v-else>Define NUXT_STRAVA_CLIENT_ID y NUXT_STRAVA_CLIENT_SECRET en .env</template>
            </div>
          </div>
          <button v-if="integrations?.strava.connected" class="chip" style="color: var(--move)" @click="disconnect">Desconectar</button>
          <a v-else-if="integrations?.strava.configured" class="chip" style="color: var(--run)" href="/api/strava/connect">Conectar</a>
        </div>
        <div class="list-row">
          <IconTile name="heart" color="var(--pink)" />
          <div class="grow">
            <div style="font-weight: 700">Apple Salud · Watch · Fitness</div>
            <div class="muted small">Última sincronización: {{ lastSync }}</div>
          </div>
        </div>
        <div class="list-row">
          <IconTile name="sparkles" color="var(--purple)" />
          <div class="grow">
            <div style="font-weight: 700">Cámara inteligente (Claude)</div>
            <div class="muted small">{{ integrations?.vision.configured ? 'Activa' : 'Define NUXT_ANTHROPIC_API_KEY en .env' }}</div>
          </div>
        </div>
      </div>
      <details class="small">
        <summary style="font-weight: 600; cursor: pointer">Cómo enviar datos de Apple Salud</summary>
        <ol class="muted" style="padding-left: 18px; line-height: 1.5">
          <li>Instala <strong>Health Auto Export</strong> en el iPhone → Automatizaciones → REST API.</li>
          <li>URL: <code>{{ integrations?.health.ingestUrl }}</code></li>
          <li>Cabecera <code>Authorization: Bearer &lt;tu token&gt;</code>, formato JSON.
            <button v-if="me?.healthToken" type="button" class="tint" @click="copyToken">Copiar mi token</button></li>
          <li>Métricas: Energía activa, Pasos, Minutos de ejercicio, FC en reposo, Peso. Incluye entrenos.</li>
          <li>Alternativa sin apps: un Atajo con “Obtener contenido de URL” (POST) enviando
            <code>{"date","activeKcal","steps","exerciseMin"}</code>.</li>
        </ol>
        <p v-if="!integrations?.health.tokenConfigured" style="color: var(--move)">Falta el token de Salud.</p>
        <p class="muted">Cada persona usa su propio token, así sus datos de Salud van a su cuenta.</p>
      </details>
    </section>

    <form v-if="form" class="card" @submit.prevent="persist">
      <h2 class="card-title">Perfil y objetivos</h2>
      <div class="grid">
        <label>Sexo
          <select v-model="form.profile.sex" class="field"><option value="male">Hombre</option><option value="female">Mujer</option></select>
        </label>
        <label>Edad <input v-model.number="form.profile.age" class="field" type="number" inputmode="numeric"></label>
        <label>Altura (cm) <input v-model.number="form.profile.heightCm" class="field" type="number" inputmode="decimal"></label>
        <label>Peso (kg) <input v-model.number="form.profile.weightKg" class="field" type="number" inputmode="decimal" step="0.1"></label>
        <label>Objetivo
          <select v-model="form.profile.goal" class="field">
            <option v-for="(label, g) in GOAL_LABEL" :key="g" :value="g as Goal">{{ label }}</option>
          </select>
        </label>
        <label>Ayuno
          <select v-model="form.fastingProtocol" class="field"><option v-for="p in FASTING_PROTOCOLS" :key="p">{{ p }}</option></select>
        </label>
        <label>Agua (ml) <input v-model.number="form.waterGoalMl" class="field" type="number" step="250"></label>
        <label>Personas en casa <input v-model.number="form.householdSize" class="field" type="number" min="1" max="12" inputmode="numeric"></label>
        <label>Objetivo activo (kcal) <input v-model.number="form.moveGoalKcal" class="field" type="number" step="50"></label>
      </div>
      <label class="row small"><input v-model="form.autoUploadStrava" type="checkbox"> Subir sesiones de fuerza a Strava automáticamente</label>
      <p class="muted small" style="margin: 0">Basal estimado: {{ Math.round(bmr(form.profile)) }} kcal</p>
      <button class="btn">Guardar</button>
    </form>
  </main>
</template>

<style scoped>
.avatar {
  width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; flex: none;
  background: linear-gradient(180deg, #a5a5ab, #85858b); color: #fff; font-size: 20px; font-weight: 600;
}
.avatar.small { width: 30px; height: 30px; font-size: 14px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: var(--muted); }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--line); flex: none; }
.dot.on { background: var(--exercise); box-shadow: 0 0 8px var(--exercise); }
code { background: var(--raised); padding: 1px 5px; border-radius: 5px; color: var(--text); word-break: break-all; }
</style>
