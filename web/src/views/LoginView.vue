<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const formError = ref('');
const countdown = ref(0);
let countdownTimer = null;

const formattedCountdown = computed(() => {
  const totalSeconds = countdown.value;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
});

function startCountdown(seconds) {
  clearInterval(countdownTimer);
  countdown.value = seconds;
  countdownTimer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
    }
  }, 1000);
}

async function handleSubmit() {
  formError.value = '';
  if (countdown.value > 0) return;
  if (!username.value.trim() || !password.value.trim()) {
    formError.value = 'Username and password are required';
    return;
  }
  const success = await authStore.login(username.value.trim(), password.value);
  if (success) {
    router.push({ name: 'dashboard' });
  } else if (authStore.loginRetryAfter > 0) {
    startCountdown(authStore.loginRetryAfter);
  }
}

onUnmounted(() => clearInterval(countdownTimer));
</script>

<template>
  <div class="container">
    <h1>Smart Gate</h1>
    <form class="card" @submit.prevent="handleSubmit">
      <label>
        Username
        <input v-model="username" type="text" autocomplete="username" required />
      </label>
      <label>
        Password
        <div class="password-field">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
          />
          <button
            type="button"
            class="password-toggle"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </label>
      <p v-if="formError || authStore.loginError" class="error-text">
        {{ formError || authStore.loginError }}
      </p>
      <button class="btn btn-primary" type="submit" :disabled="authStore.isLoggingIn || countdown > 0">
        {{ countdown > 0 ? `Try again in ${formattedCountdown}` : (authStore.isLoggingIn ? 'Logging in…' : 'Log in') }}
      </button>
    </form>
  </div>
</template>
