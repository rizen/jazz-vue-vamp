import { consumeInviteLinkFromWindowLocation } from "jazz-tools/browser";
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
  InboxSender,
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

/**
 * Access the raw Jazz context for advanced use cases.
 * 
 * This composable provides direct access to the underlying Jazz context,
 * which contains the node, networking, and other low-level Jazz internals.
 * Most applications should use `useAccount()` instead of this composable.
 * 
 * @returns A reactive reference to the Jazz context
 * @throws {Error} When used outside of a JazzVueProvider
 * 
 * @example
 * ```ts
 * const context = useJazzContext();
 * 
 * // Access Jazz internals (advanced usage)
 * watchEffect(() => {
 *   if (context.value) {
 *     console.log('Jazz node ID:', context.value.node.id);
 *   }
 * });
 * ```
 * 
 * @category Advanced
 */
export function useJazzContext(): Ref<
  JazzContextType<RegisteredAccount> | undefined,
  JazzContextType<RegisteredAccount> | undefined
> {
  const context =
    inject<Ref<JazzContextType<RegisteredAccount> | undefined>>(JazzContextSymbol);
  if (!context) {
    throw new Error("useJazzContext must be used within a JazzProvider");
  }
  return context;
}

/**
 * Access the authentication secret storage for advanced authentication scenarios.
 * 
 * This composable provides access to the underlying authentication storage system
 * used by Jazz for managing authentication secrets and state. Most applications
 * should use the auth composables (`usePasskeyAuth`, `usePassphraseAuth`, etc.)
 * instead of accessing this directly.
 * 
 * @returns The authentication secret storage instance
 * @throws {Error} When used outside of a JazzVueProvider
 * 
 * @example
 * ```ts
 * const authStorage = useAuthSecretStorage();
 * 
 * // Check if user is authenticated
 * const isAuthenticated = authStorage.isAuthenticated;
 * 
 * // Listen for auth state changes
 * authStorage.onUpdate(() => {
 *   console.log('Auth state changed:', authStorage.isAuthenticated);
 * });
 * ```
 * 
 * @category Advanced
 */
export function useAuthSecretStorage() {
  const context = inject<AuthSecretStorage>(JazzAuthContextSymbol);
  if (!context) {
    throw new Error("useAuthSecretStorage must be used within a JazzProvider");
  }
  return context;
}

/**
 * Check if the current user is authenticated.
 * 
 * This composable returns a reactive boolean that indicates whether the user
 * is currently authenticated. It automatically updates when the authentication
 * state changes, making it perfect for conditional rendering and navigation logic.
 * 
 * @returns A reactive boolean indicating authentication status
 * @throws {Error} When used outside of a JazzVueProvider
 * 
 * @example
 * ```ts
 * const isAuthenticated = useIsAuthenticated();
 * 
 * // Use in template
 * // <div v-if="isAuthenticated">Welcome back!</div>
 * // <AuthForm v-else />
 * 
 * // Or watch for changes
 * watchEffect(() => {
 *   if (isAuthenticated.value) {
 *     // User just signed in
 *     router.push('/dashboard');
 *   }
 * });
 * ```
 * 
 * @category Authentication
 */
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

/**
 * Access the current user account and agent. Works in all authentication modes.
 * 
 * This is the primary composable for accessing user data in Jazz applications.
 * It provides both the authenticated user account and the current agent, handling
 * authentication state changes automatically.
 * 
 * @param AccountSchemaOrOptions - Optional account schema or options object
 * @param options - Additional options for resolving nested data
 * @returns Object containing `me` (user account), `agent` (current agent), and `logOut` function
 * @throws {Error} When used outside of a JazzVueProvider
 * 
 * @example
 * ```ts
 * // Basic usage
 * const { me, agent, logOut } = useAccount();
 * 
 * // With account schema
 * const { me, agent, logOut } = useAccount(MyAppAccount);
 * 
 * // With deep resolution
 * const { me, agent, logOut } = useAccount(MyAppAccount, {
 *   resolve: { 
 *     root: { todos: true },
 *     profile: true
 *   }
 * });
 * 
 * // Handle different authentication states
 * watchEffect(() => {
 *   if (agent.value?._type === "Account") {
 *     // Authenticated user
 *     console.log("Welcome back!", me.value?.profile?.name);
 *   } else if (agent.value?._type === "Anonymous") {
 *     // Anonymous user (either unauthenticated or guest mode)
 *     console.log("You're browsing as a guest");
 *   }
 * });
 * ```
 * 
 * @category Core
 */
