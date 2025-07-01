<template>
  <div class="login-page flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-3xl font-bold mb-6">Sign in to your Games List</h1>
    
    <!-- Auth Method Selection -->
    <div v-if="authMode === 'select'" class="auth-container space-y-4">
      <p class="text-gray-600 text-center mb-6">Choose your preferred sign-in method:</p>
      
      <button 
        @click="authMode = 'passkey'"
        class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        🔐 Sign in with Passkey
      </button>
      
      <button 
        @click="authMode = 'passphrase'"
        class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        🔑 Sign in with Passphrase
      </button>
    </div>

    <!-- Passkey Auth -->
    <div v-else-if="authMode === 'passkey'" class="auth-container">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Passkey Authentication</h2>
        <button @click="authMode = 'select'" class="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
      </div>
      
      <button 
        @click="passkeyAuth.logIn" 
        :disabled="passkeyAuth.state === 'loading'"
        class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ passkeyAuth.state === 'loading' ? 'Authenticating...' : 'Sign in with Passkey' }}
      </button>
    </div>

    <!-- Passphrase Auth -->
    <div v-else-if="authMode === 'passphrase'" class="auth-container">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Passphrase Authentication</h2>
        <button @click="authMode = 'select'" class="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
      </div>

      <!-- Initial Choice -->
      <div v-if="passphraseStep === 'initial'" class="space-y-4">
        <button 
          @click="passphraseStep = 'create'"
          class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Create New Account
        </button>
        <button 
          @click="passphraseStep = 'login'"
          class="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Log In with Existing Passphrase
        </button>
      </div>

      <!-- Create Account -->
      <div v-else-if="passphraseStep === 'create'" class="space-y-4">
        <h3 class="font-semibold">Your Generated Passphrase</h3>
        <p class="text-sm text-gray-600">Please copy and store this passphrase somewhere safe. You'll need it to log in.</p>
        
        <textarea
          :value="currentPassphrase"
          readonly
          class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
          rows="4"
        />
        
        <div class="flex gap-2">
          <button 
            @click="copyPassphrase"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {{ isCopied ? 'Copied!' : 'Copy Passphrase' }}
          </button>
          <button 
            @click="regeneratePassphrase"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            🎲 New
          </button>
        </div>
        
        <div class="flex gap-2 pt-2">
          <button 
            @click="passphraseStep = 'initial'"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Back
          </button>
          <button 
            @click="goToProfileStep"
            :disabled="!isCopied"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next: Set Profile Name
          </button>
        </div>
      </div>

      <!-- Profile Name Setup -->
      <div v-else-if="passphraseStep === 'profile'" class="space-y-4">
        <h3 class="font-semibold">Set Your Profile Name</h3>
        <p class="text-sm text-gray-600">
          Choose a name that will be displayed to other users when collaborating on games.
        </p>
        
        <div>
          <label for="profileName" class="block text-sm font-medium text-gray-700 mb-2">
            Profile Name
          </label>
          <input
            id="profileName"
            v-model="profileName"
            type="text"
            placeholder="Enter your name (e.g., John Doe)"
            class="w-full p-3 border border-gray-300 rounded-lg text-sm"
            maxlength="50"
            @keyup.enter="profileName.trim() && registerAccount()"
          />
          <div class="text-xs text-gray-500 mt-1">
            {{ profileName.length }}/50 characters
          </div>
        </div>
        
        <div class="flex gap-2">
          <button 
            @click="passphraseStep = 'create'"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Back
          </button>
          <button 
            @click="registerAccount"
            :disabled="!profileName.trim()"
            class="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>

      <!-- Login -->
      <div v-else-if="passphraseStep === 'login'" class="space-y-4">
        <h3 class="font-semibold">Enter Your Passphrase</h3>
        
        <textarea
          v-model="loginPassphrase"
          placeholder="Enter your passphrase here..."
          class="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
          rows="4"
        />
        
        <div class="flex gap-2">
          <button 
            @click="passphraseStep = 'initial'"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Back
          </button>
          <button 
            @click="loginWithPassphrase"
            :disabled="!loginPassphrase.trim()"
            class="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePasskeyAuth, usePassphraseAuth, useAccount } from 'jazz-vue-vamp'
import { wordlist } from '../utils/wordlist'

const route = useRoute()

// Authentication mode management
const authMode = ref<'select' | 'passkey' | 'passphrase'>('select')
const passphraseStep = ref<'initial' | 'create' | 'profile' | 'login'>('initial')

// Passkey authentication
const passkeyAuth = usePasskeyAuth({
  appName: "Your Games List"
})

// Passphrase authentication
const passphraseAuth = usePassphraseAuth({
  wordlist: wordlist
})

// Passphrase state
const currentPassphrase = ref('')
const loginPassphrase = ref('')
const isCopied = ref(false)
const profileName = ref('')

const { agent } = useAccount()

const redirect = route.query.redirect as string || '/games'

// Generate initial passphrase
onMounted(() => {
  if (agent.value._type == 'Account') {
    navigateTo(redirect)
  }
  generateNewPassphrase()
})  

watch(agent, (account) => {
  if (account._type == 'Account') {
    navigateTo(redirect)
  }
})

// Passphrase functions
const generateNewPassphrase = () => {
  currentPassphrase.value = passphraseAuth.value.generateRandomPassphrase()
  isCopied.value = false
}

const regeneratePassphrase = () => {
  generateNewPassphrase()
}

const copyPassphrase = async () => {
  try {
    await navigator.clipboard.writeText(currentPassphrase.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to copy passphrase:', err)
    // Fallback: select the text
    const textarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement
    if (textarea) {
      textarea.select()
      textarea.setSelectionRange(0, 99999) // For mobile devices
    }
  }
}

const goToProfileStep = () => {
  // Generate a suggested name if none exists
  if (!profileName.value.trim()) {
    profileName.value = generateSuggestedName()
  }
  passphraseStep.value = 'profile'
}

const generateSuggestedName = () => {
  const adjectives = ['Creative', 'Smart', 'Clever', 'Brilliant', 'Innovative', 'Talented', 'Skilled', 'Expert']
  const nouns = ['Designer', 'Creator', 'Builder', 'Maker', 'Player', 'Gamer', 'Developer', 'Artist']
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  
  return `${randomAdjective} ${randomNoun}`
}

const registerAccount = async () => {
  try {
    const displayName = profileName.value.trim() || 'User'
    await passphraseAuth.value.registerNewAccount(currentPassphrase.value, displayName)
    // Reset state
    passphraseStep.value = 'initial'
    authMode.value = 'select'
    currentPassphrase.value = ''
    profileName.value = ''
    isCopied.value = false
  } catch (error) {
    console.error('Registration failed:', error)
    alert('Registration failed. Please try again.')
  }
}

const loginWithPassphrase = async () => {
  try {
    await passphraseAuth.value.logIn(loginPassphrase.value)
    // Reset state
    passphraseStep.value = 'initial'
    authMode.value = 'select'
    loginPassphrase.value = ''
  } catch (error) {
    console.error('Login failed:', error)
    alert('Login failed. Please check your passphrase and try again.')
  }
}
</script>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
}

.auth-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  min-width: 400px;
  max-width: 500px;
}

/* Improve textarea styling */
textarea {
  resize: vertical;
  min-height: 100px;
}

textarea[readonly] {
  background-color: #f9fafb;
  cursor: default;
}

/* Button hover effects */
button {
  transition: all 0.2s ease-in-out;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px -2px rgb(0 0 0 / 0.1);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

/* Loading state */
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Back button styling */
.text-gray-500:hover {
  color: #374151;
  text-decoration: underline;
}
</style> 
