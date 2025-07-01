<template>
  <GameLayout 
    :game="game" 
    :isCheckingAccess="isCheckingAccess" 
    pageTitle="Collaborators"
  >
    <template #content>
      <!-- Collaborators Content -->
      <div class="space-y-6">
            <!-- Invitation Link -->
            <PPanel header="Invite Collaborators" class="mb-3">
              <div v-if="game" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Create Invitation Link
                  </label>
                  <p class="text-sm text-gray-600 mb-4">
                    Generate a link to invite others to collaborate on this game. Choose their permission level below.
                  </p>
                  
                  <!-- Role Selection -->
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Permission Level</label>
                    <PSelectButton 
                      v-model="inviteRole" 
                      :options="roleOptions" 
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                    />
                    <div class="text-xs text-gray-500 mt-1">
                      <strong>Writer:</strong> Can edit game content. <strong>Admin:</strong> Can edit content and manage other collaborators.
                    </div>
                  </div>

                  <!-- Generate Button -->
                  <div class="mb-4">
                    <PButton 
                      @click="generateInviteLink"
                      label="Generate Invitation Link"
                      icon="pi pi-link"
                      class="w-full"
                    />
                  </div>

                  <!-- Invitation Link Display -->
                  <div v-if="invitationLink">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Invitation Link</label>
                    <div class="flex gap-2">
                      <PInputText 
                        :value="invitationLink"
                        readonly 
                        class="flex-1"
                      />
                      <PButton 
                        @click="copyInvitationLink"
                        label="Copy"
                        icon="pi pi-copy"
                        severity="secondary"
                      />
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      Anyone with this link can join as a <strong>{{ inviteRole }}</strong>
                    </div>
                  </div>

                  <!-- Success Message -->
                  <div v-if="copySuccess" class="mt-4">
                    <div class="bg-green-50 border border-green-200 rounded-md p-3">
                      <div class="flex">
                        <i class="pi pi-check-circle text-green-400 mr-2"></i>
                        <div class="text-sm text-green-700">
                          <strong>Link copied!</strong> The invitation link has been copied to your clipboard and can now be shared.
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Error Display -->
                  <div v-if="linkError" class="mt-4">
                    <div class="bg-red-50 border border-red-200 rounded-md p-3">
                      <div class="flex">
                        <i class="pi pi-exclamation-circle text-red-400 mr-2"></i>
                        <div class="text-sm text-red-700">
                          <strong>Error:</strong> {{ linkError }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Loading State -->
              <div v-else class="flex items-center justify-center py-8">
                <div class="text-center">
                  <i class="pi pi-spin pi-spinner text-2xl text-blue-400 mb-2"></i>
                  <p class="text-sm text-gray-500">Loading game...</p>
                </div>
              </div>
            </PPanel>

            <!-- Current Collaborators -->
            <PPanel header="Current Collaborators" class="mb-3">
              <div v-if="game" class="space-y-4">
                <p class="text-sm text-gray-600 mb-4">
                  People who currently have access to this game.
                </p>

                <!-- Collaborators List -->
                <div v-if="collaborators && collaborators.length > 0" class="space-y-3">
                  <div 
                    v-for="collaborator in collaborators" 
                    :key="collaborator.id"
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {{ getInitials(collaborator.profile?.name || 'Unknown') }}
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ collaborator.profile?.name || 'Unknown User' }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ collaborator.role }}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <PBadge 
                        :value="collaborator.role" 
                        :severity="collaborator.role === 'admin' ? 'danger' : 'info'"
                        class="text-xs"
                      />
                      <PButton 
                        v-if="collaborator.id !== me?.id"
                        @click="removeCollaborator(collaborator)"
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        outlined
                        :title="`Remove ${collaborator.profile?.name || 'this user'} from the game`"
                      />
                    </div>
                  </div>
                </div>

                <!-- No Collaborators State -->
                <div v-else class="text-center py-8">
                  <i class="pi pi-users text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-600">No collaborators yet.</p>
                  <p class="text-sm text-gray-500">Use the invitation link above to invite people to collaborate.</p>
                </div>
              </div>

              <!-- Loading State -->
              <div v-else class="flex items-center justify-center py-8">
                <div class="text-center">
                  <i class="pi pi-spin pi-spinner text-2xl text-blue-400 mb-2"></i>
                  <p class="text-sm text-gray-500">Loading collaborators...</p>
                </div>
              </div>
            </PPanel>
          </div>
    </template>
  </GameLayout>
