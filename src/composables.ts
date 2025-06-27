import { consumeInviteLinkFromWindowLocation } from "jazz-browser";
import {
  type AnonymousJazzAgent,
  type AuthSecretStorage,
  type CoValue,
  type CoValueClass,
  type ID,
  type JazzAuthContext,
  type JazzContextType,
  type JazzGuestContext,
  type RefsToResolve,
  type RefsToResolveStrict,
  type Resolved,
  subscribeToCoValue,
  Account,
  type AccountClass,
  type AnyAccountSchema,
  type ResolveQuery,
  type ResolveQueryStrict,
  type Loaded,
  type InstanceOfSchema,
  anySchemaToCoSchema,
} from "jazz-tools";
import {
  type ComputedRef,
  type MaybeRef,
  type Ref,
  type ShallowRef,
  computed,
  inject,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  toRaw,
  unref,
  watch,
} from "vue";
import {
  JazzAuthContextSymbol,
  JazzContextSymbol,
  type RegisteredAccount,
} from "./provider.js";

export const logoutHandler = ref<() => void>();

export function useJazzContext(): Ref<
  JazzContextType<RegisteredAccount>,
  JazzContextType<RegisteredAccount>
> {
  const context =
    inject<Ref<JazzContextType<RegisteredAccount>>>(JazzContextSymbol);
  if (!context?.value) {
    throw new Error("useJazzContext must be used within a JazzProvider");
  }
  return context;
}

export function useAuthSecretStorage() {
  const context = inject<AuthSecretStorage>(JazzAuthContextSymbol);
  if (!context) {
    throw new Error("useAuthSecretStorage must be used within a JazzProvider");
  }
  return context;
}

export function useIsAuthenticated(): Ref<boolean> {
  const authSecretStorage = useAuthSecretStorage();
  const isAuthenticated = ref(authSecretStorage.isAuthenticated);

  onMounted(() => {
    // Subscribe to auth state changes
    const unsubscribe = authSecretStorage.onUpdate(() => {
      isAuthenticated.value = authSecretStorage.isAuthenticated;
    });

    onUnmounted(() => {
      unsubscribe();
    });
  });

  return isAuthenticated;
}

export function useAccount(
  AccountSchemaOrOptions?: any,
  options?: any
): any {
  const context = useJazzContext();

  if (!context.value) {
    throw new Error("useAccount must be used within a JazzProvider");
  }

  // Get the current agent (either authenticated account or anonymous guest)
  const currentAgent = computed(() => {
    return "me" in context.value
      ? context.value.me as RegisteredAccount
      : context.value.guest;
  });

  // Determine what we're dealing with
  let Schema: CoValueClass<Account>;
  let resolveOptions: any;

  // Case 1: No arguments or just options
  if (!AccountSchemaOrOptions || (AccountSchemaOrOptions && 'resolve' in AccountSchemaOrOptions && !AccountSchemaOrOptions.collaborative)) {
    // Use current agent's schema
    Schema = currentAgent.value?._type !== "Anonymous"
      ? currentAgent.value.constructor as CoValueClass<Account>
      : Account as CoValueClass<Account>;
    resolveOptions = AccountSchemaOrOptions || options;
  } else {
    // Case 2: AccountSchema provided (either class or co.account() schema)
    if (typeof AccountSchemaOrOptions === 'object' && AccountSchemaOrOptions.collaborative) {
      // New schema format (co.account())
      Schema = anySchemaToCoSchema(AccountSchemaOrOptions) as CoValueClass<Account>;
    } else {
      // Class format
      Schema = AccountSchemaOrOptions as CoValueClass<Account>;
    }
    resolveOptions = options;
  }

  const accountId = currentAgent.value?._type !== "Anonymous" ? currentAgent.value.id : undefined;

  const me = useCoState<any, any>(
    Schema,
    accountId,
    resolveOptions,
  );

  return {
    me: computed(() => me.value ? toRaw(me.value) : null),
    agent: computed(() => toRaw(currentAgent.value)),
    logOut: context.value.logOut || (() => { }),
  };
}



export function useCoState<V extends CoValue, const R extends RefsToResolve<V>>(
  Schema: CoValueClass<V>,
  id: MaybeRef<ID<CoValue> | undefined>,
  options?: { resolve?: RefsToResolveStrict<V, R> },
): Ref<Resolved<V, R> | undefined | null> {
  const state: ShallowRef<Resolved<V, R> | undefined | null> =
    shallowRef(undefined);
  const context = useJazzContext();

  if (!context.value) {
    throw new Error("useCoState must be used within a JazzProvider");
  }

  let unsubscribe: (() => void) | undefined;

  watch(
    [() => unref(id), () => context, () => Schema, () => options],
    () => {
      if (unsubscribe) unsubscribe();

      const idValue = unref(id);
      if (!idValue) return;

      unsubscribe = subscribeToCoValue(
        Schema,
        idValue,
        {
          resolve: options?.resolve,
          loadAs:
            "me" in context.value
              ? toRaw(context.value.me)
              : toRaw(context.value.guest),
          onUnavailable: () => {
            state.value = null;
          },
          onUnauthorized: () => {
            state.value = null;
          },
          syncResolution: true,
        },
        (value) => {
          state.value = value;
        },
      );
    },
    { deep: true, immediate: true },
  );

  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });

  const computedState = computed(() => state.value);

  return computedState;
}

export function useAcceptInvite<V extends CoValue>({
  invitedObjectSchema,
  onAccept,
  forValueHint,
}: {
  invitedObjectSchema: CoValueClass<V>;
  onAccept: (projectID: ID<V>) => void;
  forValueHint?: string;
}): void {
  const context = useJazzContext();

  if (!context.value) {
    throw new Error("useAcceptInvite must be used within a JazzProvider");
  }

  if (!("me" in context.value)) {
    throw new Error(
      "useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.",
    );
  }

  const runInviteAcceptance = () => {
    const result = consumeInviteLinkFromWindowLocation({
      as: toRaw((context.value as JazzAuthContext<RegisteredAccount>).me),
      invitedObjectSchema,
      forValueHint,
    });

    result
      .then((res) => res && onAccept(res.valueID))
      .catch((e) => {
        console.error("Failed to accept invite", e);
      });
  };

  onMounted(() => {
    runInviteAcceptance();
  });

  watch(
    () => onAccept,
    (newOnAccept, oldOnAccept) => {
      if (newOnAccept !== oldOnAccept) {
        runInviteAcceptance();
      }
    },
  );
}
