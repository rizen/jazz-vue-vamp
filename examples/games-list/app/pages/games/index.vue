<template>
  <div class="p-4">

    <div class="flex items-center justify-between mb-6">
      <UserStatus />
      <LogoutButton />
    </div>
    
    <!-- Main content -->
      <PCard>
        <template #title>
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900">My Games</h1>
            <PButton 
              @click="showCreateForm = true" 
              label="Create New Game" 
              icon="pi pi-plus" 
              :disabled="!canCreateGames"
              :title="!canCreateGames ? 'Loading account...' : 'Create a new game'"
            />
          </div>
        </template>
        <template #content>
          <!-- Loading State -->
          <div v-if="!canCreateGames" class="text-center py-16">
            <div class="max-w-md mx-auto">
              <div class="mb-6">
                <i class="pi pi-spin pi-spinner text-6xl text-blue-400 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Setting up your account...</h2>
                <p class="text-gray-600">
                  Please wait while we initialize your game library.
                </p>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div v-else>
            <!-- Search and Filter Controls -->
            <div class="flex gap-4 mb-6 items-center">
              <PInputText v-model="searchQuery" placeholder="Search games by name..." class="w-80" />
              <PSelect v-model="filterType" :options="filterOptions" optionLabel="label" optionValue="value" placeholder="Filter games" class="w-48" />
            </div>
          <!-- Games Table -->
          <PDataTable 
            :value="filteredGames" 
            emptyMessage="There are no games to display." 
            stripedRows 
            showGridlines
          >
            <PColumn field="name" header="Name">
              <template #body="{ data }">
                <div v-if="data">
                  <button @click="editGame(data)" class="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left">
                    {{ data.name }}
                  </button>
                </div>
              </template>
            </PColumn>
            
            <PColumn field="type" header="Type">
              <template #body="{ data }">
                <div v-if="data">
                  <PBadge v-if="data.isShared" value="Shared" severity="secondary" class="text-xs" />
                  <PBadge v-else value="Owned" severity="primary" class="text-xs" />
                </div>
              </template>
            </PColumn>

            <PColumn header="Actions">
              <template #body="{ data }">
                <!-- Actions for owned games -->
                <PSplitButton v-if="data && !data.isShared" @click="editGame(data)" :model="[
                  {
                    label: data.archived ? 'Unarchive' : 'Archive',
                    icon: data.archived ? 'pi pi-eye' : 'pi pi-eye-slash',
                    command: () => toggleArchive(data)
                  },
                  {
                    label: 'Delete',
                    icon: 'pi pi-trash',
                    command: () => deleteGame(data)
                  }
                ]" label="Edit" icon="pi pi-pencil" severity="success" size="small" />
                
                <!-- Actions for shared games -->
                <PSplitButton v-else-if="data && data.isShared" @click="editGame(data)" :model="[
                  {
                    label: 'Leave Game',
                    icon: 'pi pi-sign-out',
                    command: () => leaveSharedGame(data)
                  }
                ]" label="Edit" icon="pi pi-pencil" severity="info" size="small" />
              </template>
            </PColumn>
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">There are no games to display.</p>
              </div>
            </template>
          </PDataTable>
          </div>
        </template>
      </PCard>
      <!-- Create Game Modal -->
      <PDialog v-model:visible="showCreateForm" modal header="Create New Game" :style="{ width: '500px' }">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Game Name *</label>
            <PInputText v-model="newGame.name" placeholder="Enter game name..." maxlength="60" class="w-full" />
            <p class="text-xs text-gray-500 mt-1">{{ newGame.name.length }}/60 characters</p>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <PButton @click="showCreateForm = false" label="Cancel" severity="secondary" outlined />
            <PButton 
              @click="createGame" 
              label="Create Game" 
              :disabled="!newGame.name.trim() || !canCreateGames"
              :title="!canCreateGames ? 'Account not ready' : ''"
            />
          </div>
        </template>
      </PDialog>
    
  </div>
</template>

<script setup lang="ts">
import { GameSchema } from '../../../jazz/schema'
import { Group } from 'jazz-tools'