export function useAccount(
  AccountSchemaOrOptions?: any,
  options?: any
): any {
  const context = useJazzContext();
  const authSecretStorage = inject<any>(JazzAuthContextSymbol);

  if (!context.value) {
    throw new Error("useAccount must be used within a JazzProvider");
  }

  // Get the current agent (either authenticated account or anonymous guest)
  const currentAgent = computed(() => {
    if (!context.value) {
      return null;
    }

    // Prioritize guest context if it exists (guest mode enabled)
    if ("guest" in context.value) {
      return context.value.guest;
    }

    // For auth contexts, return the me object (both authenticated and anonymous users have accounts)
    if ("me" in context.value) {
      return context.value.me as RegisteredAccount;
    }

    return null;
  });

  // Determine what we're dealing with
  let Schema: CoValueClass<Account>;
  let resolveOptions: any;

  // Case 1: No arguments or just options
  if (!AccountSchemaOrOptions || (AccountSchemaOrOptions && 'resolve' in AccountSchemaOrOptions && !AccountSchemaOrOptions.collaborative)) {
    // Use default Account schema when no specific schema provided
    Schema = Account as CoValueClass<Account>;
    resolveOptions = AccountSchemaOrOptions || options;
  } else {
    // Case 2: AccountSchema provided (modern co.account() schema)
    if (typeof AccountSchemaOrOptions === 'object' && AccountSchemaOrOptions.collaborative) {
      // Convert modern account schema to CoValueClass format
      try {
        Schema = anySchemaToCoSchema(AccountSchemaOrOptions) as CoValueClass<Account>;
      } catch (error) {
        console.error("Failed to convert account schema:", error);
        console.warn("Falling back to default Account class");
        Schema = Account as CoValueClass<Account>;
      }
    } else {
      // Assume it's already a CoValueClass (legacy support)
      Schema = AccountSchemaOrOptions as CoValueClass<Account>;
    }
    resolveOptions = options;
  }

  // Create a reactive account subscription that handles both authenticated and anonymous cases
  const me = ref<any>(null);
  let unsubscribe: (() => void) | undefined;

  watch(
    [() => currentAgent.value, () => context.value],
    () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }

      const agent = currentAgent.value;

      if (!agent || !context.value) {
        me.value = null;
        return;
      }

      // Handle different agent types:
      // - Guest mode (AnonymousJazzAgent): truly anonymous, no persistent account
      // - Auth mode unauthenticated: temporary account exists, but user not authenticated  
      // - Auth mode authenticated: persistent account exists and user authenticated

      if (agent._type === "Anonymous" && !("id" in agent)) {
        // True guest mode - no account to subscribe to
        me.value = null;
        return;
      }

      // For auth mode (both authenticated and unauthenticated), subscribe to the account
      const accountId = (agent as RegisteredAccount).id;

      try {
        unsubscribe = subscribeToCoValue(
          Schema,
          accountId,
          {
            resolve: resolveOptions?.resolve,
            loadAs: toRaw(agent),
            onUnavailable: () => {
              me.value = null;
            },
            onUnauthorized: () => {
              me.value = null;
            },
            syncResolution: true,
          },
          (value) => {
            me.value = value;
          },
        );
      } catch (error) {
        console.error("useAccount subscription error:", error);
        me.value = null;
      }
    },
    { deep: true, immediate: true },
  );

  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });

  return {
    me: computed(() => me.value ? toRaw(me.value) : null),
    agent: computed(() => {
      const agent = currentAgent.value;
      if (!agent) return null;

      // For guest mode, return as-is
      if (agent._type === "Anonymous") {
        return toRaw(agent);
      }

      // For auth mode, check if user is actually authenticated
      const isAuthenticated = !authSecretStorage || authSecretStorage.isAuthenticated !== false;

      // Return agent with correct _type based on authentication state
      const rawAgent = toRaw(agent);
      return {
        ...rawAgent,
        _type: isAuthenticated ? "Account" as const : "Anonymous" as const
      };
    }),
    logOut: () => context.value?.logOut?.() || (() => { }),
  };
}

// Helper type to extract the return type from schema.create()
type SchemaReturnType<T> = T extends { create: (...args: any[]) => infer R } ? R : CoValue;

