import { DemoAuth } from "jazz-tools";
import { computed, ref, watch } from "vue";
import { useAuthSecretStorage, useJazzContext } from "../composables.js";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

export function useDemoAuth() {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  if ("guest" in context.value) {
    throw new Error("Demo auth is not supported in guest mode");
  }

  const authMethod = computed(
    () => new DemoAuth(context.value.authenticate, authSecretStorage),
  );

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
