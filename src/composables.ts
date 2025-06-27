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
  type Account,
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

// Support for new AccountSchema (co.account())
export function useAccount<S extends AnyAccountSchema>(
  AccountSchema: S
): {
  me: ComputedRef<InstanceOfSchema<S>>;
  logOut: () => void;
};
export function useAccount<S extends AnyAccountSchema, const R extends RefsToResolve<InstanceOfSchema<S>>>(
  AccountSchema: S,
  options?: {
    resolve?: RefsToResolveStrict<InstanceOfSchema<S>, R>;
  }
): {
  me: ComputedRef<Resolved<InstanceOfSchema<S>, R> | undefined | null>;
  logOut: () => void;
};

// Support for old AccountClass approach  
export function useAccount<A extends Account>(
  AccountSchema: AccountClass<A>
): {
  me: ComputedRef<A>;
  logOut: () => void;
};
export function useAccount<A extends Account, const R extends RefsToResolve<A>>(
  AccountSchema: AccountClass<A>,
  options?: {
    resolve?: RefsToResolveStrict<A, R>;
  }
): {
  me: ComputedRef<Resolved<A, R> | undefined | null>;
  logOut: () => void;
};

export function useAccount(): {
  me: ComputedRef<RegisteredAccount>;
  logOut: () => void;
};
export function useAccount<
  const R extends RefsToResolve<RegisteredAccount>,
>(options?: {
  resolve?: RefsToResolveStrict<RegisteredAccount, R>;
}): {
  me: ComputedRef<Resolved<RegisteredAccount, R> | undefined | null>;
  logOut: () => void;
};

export function useAccount(
  AccountSchemaOrOptions?: any,
  options?: any
): any {
  const context = useJazzContext();

  if (!context.value) {
    throw new Error("useAccount must be used within a JazzProvider");
  }

  if (!("me" in context.value)) {
    throw new Error(
      "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
    );
  }

  const contextMe = context.value.me as RegisteredAccount;

  // Case 1: No parameters - use RegisteredAccount
  if (!AccountSchemaOrOptions) {
    return {
      me: computed(() => toRaw(contextMe)),
      logOut: context.value.logOut,
    };
  }

  // Case 2: Options object only
  if (typeof AccountSchemaOrOptions === 'object' && !AccountSchemaOrOptions.collaborative) {
    const resolveOptions = AccountSchemaOrOptions;
    const me = useCoState<RegisteredAccount, any>(
      contextMe.constructor as CoValueClass<RegisteredAccount>,
      contextMe.id,
      resolveOptions,
    );

    return {
      me: computed(() => {
        const value = !resolveOptions?.resolve
          ? me.value || toRaw(contextMe)
          : me.value;
        return value ? toRaw(value) : value;
      }),
      logOut: context.value.logOut,
    };
  }

  // Case 3: AccountSchema (co.account()) or AccountClass provided
  const AccountSchema = AccountSchemaOrOptions;

  // Check if it's a new AccountSchema (has collaborative property)
  if (AccountSchema && typeof AccountSchema === 'object' && AccountSchema.collaborative) {
    // Convert AccountSchema to CoValueClass using anySchemaToCoSchema
    const CoSchema = anySchemaToCoSchema(AccountSchema) as CoValueClass<Account>;

    const me = useCoState<Account, any>(
      CoSchema,
      contextMe.id as ID<Account>,
      options,
    );

    return {
      me: computed(() => {
        const value = !options?.resolve
          ? me.value || (contextMe as Account)
          : me.value;
        return value ? toRaw(value) : value;
      }),
      logOut: context.value.logOut,
    };
  }

  // Case 4: Old AccountClass (function)
  if (typeof AccountSchema === 'function') {
    const me = useCoState<Account, any>(
      AccountSchema as CoValueClass<Account>,
      contextMe.id as ID<Account>,
      options,
    );

    return {
      me: computed(() => {
        const value = !options?.resolve
          ? me.value || (contextMe as Account)
          : me.value;
        return value ? toRaw(value) : value;
      }),
      logOut: context.value.logOut,
    };
  }

  // Fallback
  return {
    me: computed(() => toRaw(contextMe)),
    logOut: context.value.logOut,
  };
}

export function useAccountOrGuest(): {
  me: ComputedRef<RegisteredAccount | AnonymousJazzAgent>;
};
export function useAccountOrGuest<
  const R extends RefsToResolve<RegisteredAccount>,
>(options?: {
  resolve?: RefsToResolveStrict<RegisteredAccount, R>;
}): {
  me: ComputedRef<
    Resolved<RegisteredAccount, R> | undefined | null | AnonymousJazzAgent
  >;
};
export function useAccountOrGuest<
  const R extends RefsToResolve<RegisteredAccount>,
>(options?: {
  resolve?: RefsToResolveStrict<RegisteredAccount, R>;
}): {
  me: ComputedRef<
    | RegisteredAccount
    | Resolved<RegisteredAccount, R>
    | undefined
    | null
    | AnonymousJazzAgent
  >;
} {
  const context = useJazzContext();

  if (!context.value) {
    throw new Error("useAccountOrGuest must be used within a JazzProvider");
  }

  const contextMe = computed(() =>
    "me" in context.value ? (context.value.me as RegisteredAccount) : undefined,
  );

  const me = useCoState<RegisteredAccount, R>(
    contextMe.value?.constructor as CoValueClass<RegisteredAccount>,
    contextMe.value?.id,
    options,
  );

  if ("me" in context.value) {
    return {
      me: computed(() =>
        options?.resolve === undefined
          ? me.value ||
          toRaw((context.value as JazzAuthContext<RegisteredAccount>).me)
          : me.value,
      ),
    };
  }

  return {
    me: computed(() => toRaw((context.value as JazzGuestContext).guest)),
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
