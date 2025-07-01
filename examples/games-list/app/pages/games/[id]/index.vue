<template>
  <GameLayout 
    :game="game" 
    :isCheckingAccess="isCheckingAccess"
    :processingInvitation="hasInvitation && !inviteProcessed"
  >
    <template #content>
      <!-- Editor Content -->
      <div class="space-y-6">
            <!-- Game Settings -->
            <PPanel header="Game Settings" class="mb-3">
              <div class="space-y-4">
                <!-- Game Name Field -->
                <div class="mb-3">
                  <div class="flex justify-between items-center mb-1">
                    <label for="gameName" class="block text-sm font-medium text-gray-700">Game Name</label>
                    <FieldHistoryButton 
                      fieldName="name"
                      fieldLabel="Game Name"
                      :edits="game?._edits?.name?.all || []"
                      :onRestore="restoreVersion"
                      :currentUser="me"
                      ref="nameHistoryRef"
                    />
                  </div>
                  <PInputText 
                    id="gameName" 
                    v-model="game!.name" 
                    maxlength="60" 
                    class="w-full"
                  />
                  <div class="text-xs text-gray-500">
                    {{ game?.name?.length || 0 }}/60 characters
                  </div>
                </div>

                <!-- Description Field -->
                <div class="mb-3">
                  <div class="flex justify-between items-center mb-1">
                    <label for="gameDescription" class="block text-sm font-medium text-gray-700">Description</label>
                    <FieldHistoryButton 
                      fieldName="description"
                      fieldLabel="Description"
                      :edits="game?._edits?.description?.all || []"
                      :onRestore="restoreVersion"
                      :currentUser="me"
                      ref="descriptionHistoryRef"
                    />
                  </div>
                  <PTextarea 
                    id="gameDescription" 
                    v-model="game!.description" 
                    rows="4" 
                    class="w-full"
                  />
                </div>

                <!-- Notes Field -->
                <div class="mb-3">
                  <div class="flex justify-between items-center mb-1">
                    <label for="gameNotes" class="block text-sm font-medium text-gray-700">Notes</label>
                    <FieldHistoryButton 
                      fieldName="notes"
                      fieldLabel="Notes"
                      :edits="game?._edits?.notes?.all || []"
                      :onRestore="restoreVersion"
                      :currentUser="me"
                      ref="notesHistoryRef"
                    />
                  </div>
                  <PTextarea 
                    id="gameNotes" 
                    v-model="game!.notes" 
                    rows="4" 
                    class="w-full"
                  />
                </div>

                <!-- Archive Status -->
                <div class="mb-3">
                  <div class="flex justify-between items-center mb-1">
                    <label class="block text-sm font-medium text-gray-700">Archive Status</label>
                    <FieldHistoryButton 
                      fieldName="archived"
                      fieldLabel="Archive Status"
                      :edits="game?._edits?.archived?.all || []"
                      :onRestore="restoreVersion"
                      :currentUser="me"
                      ref="archivedHistoryRef"
                    />
                  </div>
                  <PSelectButton 
                    v-model="game!.archived" 
                    :options="archiveOptions" 
                    optionLabel="label"
                    optionValue="value" 
                    class="w-full"
                  />
                  <div class="text-xs text-gray-500">
                    Archived games won't appear in the main games list
                  </div>
                </div>
              </div>
            </PPanel>

            <!-- Game Information -->
            <PPanel header="Game Information" class="mb-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="flex flex-col gap-2">
                  <label class="block text-sm font-medium text-gray-700">Created</label>
                  <p class="text-sm text-gray-600">{{ formatDate(game?._createdAt) }}</p>
                </div>
                <div class="flex flex-col gap-2">
                  <label class="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p class="text-sm text-gray-600">{{ formatDate(game?._lastUpdatedAt) }}</p>
                </div>
                <div class="flex flex-col gap-2">
                  <label class="block text-sm font-medium text-gray-700">Game ID</label>
                  <p class="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-2 rounded">{{ game?.id }}</p>
                </div>
              </div>
              
              <!-- Full Version History Button -->
              <div class="mt-4 pt-4 border-t">
                <PButton 
                  @click="showFullHistory = true" 
                  label="View Full Version History" 
                  icon="pi pi-history"
                  severity="secondary"
                  outlined
                />
              </div>
            </PPanel>
          </div>
    </template>

    <template #modals>
      <!-- Full Version History Modal -->
      <PDialog 
        v-model:visible="showFullHistory" 
        header="Full Version History" 
        :style="{ width: '900px' }"
        modal
      >
        <div class="space-y-4">
          <!-- Overall Edit History -->
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div v-for="(edit, index) in getAllEdits()" :key="index" class="text-sm p-2 bg-gray-50 rounded">
              <div class="text-xs text-gray-500">
                {{ formatDate(edit.madeAt) }}
              </div>
              <div class="text-gray-700">
                <span class="font-medium">{{ edit.by?.profile?.name || 'Unknown' }}</span>
                changed
                <span class="font-medium">{{ getFieldLabel(edit.fieldName) }}</span>
                to
                <span class="font-medium">{{ formatFieldValue(edit.fieldName, edit.value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </PDialog>
    </template>
  </GameLayout>
</template>

<script setup lang="ts">
import { useCoState, useAcceptInvite } from 'jazz-vue-vamp'
import { GameSchema, GameSchemaFields } from '../../../../jazz/schema'
import { formatDate } from '../../../utils/date'
import { anySchemaToCoSchema, subscribeToCoValue } from 'jazz-tools'



const showFullHistory = ref(false)
const route = useRoute()
const { me } = useAuthGuard()

// Access control state
const isCheckingAccess = ref(true)
const inviteProcessing = ref(false)
const inviteProcessed = ref(false)

// Check if there's an invitation in the URL hash on client side
const hasInvitation = ref(false)

// Handle game invitations first
useAcceptInvite({
  invitedObjectSchema: GameSchema,
  onAccept: async (gameIdFromInvite: string) => {
    console.log('✅ Game invitation accepted for:', gameIdFromInvite)
    
    inviteProcessing.value = true
    
    try {
      // Ensure the user's games list is properly loaded
      const user = await me.value.ensureLoaded({
        resolve: {
          root: {
            games: true
          }
        }
      })
      console.log('User with loaded games:', user)
      console.log('Games list after ensureLoaded:', user.root.games)

      // Load the game using subscription approach (GameSchema.load gives "No active account" error)
      console.log('Loading game via subscription...')
      const gameLoadPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout loading game'))
        }, 10000) // 10 second timeout
        
        const unsubscribe = subscribeToCoValue(
          anySchemaToCoSchema(GameSchema),
          gameIdFromInvite,
          {
            loadAs: me.value,
            syncResolution: true,
          },
          (game: any) => {
            if (game) {
              clearTimeout(timeoutId)
              resolve(game)
              unsubscribe()
            }
          }
        )
      })
      
      const game = await gameLoadPromise as any
      console.log('Loaded game via subscription:', game)

      if (!game) {
        throw new Error('Could not load game')
      }

      // Check if game is already in games list
      if (user.root.games.find((g: any) => g?.id === gameIdFromInvite)) {
        console.log('Game already in games list')
      } else {
        // Add the game to the user's games list
        console.log('Adding game to games list...')
        user.root.games.push(game)
        console.log('✅ Added game to games list:', game.name)
        console.log('Games list length after adding:', user.root.games.length)
      }
      
      inviteProcessed.value = true
      
    } catch (addError: any) {
      console.error('❌ Failed to add game to games list:', addError)
      inviteProcessed.value = true // Still mark as processed even if failed
    } finally {
      inviteProcessing.value = false
    }
  }
})

