<script setup lang="ts">
import { ref } from "vue";
import { BButton, BAlert } from "bootstrap-vue-next";

const pinged = ref(false);
</script>

<template>
  <div class="container py-4">
    <h1 class="h4">Bots</h1>
    <p class="text-body-secondary">Not built yet — SUBTASK-2.2.</p>
    <BButton variant="primary" @click="pinged = true"
      >Component library check</BButton
    >
    <BAlert v-if="pinged" :model-value="true" variant="success" class="mt-3">
      anish0m checked : bootstrap-vue-next is wired.
    </BAlert>
  </div>
</template>
