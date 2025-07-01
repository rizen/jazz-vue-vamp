import { JazzBrowserContextManager, type JazzContextManagerProps } from "jazz-tools/browser";
import type {
  Account,
  AccountClass,
  AnyAccountSchema,
  CoValueFromRaw,
  JazzContextType,
  SyncConfig,
} from "jazz-tools";
import {
  type PropType,
  defineComponent,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
  computed,
} from "vue";

export const logoutHandler = ref<() => void>();

// biome-ignore lint/suspicious/noEmptyInterface: This interface is meant to be module augmented by users
export interface Register { }

export type RegisteredAccount = Register extends { Account: infer Acc }
  ? Acc
  : Account;

declare module "jazz-tools" {
  export interface Register {
    Account: RegisteredAccount;
  }
}

export const JazzContextSymbol = Symbol("JazzContext");
export const JazzAuthContextSymbol = Symbol("JazzAuthContext");

/**
 * The JazzVueProvider component sets up the Jazz context for your entire application.
 * 
 * This component must wrap your entire Vue app to provide Jazz functionality
 * to all child components. It handles authentication, sync configuration,
 * and provides the context needed for all Jazz composables to work.
 * 
 * @example
 * ```vue
 * <template>
 *   <JazzVueProvider
 *     :sync="{ peer: 'wss://cloud.jazz.tools/?key=your-app@example.com' }"
 *     :AccountSchema="MyAppAccount"
 *   >
 *     <MyApp />
 *   </JazzVueProvider>
 * </template>
 * 
 * <script setup lang="ts">
 * import { JazzVueProvider } from "jazz-vue-vamp";
 * import { MyAppAccount } from "./schema";
 * import MyApp from "./MyApp.vue";
 * </script>
 * ```
 * 
 * @component
 * @category Core
 */
export const JazzVueProvider = defineComponent({
  name: "JazzVueProvider",
  props: {
    guestMode: {
      type: Boolean,
      default: false,
    },
    sync: {
      type: Object as PropType<SyncConfig>,
      required: true,
    },
    AccountSchema: {
      type: [Function, Object] as unknown as PropType<
        (AccountClass<Account> & CoValueFromRaw<Account>) | AnyAccountSchema
      >,
      required: false,
    },
    storage: {
      type: String as PropType<"indexedDB">,
      default: undefined,
    },
    defaultProfileName: {
      type: String,
      required: false,
    },
    onAnonymousAccountDiscarded: {
      // biome-ignore lint/suspicious/noExplicitAny: Complex generic typing with Jazz framework internals
      type: Function as PropType<(anonymousAccount: any) => Promise<void>>,
      required: false,
    },
    onLogOut: {
      type: Function as PropType<() => void>,
      required: false,
    },
    logOutReplacement: {
      type: Function as PropType<() => void>,
      required: false,
    },
    enableSSR: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const contextManager = new JazzBrowserContextManager<
      (AccountClass<Account> & CoValueFromRaw<Account>) | AnyAccountSchema
    >({
      useAnonymousFallback: props.enableSSR,
    });

    // biome-ignore lint/suspicious/noExplicitAny: Complex generic typing with Jazz framework internals
    const ctx = ref<JazzContextType<any> | undefined>(undefined);

    provide(JazzContextSymbol, ctx);
    provide(JazzAuthContextSymbol, contextManager.getAuthSecretStorage());

    // Create stable callback references like React's useRefCallback
    const onLogOutCallback = () => props.onLogOut?.();
    const logOutReplacementCallback = () => props.logOutReplacement?.();
    const onAnonymousAccountDiscardedCallback = async (anonymousAccount: any) => {
      if (props.onAnonymousAccountDiscarded) {
        return props.onAnonymousAccountDiscarded(anonymousAccount);
      }
    };

    // Track if logOutReplacement is active
    const logoutReplacementActive = computed(() => Boolean(props.logOutReplacement));

    let unsubscribe: (() => void) | undefined;

    const createContextWithProps = () => {
      const contextProps: JazzContextManagerProps<any> = {
        AccountSchema: props.AccountSchema,
        guestMode: props.guestMode,
        sync: props.sync,
        storage: props.storage,
        defaultProfileName: props.defaultProfileName,
        onLogOut: onLogOutCallback,
        logOutReplacement: logoutReplacementActive.value ? logOutReplacementCallback : undefined,
        onAnonymousAccountDiscarded: onAnonymousAccountDiscardedCallback,
      };

      if (contextManager.propsChanged(contextProps)) {
        contextManager.createContext(contextProps).then(() => {
          // Set up subscription if not already done
          if (!unsubscribe) {
            unsubscribe = contextManager.subscribe(() => {
              ctx.value = contextManager.getCurrentValue();
            });
          }

          // Update current value
          ctx.value = contextManager.getCurrentValue();
        }).catch((error) => {
          console.error("Error creating Jazz browser context:", error);
        });
      } else {
        // Still set up subscription if not already done
        if (!unsubscribe) {
          unsubscribe = contextManager.subscribe(() => {
            ctx.value = contextManager.getCurrentValue();
          });
        }

        // Update current value
        ctx.value = contextManager.getCurrentValue();
      }
    };

    // Watch for prop changes that should trigger context recreation
    watch(
      () => ({
        peer: props.sync.peer,
        syncWhen: props.sync.when,
        storage: props.storage,
        guestMode: props.guestMode,
        AccountSchema: props.AccountSchema,
        defaultProfileName: props.defaultProfileName,
        hasLogOutReplacement: Boolean(props.logOutReplacement),
      }),
      createContextWithProps,
      { immediate: true },
    );

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Only call done() in production, not in development (for HMR)
      if (process.env.NODE_ENV !== "development") {
        contextManager.done();
      }
    });

    return () => (ctx.value ? slots.default?.() : null);
  },
});
