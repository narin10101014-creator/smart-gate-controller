<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { api, ApiError } from '../services/api';

const authStore = useAuthStore();
const router = useRouter();

const gate = ref({ status: 'unknown', updatedAt: null });
const logs = ref([]);
const isBusy = ref(false);
const errorMessage = ref('');
let pollHandle = null;

async function refresh() {
  try {
    const [statusData, logsData] = await Promise.all([api.getStatus(), api.getLogs()]);
    gate.value = statusData.gate;
    logs.value = logsData.logs;
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 401)) {
      errorMessage.value = err.message;
    }
  }
}

async function sendAction(action) {
  isBusy.value = true;
  errorMessage.value = '';
  try {
    const data = await api.control(action);
    gate.value = data.gate;
    await refresh();
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 401)) {
      errorMessage.value = err.message;
    }
  } finally {
    isBusy.value = false;
  }
}

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'login' });
}

onMounted(() => {
  refresh();
  pollHandle = setInterval(refresh, 5000);
});
onUnmounted(() => clearInterval(pollHandle));
</script>

<template>
  <div class="container">
    <header class="row">
      <div>
        <strong>{{ authStore.user?.username }}</strong>
        <span class="badge">{{ authStore.user?.role }}</span>
      </div>
      <button class="btn btn-danger" @click="handleLogout">Log out</button>
    </header>

    <section class="card">
      <p class="status-pill" :class="gate.status">{{ gate.status }}</p>
      <p v-if="gate.updatedAt" class="muted">
        Updated {{ new Date(gate.updatedAt).toLocaleString() }}
      </p>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <div class="controls">
        <button class="btn btn-primary" :disabled="isBusy" @click="sendAction('open')">Open</button>
        <button class="btn btn-danger" :disabled="isBusy" @click="sendAction('close')">Close</button>
        <button class="btn" :disabled="isBusy" @click="sendAction('toggle')">Toggle</button>
      </div>
    </section>

    <section class="card">
      <h2>Recent activity</h2>
      <ul class="log-list">
        <li v-for="log in logs" :key="log.id">
          <span class="muted">{{ new Date(log.timestamp).toLocaleTimeString() }}</span>
          — {{ log.message }} <span class="muted">({{ log.user }})</span>
        </li>
      </ul>
    </section>
  </div>
</template>
