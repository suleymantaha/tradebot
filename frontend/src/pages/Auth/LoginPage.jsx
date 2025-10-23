import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'
import { extractErrorMessage } from '../../utils/error'

const LoginPage = () => {
    const { isDark } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const navigate = useNavigate()
    const login = useAuthStore((state) => state.login)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const onSubmit = async (data) => {
        setIsLoading(true)
        setError('')
        try {
            const loginData = {
                ...data,
                remember_me: rememberMe
            }
            const response = await authAPI.login(loginData)
            const { access_token, user } = response.data

            // Prod ortamında debug log bastırma
            if (import.meta.env.MODE !== 'production') {
                console.log(`🔒 Login successful with ${rememberMe ? '30 day' : '7 day'} token`)
            }

            login(user, access_token)
            navigate('/dashboard')
        } catch (err) {
            setError(
                extractErrorMessage(err) ||
                'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.'
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark
            ? 'bg-gradient-to-br from-gray-900 to-gray-800'
            : 'bg-gradient-to-br from-blue-50 to-blue-100'
            }`}>
            <div className={`max-w-md w-full space-y-8 rounded-2xl shadow-2xl p-8 animate-fade-in transition-colors duration-300 ${isDark
                ? 'bg-gray-800/90 backdrop-blur-sm'
                : 'bg-white/80 backdrop-blur-sm'
                }`}>
                <div className="flex flex-col items-center">
                    {/* Logo or Icon */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-3 mb-2 shadow-lg">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h2 className={`mt-2 text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Hesabınıza giriş yapın
                    </h2>
                    <p className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Hesabınız yok mu?{' '}
                        <Link
                            to="/register"
                            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                        >
                            Kayıt olun
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* Error message with animation */}
                    {error && (
                        <div className={`px-4 py-3 rounded-lg animate-shake shadow ${isDark
                            ? 'bg-red-900/30 border border-red-700 text-red-300'
                            : 'bg-red-100 border border-red-300 text-red-700'
                            }`}>
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                E-posta adresi
                            </label>
                            <input
                                {...register('email', {
                                    required: 'E-posta adresi gereklidir',
                                    pattern: {
                                        value: /^\S+@\S+$/i,
                                        message: 'Geçerli bir e-posta adresi girin',
                                    },
                                })}
                                type="email"
                                className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm shadow-sm ${isDark
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                    }`}
                                placeholder="E-posta adresiniz"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="relative">
                            <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Şifre
                            </label>
                            <input
                                {...register('password', {
                                    required: 'Şifre gereklidir',
                                    minLength: {
                                        value: 6,
                                        message: 'Şifre en az 6 karakter olmalıdır',
                                    },
                                })}
                                type={showPassword ? 'text' : 'password'}
                                className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm shadow-sm pr-10 ${isDark
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                    }`}
                                placeholder="Şifreniz"
                            />
                            {/* Show/Hide password icon */}
                            <button
                                type="button"
                                tabIndex={-1}
                                className={`absolute right-2 top-9 transition-colors ${isDark
                                    ? 'text-gray-400 hover:text-indigo-400'
                                    : 'text-gray-400 hover:text-indigo-500'
                                    }`}
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675m1.675-2.05A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.336 3.236-.938 4.675m-1.675 2.05A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .53-.14 1.03-.38 1.46M6.1 6.1A9.956 9.956 0 002 12c0 5.523 4.477 10 10 10 1.657 0 3.236-.336 4.675-.938m2.05-1.675A9.956 9.956 0 0021 12c0-5.523-4.477-10-10-10-1.657 0-3.236.336-4.675.938" /></svg>
                                )}
                            </button>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    {/* 🆕 Remember Me Checkbox */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                            />
                            <label htmlFor="remember-me" className={`ml-2 block text-sm cursor-pointer transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
                                🔒 Beni hatırla (1 ay)
                            </label>
                        </div>
                        <div className="text-sm">
                            <Link
                                to="/forgot-password"
                                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Şifrenizi mi unuttunuz?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                    Giriş yapılıyor...
                                </span>
                            ) : 'Giriş Yap'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default LoginPage

// Açıklama: Bu sayfa modern bir login arayüzü sunar. Şifre göster/gizle, animasyonlu hata mesajı, yumuşak kart ve logo içerir. Tailwind ile kolayca özelleştirilebilir.