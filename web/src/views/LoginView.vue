<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const formError = ref('');

async function handleSubmit() {
  formError.value = '';
  if (!username.value.trim() || !password.value.trim()) {
    formError.value = 'Username and password are required';
    return;
  }
  const success = await authStore.login(username.value.trim(), password.value);
  if (success) router.push({ name: 'dashboard' });
}
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
      <button class="btn btn-primary" type="submit" :disabled="authStore.isLoggingIn">
        {{ authStore.isLoggingIn ? 'Logging in…' : 'Log in' }}
      </button>
    </form>
  </div>
</template>
