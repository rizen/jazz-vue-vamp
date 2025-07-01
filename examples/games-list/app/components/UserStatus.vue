<template>
  <div class="user-status flex items-center gap-2">
    <div v-if="isAuthenticated && username" class="flex items-center gap-2">
      <NuxtLink 
        to="/profile" 
        :title="`Click to edit your profile (${username})`"
        class="hover:opacity-80 transition-opacity"
      >
        <PAvatar 
          :label="userInitials" 
          class="bg-blue-200 text-blue-800 cursor-pointer"
          size="normal"
          shape="circle"
        />
      </NuxtLink>
      <NuxtLink 
        to="/profile" 
        class="font-medium hover:text-blue-600 transition-colors cursor-pointer"
        :title="`Click to edit your profile (${username})`"
      >
        {{ username }}
      </NuxtLink>
    </div>
    <div v-else class="text-gray-500">Not signed in</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccount } from 'jazz-vue-vamp'

const { me } = useAccount()

const isAuthenticated = computed(() => !!me.value)
const username = computed(() => {
  if (!me.value) return ''
  return me.value.profile?.name || 'Anonymous User'
})

const userInitials = computed(() => {
  if (!username.value) return '?'
  return username.value
    .split(' ')
    .map((name: string) => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script> 