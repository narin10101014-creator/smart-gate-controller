<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
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
        <input v-model="password" type="password" autocomplete="current-password" required />
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
