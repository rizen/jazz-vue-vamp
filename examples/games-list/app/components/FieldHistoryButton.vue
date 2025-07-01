<template>
  <div>
    <!-- History Button -->
    <PButton 
      @click="showHistory" 
      icon="pi pi-history"
      size="small"
      severity="secondary"
      outlined
      :title="`View ${fieldLabel} History`"
    />

    <!-- Field History Modal -->
    <PDialog 
      v-model:visible="showModal" 
      :header="`${fieldLabel} History`" 
      :style="{ width: '800px' }"
      modal
      :key="`${fieldName}-${fieldEdits.length}`"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-3 border rounded-lg overflow-hidden">
          <!-- Current/Selected Version Display -->
          <div v-if="selectedVersion" class="col-span-2 border-r p-3 flex flex-col justify-between bg-gray-50">
            <div class="flex-1">
              <p v-if="fieldName === 'name'" class="text-lg font-medium">{{ selectedVersion.value }}</p>
              <p v-else class="whitespace-pre-wrap">{{ selectedVersion.value || '(empty)' }}</p>
            </div>
            
            <div v-if="!isLatestVersion" class="mt-3">
              <PButton 
                @click="restoreVersion" 
                label="Restore This Version" 
                size="small"
                severity="secondary"
              />
            </div>
          </div>
          
          <!-- Version List -->
          <div class="flex flex-col max-h-64 overflow-y-auto">
            <button
              v-for="(edit, index) in fieldEdits"
              :key="index"
              @click="selectVersion(edit, index === 0)"
              class="text-xs text-left p-2 hover:bg-blue-50 border-b last:border-b-0"
              :class="{ 'bg-blue-100': selectedVersion === edit }"
            >
              <div class="font-medium text-gray-900">
                {{ index === 0 ? '(Latest)' : formatDate(edit.madeAt) }}
              </div>
              <div class="text-gray-500 text-xs">
                {{ edit.by?.profile?.name || 'Unknown' }}
              </div>
              <div class="text-gray-700 text-xs mt-1 truncate">
                <span class="font-medium">Value:</span> 
                <span v-if="fieldName === 'archived'">
                  {{ edit.value ? 'Archived' : 'Active' }}
                </span>
                <span v-else-if="fieldName === 'name'">
                  "{{ edit.value || '(empty)' }}"
                </span>
                <span v-else>
                  "{{ formatValuePreview(edit.value) }}"
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </PDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, type PropType } from 'vue'
import { GameSchemaFields, type GameField } from '../../jazz/schema'
import { formatDate } from '../utils/date'

interface Edit {
  value: unknown
  madeAt: string
  by?: {
    profile?: {
      name?: string
    }
  }
}

const props = defineProps({
  fieldName: {
    type: String as PropType<GameField>,
    required: true
  },
  fieldLabel: {
    type: String,
    required: true
  },
  edits: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  onRestore: {
    type: Function as any,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits<{
  restore: []
}>()

// Reactive state
const showModal = ref(false)
const selectedVersion = ref<Edit | null>(null)
const isLatestVersion = ref(true)

// Computed properties  
const fieldEdits = computed(() => [...props.edits].reverse())

const latestVersion = computed(() => {
  return fieldEdits.value.length > 0 ? fieldEdits.value[0] : null
})

// Helper functions
const formatValuePreview = (value: unknown): string => {
  const str = String(value || '(empty)')
  return str.length > 50 ? str.substring(0, 50) + '...' : str
}

// Methods
const showHistory = () => {
  showModal.value = true
  
  nextTick(() => {
    if (latestVersion.value) {
      selectedVersion.value = latestVersion.value
      isLatestVersion.value = true
    }
  })
}

const selectVersion = (version: Edit, isLatest: boolean) => {
  selectedVersion.value = version
  isLatestVersion.value = isLatest
}

const restoreVersion = async () => {
  if (selectedVersion.value) {
    await props.onRestore(props.fieldName, selectedVersion.value.value)
    showModal.value = false
  }
}

</script> 