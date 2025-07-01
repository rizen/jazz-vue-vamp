import { BrowserPasskeyAuth } from "jazz-tools/browser";
import { computed } from "vue";
import { useAuthSecretStorage, useJazzContext } from "../composables.js";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

/**
 * Provides passkey authentication functionality (recommended for production).
 * 
 * This composable implements WebAuthn passkey authentication, which provides
 * a secure, passwordless authentication experience. Passkeys are stored
 * securely on the user's device and synchronized across their devices
 * through their platform (iCloud Keychain, Google Password Manager, etc.).
 * 
 * @param config - Configuration object for passkey authentication
 * @param config.appName - The name of your application (displayed during authentication)
 * @param config.appHostname - Optional hostname for your app (defaults to current domain)
 * @returns An object with authentication state and methods
 * @throws {Error} When used outside of a JazzVueProvider or in guest mode
 * 
 * @example
 * ```ts
 * const auth = usePasskeyAuth({ 
 *   appName: "My Todo App",
 *   appHostname: "todo.example.com" 
 * });
 * 
 * // Check authentication state
 * console.log('Current state:', auth.value.state); // "signedIn" | "anonymous"
 * 
 * // Sign up a new user with passkey
 * auth.value.signUp();
 * 
 * // Log in an existing user with passkey
 * auth.value.logIn();
 * ```
 * 
 * @category Authentication
 */
export function usePasskeyAuth({
  appName,
  appHostname,
}: {
  appName: string;
  appHostname?: string;
}) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const isAuthenticated = useIsAuthenticated();

  if (!context.value) {
    throw new Error("Passkey auth requires an active Jazz context");
  }

  if ("guest" in context.value) {
    throw new Error("Passkey auth is not supported in guest mode");
  }

  const authMethod = computed(() => {
    if (!context.value) {
      throw new Error("Passkey auth requires an active Jazz context");
    }
    return new BrowserPasskeyAuth(
      context.value.node.crypto,
      context.value.authenticate,
      authSecretStorage,
      appName,
      appHostname,
    );
  });

  return computed(() => ({
    state: isAuthenticated.value ? "signedIn" : "anonymous",
    logIn: authMethod.value.logIn,
    signUp: authMethod.value.signUp,
  }));
}
