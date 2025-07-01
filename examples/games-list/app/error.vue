<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div>

    <div>{{ error.statusCode }}</div>

    <div>{{ error.message }}</div>

    <div v-html="error.stack"></div>

  </div>
</template>