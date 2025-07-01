<template>
    <div class="welcome-page flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-4xl font-bold mb-4">Welcome to your Games List</h1>
    <p class="text-lg text-gray-600 mb-8">Design, manage, and playtest your board games online.</p>
    <NuxtLink to="/games" class="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">Go to My Games</NuxtLink>
  </div>
</template>

<script setup lang="ts">
// No authentication required for the welcome page
</script>

<style scoped>
.welcome-page {
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
}
</style>