</template>

<script setup lang="ts">
import { useCoState, createInviteLink } from 'jazz-vue-vamp'
import { GameSchema } from '../../../../jazz/schema'
import { Group } from 'jazz-tools'

const inviteRole = ref('writer')
const invitationLink = ref('')
const linkError = ref('')
const copySuccess = ref(false)
const route = useRoute()
const { me } = useAuthGuard()

// Access control state
const isCheckingAccess = ref(true)

// Set a timeout to stop showing loading state after reasonable time
setTimeout(() => {
  isCheckingAccess.value = false
}, 5000) // 5 seconds timeout

// Load game
const game = useCoState(GameSchema, route.params.id as string);

// Get the game's group for collaboration  
const gameGroup = computed(() => game.value?._owner)

const roleOptions = [
  { label: 'Writer', value: 'writer' },
  { label: 'Admin', value: 'admin' }
]

// Invitation link functions using jazz-vue-vamp's createInviteLink
const generateInviteLink = async () => {
  try {
    if (!game.value) {
      linkError.value = 'Game not loaded'
      return
    }
    
    const role = inviteRole.value as 'writer' | 'admin'
    
    // Use jazz-vue-vamp's createInviteLink function with the same signature as jazz-tools
    const rawInviteURL = createInviteLink(game.value, role)
    
    // Parse the generated URL to get the proper hash format
    const url = new URL(rawInviteURL)
    // Keep the original hash format that useAcceptInvite expects
    const originalHash = url.hash // This will be something like #/invite/gameId/inviteSecret
    
    // Create a URL that goes to the game page but preserves the invitation hash format
    const gameURL = `${url.origin}/games/${game.value.id}${originalHash}`
    
    invitationLink.value = gameURL
    linkError.value = ''
    copySuccess.value = false // Reset success message when generating new link
  } catch (error) {
    linkError.value = String(error)
    invitationLink.value = ''
    copySuccess.value = false
  }
}

const copyInvitationLink = async () => {
  if (!invitationLink.value) return
  
  try {
    await navigator.clipboard.writeText(invitationLink.value)
    // Clear the link after copying since it can only be used once
    invitationLink.value = ''
    linkError.value = ''
    
    // Show success message briefly
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  } catch (error) {
    linkError.value = 'Failed to copy link to clipboard'
  }
}

// Get list of current collaborators from the game's group
const collaborators = computed(() => {
  if (!gameGroup.value) return []
  
  try {
    const group = gameGroup.value as Group
    
    // Use Jazz Group's members property to get all group members
    if (group.members) {
      return group.members.map((member: any) => ({
        id: member.account.id,
        profile: member.account.profile,
        role: group.getRoleOf(member.account.id) || 'writer',
        account: member.account // Keep reference to the actual account object
      }))
    }
    
    return []
  } catch (error) {
    return []
  }
})

// Helper function to get user initials
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// Function to remove a collaborator from the game
const removeCollaborator = async (collaborator: any) => {
  try {
    if (!gameGroup.value) {
      linkError.value = 'Cannot access game group'
      return
    }

    const group = gameGroup.value as Group
    
    // Use the account object directly from the collaborator
    if (collaborator.account) {
      await group.removeMember(collaborator.account)
    } else {
      linkError.value = 'Could not access user account'
      return
    }
    
    linkError.value = '' // Clear any previous errors
  } catch (error) {
    linkError.value = `Failed to remove collaborator: ${String(error)}`
  }
}




</script> 