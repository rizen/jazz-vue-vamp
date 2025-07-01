import { useAccount } from 'jazz-vue-vamp'
import { JazzAccount } from '../../jazz/schema'

/**
 * Authentication guard composable that redirects unauthenticated users to login
 * Uses the current route path for redirect, just like the original implementation
 */
export const useAuthGuard = () => {
    const { me, agent } = useAccount(JazzAccount)
    const route = useRoute()

    onMounted(() => {
        if (agent.value._type !== 'Account') {
            navigateTo(`/login?redirect=${route.path}`)
        }
    })

    return {
        me,
        agent,
        isAuthenticated: computed(() => agent.value._type === 'Account')
    }
} 