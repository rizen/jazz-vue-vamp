<template>
  <div class="min-h-screen bg-gray-100 font-sans">
    <JazzVueProvider 
      :sync="sync" 
      :guestMode="false"
      :AccountSchema="JazzAccount"
    >
      <NuxtPage />
    </JazzVueProvider>
  </div>
</template>

<script setup>
import { JazzVueProvider } from 'jazz-vue-vamp';
import { JazzAccount } from '../jazz/schema';

// Create Jazz sync configuration with authentication
const runtimeConfig = useRuntimeConfig();

const sync = {
  peer: runtimeConfig.public.jazz_sync_peer ,
}
</script>