const { me } = useAuthGuard()

const searchQuery = ref('')
const filterType = ref('active')
const showCreateForm = ref(false)
const newGame = ref({ name: '' })

// Check if the Jazz system is ready for creating games
const canCreateGames = computed(() => {
  return Boolean(me.value?.id && me.value?.root?.games)
})

const filteredGames = computed(() => {
  // Get all games from the single games list and filter out null entries
  const allGames = Array.isArray(me.value?.root?.games) ? 
    me.value.root.games.filter((game: any) => game != null) : [];
  
  // Debug logging
  console.log('=== GAMES LIST DEBUG ===')
  console.log('me.value.root.games (raw):', me.value?.root?.games)
  console.log('allGames (filtered):', allGames)
  console.log('allGames length:', allGames.length)
  
  // Add metadata to each game to determine if it's owned or shared
  const gamesWithMetadata = allGames.map((game: any) => {
    // Use Jazz permissions to determine if user owns (can admin) this game
    const isOwned = me.value ? me.value.canAdmin(game) : false;
    
    console.log(`Game ${game.name} (${game.id}):`, {
      isOwned,
      canAdmin: isOwned,
      canWrite: me.value ? me.value.canWrite(game) : false,
      canRead: me.value ? me.value.canRead(game) : false
    })
    
    return {
      ...game,
      id: game.id || game._id || 'missing-id',
      isShared: !isOwned
    };
  });
  
  // Apply search filter
  let filtered = gamesWithMetadata;
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = gamesWithMetadata.filter((g: any) => 
      g?.name?.toLowerCase().includes(query) ||
      g?.description?.toLowerCase().includes(query)
    );
  }
  
  // Apply type filter
  if (filterType.value === 'active') {
    return filtered.filter((g: any) => !g?.archived);
  } else if (filterType.value === 'archived') {
    return filtered.filter((g: any) => g?.archived);  
  } else if (filterType.value === 'owned') {
    return filtered.filter((g: any) => !g?.isShared);
  } else if (filterType.value === 'shared') {
    return filtered.filter((g: any) => g?.isShared);
  } else {
    return filtered;
  }
});

const filterOptions = [
  { label: 'Active Games', value: 'active' },
  { label: 'Archived Games', value: 'archived' },
  { label: 'All Games', value: 'all' },
  { label: 'Owned Games Only', value: 'owned' },
  { label: 'Shared Games Only', value: 'shared' }
]

const createGame = async () => {
    // Ensure Jazz system and user account are ready
    if (!me.value?.id || !me.value?.root?.games) {
      return
    }

    try {
      // Create a new group for this game (enables collaboration)
      const gameGroup = Group.create(me.value)
      
      // Create the game in the group
      const game = GameSchema.create({
        name: newGame.value.name.trim(),
        description: '',
        notes: '',
        archived: false,
      }, gameGroup)
      
      // Add game to user's games list
      me.value.root.games.push(game);  
      showCreateForm.value = false;
      
      // Reset form
      newGame.value.name = ''
      
      navigateTo(`/games/${game.id}`)
    } catch (error) {
      // Handle error silently
    }
}

const editGame = (game: any) => {
  // For both owned and shared games, just navigate directly using the game ID
  // The game pages can handle loading the game by ID regardless of ownership
  if (game?.id) {
    navigateTo(`/games/${game.id}`)
  }
}

const toggleArchive = async (game: any) => {
  game.archived = !game.archived;
}

const deleteGame = async (game: any) => {
  if (!me.value?.root?.games) {
    return;
  }
  
  const index = me.value.root.games.findIndex((g: any) => g.id === game.id);
  me.value.root.games.splice(index, 1);
}

const leaveSharedGame = async (game: any) => {
  if (!me.value?.root?.games) {
    return;
  }
  
  // Remove the game from the user's games list
  // Jazz will handle permissions automatically
  const index = me.value.root.games.findIndex((g: any) => g.id === game.id);
  if (index !== -1) {
    me.value.root.games.splice(index, 1);
  }
}
</script> 