// Check for invitation and manage loading state
onMounted(() => {
  hasInvitation.value = !!(window.location.hash && window.location.hash.includes('/invite/'))
  
  // If no invitation, stop checking access after normal timeout
  if (!hasInvitation.value) {
    setTimeout(() => {
      isCheckingAccess.value = false
    }, 5000)
  }
})

// Update access checking state based on invitation processing
watch([inviteProcessed, hasInvitation], ([processed, hasInvite]) => {
  if (hasInvite && processed) {
    // Invitation has been processed, stop checking access
    isCheckingAccess.value = false
  }
})

// Load game - this will initially throw a console error if user doesn't have access yet (during invitation processing)
// This is expected behavior and doesn't affect functionality - Jazz will report access denied until invitation is processed
const game = useCoState(GameSchema, route.params.id as string)



const archiveOptions = [
  { label: 'Active', value: false },
  { label: 'Archived', value: true }
]



// Define the actual field names from the schema
type GameField = keyof typeof GameSchemaFields

const restoreVersion = async (fieldName: GameField, value: any) => {
  if (!game.value) return
  try {
    // Use type assertion since TypeScript can't infer the types correctly
    (game.value as any)[fieldName] = value
  } catch (error) {
    // Handle error silently
  }
}

// Helper function to get user-friendly field labels
const getFieldLabel = (fieldName: GameField): string => {
  const labels: Record<GameField, string> = {
    name: 'Game Name',
    description: 'Description', 
    notes: 'Notes',
    archived: 'Archive Status'
  }
  return labels[fieldName] || String(fieldName)
}

// Helper function to format field values
const formatFieldValue = (fieldName: GameField, value: unknown): string => {
  if (fieldName === 'archived') {
    return Boolean(value) ? 'Archived' : 'Active'
  }
  return String(value)
}

interface Edit {
  value: unknown
  madeAt: string
  by?: {
    profile?: {
      name?: string
    }
  }
  fieldName: GameField
}

// Get all edits for full history
const getAllEdits = (): Edit[] => {
  if (!game.value?._edits) return []
  
  try {
    const allEdits: Edit[] = []
    const validFields = Object.keys(GameSchemaFields) as GameField[]
    
    // Collect edits from all fields
    validFields.forEach((fieldName) => {
      const fieldEdits = game.value?._edits[fieldName]?.all
      if (fieldEdits && Array.isArray(fieldEdits)) {
        fieldEdits.forEach((edit: any) => {
          allEdits.push({
            ...edit,
            fieldName: fieldName
          })
        })
      }
    })
    
    // Sort by timestamp (newest first)
    return allEdits.sort((a, b) => Date.parse(b.madeAt) - Date.parse(a.madeAt))
  } catch (error) {
    return []
  }
}

</script> 