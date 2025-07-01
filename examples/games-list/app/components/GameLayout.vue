<template>
  <div class="p-4">
    <PCard>
      <template #title>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <PButton @click="navigateTo('/games')" label="Back to Games" icon="pi pi-arrow-left" severity="secondary" outlined />
            <h1 class="text-2xl font-bold text-gray-900">{{ game?.name }} <span v-if="pageTitle">{{ pageTitle }}</span></h1>
          </div>
          <div class="flex gap-3">
            <PButton @click="deleteGame(game)" label="Delete Game" icon="pi pi-trash" severity="danger" outlined />
          </div>
        </div>
      </template>

      <template #content>
        <div v-if="game">
          <!-- Tab Navigation -->
          <div class="mb-6">
            <nav class="flex space-x-8" aria-label="Tabs">
              <NuxtLink 
                v-for="link in [
                    {
                      label: 'Game',
                      to: `/games/${game?.id}`
                    },
                    {
                      label: 'Collaborators',
                      to: `/games/${game?.id}/collaborators`
                    }
                  ]" 
                :key="link.label" 
                :to="link.to" 
                :class="[ $route.path === link.to ? 'border-blue-500 text-blue-900' : 'border-transparent text-gray-500', 'hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm' ]"
              >
                {{ link.label }}
              </NuxtLink>
      
            </nav>
          </div>

          <!-- Page Content Slot -->
          <slot name="content"></slot>
        </div>

        <div v-else-if="!game" class="text-center py-16">
          <div class="max-w-md mx-auto">
            <div v-if="isCheckingAccess" class="mb-6">
              <i class="pi pi-spin pi-spinner text-6xl text-blue-400 mb-4"></i>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">
                {{ processingInvitation ? 'Processing Invitation' : 'Loading Game' }}
              </h2>
              <p class="text-gray-600">
                {{ processingInvitation 
                  ? 'Please wait while we process your game invitation and grant you access...' 
                  : 'Please wait while we load the game details...' 
                }}
              </p>
            </div>
            
            <div v-else class="mb-6">
              <i class="pi pi-lock text-6xl text-amber-400 mb-4"></i>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p class="text-gray-600 mb-6">
                You don't have permission to access this game. You may need to be invited by the game owner.
              </p>
              
              <div class="space-y-3">
                <PButton 
                  @click="navigateTo('/games')" 
                  label="Back to My Games" 
                  icon="pi pi-arrow-left"
                  severity="primary"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-16">
          <div class="max-w-md mx-auto">
            <div class="mb-6">
              <i class="pi pi-exclamation-triangle text-6xl text-amber-400 mb-4"></i>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Game Not Found</h2>
              <p class="text-gray-600 mb-6">
                The game you're looking for doesn't exist or may have been deleted.
              </p>
            </div>
            
            <div class="space-y-4">
              <PButton 
                @click="navigateTo('/games')" 
                label="Back to Games List" 
                icon="pi pi-arrow-left"
                severity="primary"
                class="w-full"
              />
              <PButton 
                @click="navigateTo('/')" 
                label="Create New Game" 
                icon="pi pi-plus"
                severity="secondary"
                outlined
                class="w-full"
              />
            </div>
          </div>
        </div>
      </template>
    </PCard>
    
    <!-- Additional slots for modals or other content -->
    <slot name="modals"></slot>
  </div>
</template>

<script setup lang="ts">
import { useAccount } from 'jazz-vue-vamp'

const { me } = useAccount()

interface Props {
  game: any
  isCheckingAccess: boolean
  pageTitle?: string
  processingInvitation?: boolean
}

defineProps<Props>()

const deleteGame = async (game: any) => {
  const index = me.value.root.games.findIndex((g: any) => g.id === game.id);
  me.value.root.games.splice(index,1);
  navigateTo('/games');
}

</script> 