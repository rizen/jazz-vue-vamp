import { onMounted, onUnmounted, ref } from "vue";
import { useAuthSecretStorage } from "../composables.js";

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
