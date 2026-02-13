/**
 * Typed API client composable.
 * Uses $fetch with credentials: 'include' for cookie-based auth.
 * Auto-redirects to /login on 401.
 */
export function useApi() {
    const config = useRuntimeConfig()

    async function request<T = any>(
        path: string,
        options: {
            method?: string
            body?: any
            query?: Record<string, string | undefined>
        } = {},
    ): Promise<T> {
        try {
            return await $fetch<T>(path, {
                baseURL: config.public.apiBase as string,
                method: (options.method || 'GET') as any,
                body: options.body,
                query: options.query,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        } catch (err: any) {
            if (err?.response?.status === 401) {
                const route = useRoute()
                if (route.path !== '/login' && route.path !== '/register') {
                    navigateTo('/login')
                }
            }
            throw err
        }
    }

    return {
        get: <T = any>(path: string, query?: Record<string, string | undefined>) =>
            request<T>(path, { query }),

        post: <T = any>(path: string, body?: any) =>
            request<T>(path, { method: 'POST', body }),

        put: <T = any>(path: string, body?: any) =>
            request<T>(path, { method: 'PUT', body }),

        patch: <T = any>(path: string, body?: any) =>
            request<T>(path, { method: 'PATCH', body }),

        del: <T = any>(path: string) =>
            request<T>(path, { method: 'DELETE' }),
    }
}
