import Lara from '@primeuix/themes/lara';
import fs from 'fs';
import path from 'path';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  // Add compatibility date to resolve warning
  compatibilityDate: '2025-06-22',

  // Disable SSR since Jazz may not be fully SSR compatible
  ssr: false,

  primevue: {
    options: {
      theme: {
        preset: Lara
      }
    },
    components: {
      prefix: 'P'
    },
  },

  // Configure build options
  build: {
    transpile: ['jazz-tools', 'primevue']
  },

  // Configure Vite for module resolution
  vite: {
    optimizeDeps: {
      include: ['fast-myers-diff']
    },
    ssr: {
      noExternal: ['fast-myers-diff']
    }
  },

  // Configure runtime config for environment variables
  runtimeConfig: {

    // Public keys (exposed to client-side)
    public: {
      jazz_sync_peer: 'wss://cloud.jazz.tools/?key=gamelist@thegamecrafter.com',
      appName: 'Games List',
      appVersion: '3.0.0'
    }
  },

  // Configure modules
  modules: ['@primevue/nuxt-module', '@nuxtjs/tailwindcss'],

  // Configure CSS
  css: [
    'primeicons/primeicons.css'
  ],

  // Configure app
  app: {
    head: {
      title: 'Games List',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Collaborative board game design app' }
      ]
    }
  }
})
