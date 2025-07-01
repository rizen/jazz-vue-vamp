import { DemoAuth } from "jazz-tools";
import { computed, ref, watch } from "vue";
import { useAuthSecretStorage, useJazzContext } from "../composables.js";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

/**
 * Provides demo authentication functionality for development and testing.
 * 
 * This composable provides a simple username-based authentication system
 * that's perfect for development, demos, and testing. It doesn't require
 * any external authentication providers and stores credentials locally.
 * 
 * @returns An object with authentication state and methods
 * @throws {Error} When used outside of a JazzVueProvider or in guest mode
 * 
 * @example
 * ```ts
 * const auth = useDemoAuth();
 * 
 * // Check authentication state
 * console.log('Current state:', auth.value.state); // "signedIn" | "anonymous"
 * 
 * // Sign up a new user
 * auth.value.signUp("john_doe");
 * 
 * // Log in an existing user
 * auth.value.logIn("jane_smith");
 * 
 * // Get list of existing users
 * console.log('Existing users:', auth.value.existingUsers);
 * ```
 * 
 * @category Authentication
 */
export function useDemoAuth() {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  if (!context.value) {
    throw new Error("Demo auth requires an active Jazz context");
  }

  if ("guest" in context.value) {
    throw new Error("Demo auth is not supported in guest mode");
  }

  const authMethod = computed(() => {
    if (!context.value) {
      throw new Error("Demo auth requires an active Jazz context");
    }
    return new DemoAuth(context.value.authenticate, authSecretStorage);
  });

  const existingUsers = ref<string[]>([]);
  const isAuthenticated = useIsAuthenticated();

  watch(authMethod, () => {
    authMethod.value.getExistingUsers().then((users) => {
      existingUsers.value = users;
    });
  });

  return computed(() => ({
    state: isAuthenticated.value ? "signedIn" : "anonymous",
    logIn(username: string) {
      authMethod.value.logIn(username);
    },
    signUp(username: string) {
      authMethod.value.signUp(username);
    },
    existingUsers: existingUsers.value,
  }));
}
