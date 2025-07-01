import { PassphraseAuth } from "jazz-tools";
import { computed, ref, watchEffect } from "vue";
import { useAuthSecretStorage, useJazzContext } from "../composables.js";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

/**
 * Provides passphrase authentication functionality for secure, memorable authentication.
 * 
 * This composable implements passphrase-based authentication using a wordlist
 * to generate human-readable, secure passphrases. This method provides good
 * security while being more memorable than random passwords, and works well
 * for scenarios where passkeys aren't available or desired.
 * 
 * @param config - Configuration object for passphrase authentication
 * @param config.wordlist - Array of words to use for generating passphrases
 * @returns An object with authentication state, methods, and current passphrase
 * @throws {Error} When used outside of a JazzVueProvider or in guest mode
 * 
 * @example
 * ```ts
 * import { wordlist } from './wordlist'; // Your word list
 * 
 * const auth = usePassphraseAuth({ wordlist });
 * 
 * // Check authentication state
 * console.log('Current state:', auth.value.state); // "signedIn" | "anonymous"
 * 
 * // Generate a new random passphrase
 * const newPassphrase = auth.value.generateRandomPassphrase();
 * console.log('New passphrase:', newPassphrase);
 * 
 * // Sign up with a passphrase
 * auth.value.signUp(newPassphrase);
 * 
 * // Log in with existing passphrase
 * auth.value.logIn(existingPassphrase);
 * 
 * // Register a new account (different from signUp)
 * auth.value.registerNewAccount();
 * 
 * // Get current user's passphrase
 * console.log('Current passphrase:', auth.value.passphrase);
 * ```
 * 
 * @category Authentication
 */
export function usePassphraseAuth({
  wordlist,
}: {
  wordlist: string[];
}) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const isAuthenticated = useIsAuthenticated();

  if (!context.value) {
    throw new Error("Passphrase auth requires an active Jazz context");
  }

  if ("guest" in context.value) {
    throw new Error("Passphrase auth is not supported in guest mode");
  }

  const authMethod = computed(() => {
    if (!context.value) {
      throw new Error("Passphrase auth requires an active Jazz context");
    }
    return new PassphraseAuth(
      context.value.node.crypto,
      context.value.authenticate,
      context.value.register,
      authSecretStorage,
      wordlist,
    );
  });

  const passphrase = ref(authMethod.value.passphrase);

  watchEffect((onCleanup) => {
    authMethod.value.loadCurrentAccountPassphrase();

    const unsubscribe = authMethod.value.subscribe(() => {
      passphrase.value = authMethod.value.passphrase;
    });

    onCleanup(unsubscribe);
  });

  return computed(() => ({
    state: isAuthenticated.value ? "signedIn" : "anonymous",
    logIn: authMethod.value.logIn,
    signUp: authMethod.value.signUp,
    registerNewAccount: authMethod.value.registerNewAccount,
    generateRandomPassphrase: authMethod.value.generateRandomPassphrase,
    passphrase: passphrase.value,
  }));
}
