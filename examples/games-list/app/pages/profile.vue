<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-4">
          <PButton 
            @click="navigateTo('/games')" 
            label="Back to Games" 
            icon="pi pi-arrow-left" 
            severity="secondary" 
            outlined 
          />
          <h1 class="text-3xl font-bold text-gray-900">Profile Settings</h1>
        </div>
        <p class="text-gray-600">
          Manage your account information and preferences.
        </p>
      </div>

      <!-- Profile Form -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Account Information</h2>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Profile Name -->
          <div>
            <label for="profileName" class="block text-sm font-medium text-gray-700 mb-2">
              Profile Name
            </label>
            <div class="max-w-lg">
              <PInputText
                id="profileName"
                v-model="profileName"
                placeholder="Enter your name"
                class="w-full"
                maxlength="50"
                :disabled="isSaving"
              />
              <div class="mt-1 text-xs text-gray-500">
                {{ profileName.length }}/50 characters
              </div>
              <p class="mt-2 text-sm text-gray-600">
                This is the name that will be displayed to other users when collaborating on games. Changes are saved automatically.
              </p>
            </div>
          </div>

          <!-- Status Messages -->
          <div v-if="showSuccess" class="bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
              <i class="pi pi-check-circle text-green-400 mr-2"></i>
              <div class="text-sm text-green-700">
                Profile updated successfully!
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <i class="pi pi-exclamation-circle text-red-400 mr-2"></i>
              <div class="text-sm text-red-700">
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Information -->
      <div class="bg-white shadow rounded-lg mt-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Account Information</h2>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900">Account ID</h3>
                <p class="text-xs text-gray-600 font-mono mt-1">
                  {{ me?.id || 'Loading...' }}
                </p>
              </div>
              <i class="pi pi-info-circle text-gray-400"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Actions -->
      <div class="bg-white shadow rounded-lg mt-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Account Actions</h2>
        </div>
        
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Sign Out</h3>
              <p class="text-sm text-gray-600">
                Sign out of your account on this device.
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthGuard } from '../composables/useAuthGuard'

const { me } = useAuthGuard()

// Form state
const profileName = ref('')
const isSaving = ref(false)
const showSuccess = ref(false)
const errorMessage = ref('')

// Load current profile data
watch(me, (user) => {
  if (user?.profile?.name) {
    profileName.value = user.profile.name
  }
}, { immediate: true })

// Auto-save functionality with debouncing
let saveTimeout: NodeJS.Timeout | null = null

const autoSaveProfile = async () => {
  if (!me.value) return
  
  isSaving.value = true
  errorMessage.value = ''
  
  try {
    // Update the profile name
    me.value.profile.name = profileName.value.trim() || 'User'
    
    // Show brief success message
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 2000)
    
  } catch (error) {
    console.error('Failed to update profile:', error)
    errorMessage.value = 'Failed to update profile. Please try again.'
  } finally {
    isSaving.value = false
  }
}

// Watch for changes and auto-save with debouncing
watch(profileName, () => {
  // Clear any existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  // Clear messages when user starts typing
  if (errorMessage.value) {
    errorMessage.value = ''
  }
  if (showSuccess.value) {
    showSuccess.value = false
  }
  
  // Set new timeout to save after user stops typing
  saveTimeout = setTimeout(() => {
    autoSaveProfile()
  }, 1000) // Save 1 second after user stops typing
})
</script>

<style scoped>
.pi {
  font-family: 'primeicons';
}
</style> 
