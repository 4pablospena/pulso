<script setup lang="ts">
import type { AuthStatus } from '#shared/types'

definePageMeta({ layout: false })
const route = useRoute()
const { data: status } = useFetch<AuthStatus>('/api/auth/status')
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

async function submit() {
  busy.value = true
  error.value = null
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { username: username.value, password: password.value } })
    // Recarga completa para que todas las pantallas pidan sus datos ya con sesión.
    window.location.href = (route.query.next as string) || '/'
  } catch (e: any) {
    error.value = e?.data?.message ?? 'No se pudo iniciar sesión'
    busy.value = false
  }
}
</script>

<template>
  <main class="login">
    <img src="/icon-180.png" alt="" width="88" height="88">
    <div class="intro">
      <h1 class="title1">{{ status?.setup ? 'Bienvenido a Pulso' : 'Pulso' }}</h1>
      <p class="subhead muted">
        {{ status?.setup ? 'Crea tu cuenta de administrador: elige un usuario y escribe la contraseña de la app.' : 'Inicia sesión con tu usuario.' }}
      </p>
    </div>
    <form @submit.prevent="submit">
      <div class="group">
        <div class="list">
          <label class="list-row">
            <span class="label">Usuario</span>
            <input v-model="username" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"
                   :placeholder="status?.setup ? 'p. ej. pablo' : 'usuario'" required>
          </label>
          <label class="list-row">
            <span class="label">Contraseña</span>
            <input v-model="password" type="password" name="password" autocomplete="current-password" placeholder="Obligatoria" required>
          </label>
        </div>
      </div>
      <button class="btn" :disabled="!username || !password || busy">{{ busy ? 'Entrando…' : status?.setup ? 'Crear cuenta' : 'Iniciar sesión' }}</button>
      <p v-if="error" class="footnote" style="color: var(--red); margin: 0; text-align: center">{{ error }}</p>
    </form>
  </main>
</template>

<style scoped>
.login { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 24px 16px; }
img { border-radius: 20px; }
.intro { text-align: center; display: flex; flex-direction: column; gap: 6px; max-width: 320px; }
.intro h1, .intro p { margin: 0; }
form { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 16px; }
.group > .list > * { padding: 0 16px; }
.label { width: 96px; flex: none; }
input { flex: 1; min-width: 0; background: none; border: 0; outline: none; font-size: 17px; height: 44px; }
input::placeholder { color: var(--faint); }
</style>
