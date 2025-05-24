import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (user, token) => {
                set({
                    user,
                    token,
                    isAuthenticated: true,
                })
                localStorage.setItem('token', token)
                console.log('✅ Login successful:', { user: user.email, hasToken: !!token })
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                })
                localStorage.removeItem('token')
                console.log('🚪 Logout successful')
            },

            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData }
                }))
            },

            initializeFromStorage: () => {
                const storedToken = localStorage.getItem('token')
                const currentState = get()

                console.log('🔄 Initializing auth from storage:', {
                    storeToken: !!currentState.token,
                    localToken: !!storedToken,
                    isAuthenticated: currentState.isAuthenticated
                })

                if (!currentState.token && storedToken) {
                    console.log('📥 Restoring token from localStorage')
                    set(state => ({
                        ...state,
                        token: storedToken,
                        isAuthenticated: true
                    }))
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)

export default useAuthStore
