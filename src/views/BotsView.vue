<script setup lang="ts">
import { onMounted, ref } from "vue";
import { BButton, BAlert, BSpinner } from "bootstrap-vue-next";
import { useBots } from "@/composables/useBots";
import CreateBotDialog from "@/components/CreateBotDialog.vue";

const {
  page,
  bots,
  total,
  pageCount,
  loading,
  error,
  slow,
  load,
  goTo,
  retry,
} = useBots();

const showCreate = ref(false);

onMounted(load);

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}
</script>

<template>
  <div class="container-fluid py-4 px-4">
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h1 class="h4 mb-1">Bots</h1>
        <p class="text-body-secondary mb-0">
          {{ total }} {{ total === 1 ? "bot" : "bots" }}
        </p>
      </div>
      <BButton variant="primary" @click="showCreate = true">
        <i class="bi bi-plus-lg me-1" />Create bot
      </BButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <BSpinner />
      <p v-if="slow" class="text-body-secondary small mt-3 mb-0">
        Still working — the server is taking longer than usual.
      </p>
    </div>

    <!-- Error -->
    <BAlert
      v-else-if="error"
      :model-value="true"
      variant="danger"
      class="d-flex justify-content-between align-items-center"
    >
      <span>{{ error }}</span>
      <BButton variant="outline-danger" size="sm" @click="retry">Retry</BButton>
    </BAlert>

    <!-- Empty -->
    <div v-else-if="!bots.length" class="text-center border rounded py-5 px-3">
      <i class="bi bi-robot fs-1 text-body-secondary d-block mb-2" />
      <p class="fw-semibold mb-1">No bots yet</p>
      <p class="text-body-secondary mb-3">
        Create your first bot to start building a knowledge base.
      </p>
      <BButton variant="primary" @click="showCreate = true">Create bot</BButton>
    </div>

    <!-- Table -->
    <div v-else>
      <div class="table-responsive border rounded">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bot in bots" :key="bot._id">
              <td>
                <span class="fw-semibold">{{ bot.name }}</span>
                <div class="small text-body-secondary">
                  {{ bot.description }}
                </div>
              </td>
              <td>{{ bot.status }}</td>
              <td class="text-nowrap">{{ formatDate(bot.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="pageCount > 1"
        class="d-flex justify-content-between align-items-center mt-3"
      >
        <small class="text-body-secondary"
          >Page {{ page }} of {{ pageCount }}</small
        >
        <div class="d-flex gap-2">
          <BButton
            size="sm"
            variant="outline-secondary"
            :disabled="page <= 1"
            @click="goTo(page - 1)"
          >
            Previous
          </BButton>
          <BButton
            size="sm"
            variant="outline-secondary"
            :disabled="page >= pageCount"
            @click="goTo(page + 1)"
          >
            Next
          </BButton>
        </div>
      </div>
    </div>

    <CreateBotDialog v-model="showCreate" @created="load" />
  </div>
</template>
