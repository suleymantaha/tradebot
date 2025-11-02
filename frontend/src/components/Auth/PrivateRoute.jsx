import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { authAPI } from '../../services/api'

const PrivateRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const logout = useAuthStore((state) => state.logout)
    const [checked, setChecked] = useState(false)
    const [valid, setValid] = useState(false)

    useEffect(() => {
        let cancelled = false
        const verify = async () => {
            // If we don't think we're auth, no need to verify
            if (!isAuthenticated) {
                if (!cancelled) {
                    setValid(false)
                    setChecked(true)
                }
                return
            }
            try {
                await authAPI.getMe()
                if (!cancelled) {
                    setValid(true)
                    setChecked(true)
                }
            } catch (err) {
                // Token invalid or expired — ensure logout and redirect
                try { logout() } catch { /* noop */ }
                if (!cancelled) {
                    setValid(false)
                    setChecked(true)
                }
            }
        }
        verify()
        return () => { cancelled = true }
    }, [isAuthenticated, logout])

    if (!checked) {
        // Minimal loader to avoid rendering protected pages before auth check
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="p-6 rounded-xl shadow">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                </div>
            </div>
        )
    }

    return valid ? children : <Navigate to="/login" replace />
}

export default PrivateRoute
