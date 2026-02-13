/**
 * Authentication state composable.
 * Manages user session via HTTP-only cookies.
 */
export interface User {
    id: string
    email: string
    name: string
    createdAt: string
}

const user = ref<User | null>(null)
const loading = ref(true)

export function useAuth() {
    const api = useApi()

    async function fetchUser() {
        try {
            loading.value = true
            user.value = await api.get<User>('/api/auth/me')
        } catch {
            user.value = null
        } finally {
            loading.value = false
        }
    }

    async function login(email: string, password: string) {
        const res = await api.post<{ user: User; message: string }>('/api/auth/login', {
            email,
            password,
        })
        user.value = res.user
        return res
    }

    async function loginWithProvider(provider: string, payload: any) {
        const res = await api.post<{ user: User; message: string }>(`/api/auth/provider/${provider}`, payload)
        user.value = res.user
        return res
    }

    async function register(email: string, name: string, password: string) {
        const res = await api.post<{ user: User; message: string }>('/api/auth/register', {
            email,
            name,
            password,
        })
        user.value = res.user
        return res
    }

    async function logout() {
        await api.post('/api/auth/logout')
        user.value = null
        navigateTo('/login')
    }

    const isAuthenticated = computed(() => !!user.value)

    return {
        user: readonly(user),
        loading: readonly(loading),
        isAuthenticated,
        fetchUser,
        login,
        loginWithProvider,
        register,
        logout,
    }
}