/**
 * Subscribe to any CoValue by ID with automatic updates.
 * 
 * This composable loads and subscribes to a Jazz CoValue object, automatically
 * updating when the data changes. It's perfect for loading shared documents,
 * lists, maps, and other collaborative data structures.
 * 
 * @param Schema - The CoValue schema (e.g., co.map(), co.list(), etc.)
 * @param id - The ID of the CoValue to load (can be reactive)
 * @param options - Optional configuration for resolving nested references
 * @returns A reactive reference to the CoValue that updates automatically
 * @throws {Error} When used outside of a JazzVueProvider
 * 
 * @example
 * ```ts
 * // Load a todo item
 * const todo = useCoState(TodoItem, todoId);
 * 
 * // Load with nested resolution
 * const todo = useCoState(TodoItem, todoId, {
 *   resolve: { assignee: true }
 * });
 * 
 * // Use reactive ID
 * const selectedTodoId = ref('todo_123');
 * const todo = useCoState(TodoItem, selectedTodoId);
 * 
 * // Access the data
 * watchEffect(() => {
 *   if (todo.value) {
 *     console.log('Todo title:', todo.value.title);
 *   }
 * });
 * ```
 * 
 * @category Core
 */
export function useCoState<T>(
  Schema: T & { create: (...args: any[]) => any }, // Modern schema format (co.map(), co.list(), etc.)
  id: MaybeRef<ID<CoValue> | undefined>,
  options?: { resolve?: any },
): Ref<SchemaReturnType<T> | undefined | null> {
  const state: ShallowRef<SchemaReturnType<T> | undefined | null> =
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
      if (!idValue || !context.value) return;

      // Convert modern schema to CoValueClass format for subscribeToCoValue
      let ConvertedSchema: CoValueClass<any>;
      try {
        ConvertedSchema = anySchemaToCoSchema(Schema as any);
      } catch (error) {
        console.error("Failed to convert schema in useCoState:", error);
        console.error("Schema object:", Schema);
        throw new Error(`Invalid schema passed to useCoState: ${error}`);
      }

      unsubscribe = subscribeToCoValue(
        ConvertedSchema,
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

/**
 * Handle collaborative invites in your app.
 * 
 * This composable automatically processes invite links when users visit your app,
 * allowing them to accept invitations to shared documents, workspaces, or other
 * collaborative resources. It listens for URL changes and processes invites automatically.
 * 
 * @param config - Configuration object for handling invites
 * @param config.invitedObjectSchema - The schema of the invited object
 * @param config.onAccept - Callback function called when an invite is accepted
 * @param config.forValueHint - Optional hint for the invited value type
 * @throws {Error} When used outside of a JazzVueProvider or in guest mode
 * 
 * @example
 * ```ts
 * // Accept invites to todo lists
 * useAcceptInvite({
 *   invitedObjectSchema: TodoList,
 *   onAccept: (todoListId) => {
 *     // Navigate to the shared todo list
 *     router.push(`/todos/${todoListId}`);
 *   }
 * });
 * 
 * // Accept invites with value hint
 * useAcceptInvite({
 *   invitedObjectSchema: Document,
 *   onAccept: (documentId) => {
 *     console.log('Accepted document invite:', documentId);
 *     // Handle the accepted document
 *   },
 *   forValueHint: 'document'
 * });
 * ```
 * 
 * @category Collaboration
 */
export function useAcceptInvite<V extends CoValue>({
  invitedObjectSchema,
  onAccept,
  forValueHint,
}: {
  invitedObjectSchema: any; // Modern schema format (co.map(), co.list(), etc.)
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

  const handleInvite = () => {
    // Convert modern schema to CoValueClass format
    let ConvertedSchema: CoValueClass<any>;
    try {
      ConvertedSchema = anySchemaToCoSchema(invitedObjectSchema);
    } catch (error) {
      console.error("Failed to convert schema in useAcceptInvite:", error);
      throw new Error(`Invalid schema passed to useAcceptInvite: ${error}`);
    }

    const result = consumeInviteLinkFromWindowLocation({
      as: toRaw((context.value as JazzAuthContext<RegisteredAccount>).me),
      invitedObjectSchema: ConvertedSchema,
      forValueHint,
    });

    result
      .then((res) => res && onAccept(res.valueID))
      .catch((e) => {
        console.error("Failed to accept invite", e);
      });
  };

  onMounted(() => {
    handleInvite();

    // Listen for hashchange events like React implementation
    window.addEventListener("hashchange", handleInvite);
  });

  onUnmounted(() => {
    window.removeEventListener("hashchange", handleInvite);
  });

  watch(
    () => onAccept,
    (newOnAccept, oldOnAccept) => {
      if (newOnAccept !== oldOnAccept) {
        handleInvite();
      }
    },
  );
}

/**
 * Send messages to other users' inboxes for real-time communication.
 * 
 * This experimental composable provides a way to send messages directly to
 * other users through Jazz's inbox system. It's useful for notifications,
 * chat messages, or any real-time communication needs.
 * 
 * **Note: This is an experimental API and may change in future versions.**
 * 
 * @param inboxOwnerID - The ID of the user to send messages to (can be reactive)
 * @returns A function to send messages to the specified user
 * @throws {Error} When used outside of a JazzVueProvider or in guest mode
 * 
 * @example
 * ```ts
 * // Send a message to another user
 * const sendMessage = experimental_useInboxSender(recipientUserId);
 * 
 * // Send structured data
 * await sendMessage({
 *   type: 'notification',
 *   content: 'You have a new todo!',
 *   todoId: 'todo_123'
 * });
 * 
 * // Works with reactive recipient IDs
 * const selectedUser = ref('user_456');
 * const sendToSelected = experimental_useInboxSender(selectedUser);
 * 
 * // Send different types of messages
 * await sendToSelected({
 *   type: 'invite',
 *   message: 'Join my workspace!'
 * });
 * ```
 * 
 * @category Experimental
 */
export function experimental_useInboxSender<
  I extends CoValue,
  O extends CoValue | undefined,
>(inboxOwnerID: MaybeRef<string | undefined>) {
  const context = useJazzContext();

  if (!context.value) {
    throw new Error("experimental_useInboxSender must be used within a JazzProvider");
  }

  if (!("me" in context.value)) {
    throw new Error(
      "experimental_useInboxSender can't be used in a JazzProvider with auth === 'guest'.",
    );
  }

  const me = (context.value as JazzAuthContext<RegisteredAccount>).me;
  const inboxRef = ref<Promise<InboxSender<I, O>> | undefined>(undefined);

  const sendMessage = async (message: I) => {
    const ownerID = unref(inboxOwnerID);
    if (!ownerID) throw new Error("Inbox owner ID is required");

    if (!inboxRef.value) {
      const inbox = InboxSender.load<I, O>(ownerID, toRaw(me));
      inboxRef.value = inbox;
    }

    let inbox = await inboxRef.value;

    if (inbox.owner.id !== ownerID) {
      const req = InboxSender.load<I, O>(ownerID, toRaw(me));
      inboxRef.value = req;
      inbox = await req;
    }

    return inbox.sendMessage(message);
  };

  return sendMessage;
}

/**
 * Creates an invite link for a CoValue with the specified role.
 * 
 * This function generates shareable invite links that allow other users to
 * access and collaborate on your Jazz objects with specific permissions.
 * The generated link can be shared via email, chat, or any other medium.
 * 
 * **Note: This is a temporary implementation that works around issues with jazz-tools' createInviteLink.
 * Once the Jazz team fixes the expectGroup issue, this can be replaced with the official version.**
 * 
 * @param value - The CoValue to create an invite link for
 * @param role - The permission level for invited users
 * @param options - Additional options for the invite link
 * @param options.baseURL - Base URL for the invite link (defaults to current page)
 * @param options.valueHint - Optional hint for the invited value type
 * @returns A shareable invite link string
 * @throws {Error} When the value is invalid or doesn't have a group owner
 * 
 * @example
 * ```ts
 * // Create a basic invite link
 * const inviteLink = createInviteLink(sharedTodoList, "writer");
 * 
 * // Create invite link with custom base URL
 * const inviteLink = createInviteLink(document, "reader", {
 *   baseURL: "https://myapp.com",
 *   valueHint: "document"
 * });
 * 
 * // Share the link
 * navigator.clipboard.writeText(inviteLink);
 * console.log('Invite link copied to clipboard!');
 * ```
 * 
 * @category Collaboration
 */
export function createInviteLink<C extends CoValue>(
  value: C,
  role: "reader" | "writer" | "admin" | "writeOnly",
  {
    baseURL = window.location.href.replace(/#.*$/, ""),
    valueHint,
  }: { baseURL?: string; valueHint?: string } = {},
): string {
  try {
    // Get the raw object from the value (works with jazz-vue-vamp objects)
    const rawValue = (value as any)._raw;
    if (!rawValue || !rawValue.core) {
      throw new Error("Invalid CoValue: missing _raw.core");
    }

    let currentCoValue = rawValue.core;

    // Walk up the ownership chain to find the group
    while (currentCoValue.verified.header.ruleset.type === "ownedByGroup") {
      currentCoValue = currentCoValue.getGroup().core;
    }

    const { ruleset, meta } = currentCoValue.verified.header;
    if (ruleset.type !== "group" || meta?.type === "account") {
      throw new Error("Can't create invite link for object without group");
    }

    // Get the group content and create invite secret
    const groupContent = currentCoValue.getCurrentContent();
    const inviteSecret = (groupContent as any).createInvite(role);

    // Create the invite URL with the same format as jazz-tools
    return `${baseURL}#/invite/${valueHint ? valueHint + "/" : ""}${(value as any).id
      }/${inviteSecret}`;
  } catch (error) {
    throw new Error(`Failed to create invite link: ${error}`);
  }
}
