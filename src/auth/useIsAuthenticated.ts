import { onMounted, onUnmounted, ref } from "vue";
import { useAuthSecretStorage } from "../composables.js";

/**
 * Check if the current user is authenticated (auth-specific version).
 * 
 * This is a specialized version of useIsAuthenticated that's part of the auth module.
 * It provides the same functionality as the main useIsAuthenticated composable
 * but with auth-specific implementation details.
 * 
 * @returns A reactive boolean indicating authentication status
 * @throws {Error} When used outside of a JazzVueProvider
 * 
 * @example
 * ```ts
 * import { useIsAuthenticated } from "jazz-vue-vamp/auth";
 * 
 * const isAuthenticated = useIsAuthenticated();
 * 
 * // Use in template
 * // <div v-if="isAuthenticated">Welcome back!</div>
 * // <AuthForm v-else />
 * ```
 * 
 * @category Authentication
 */
export function useIsAuthenticated() {
  const authSecretStorage = useAuthSecretStorage();
  const isAuthenticated = ref(authSecretStorage.isAuthenticated);

  const handleUpdate = () => {
    isAuthenticated.value = authSecretStorage.isAuthenticated;
  };

  onMounted(() => {
    const cleanup = authSecretStorage.onUpdate(handleUpdate);
    onUnmounted(cleanup);
  });

  return isAuthenticated;
}
