<template>
  <PButton 
    @click="handleLogout" 
    label="Sign Out" 
    icon="pi pi-sign-out" 
    severity="secondary" 
    outlined 
    size="small"
  />
</template>

<script setup lang="ts">
import { useAccount } from 'jazz-vue-vamp'

const { logOut } = useAccount()

const handleLogout = async () => {
  try {
    await logOut()
    navigateTo('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>