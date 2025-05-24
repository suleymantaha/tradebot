import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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
            const response = await authAPI.login(data)
            const { access_token, user } = response.data
            login(user, access_token)
            navigate('/dashboard')
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.'
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white/80 rounded-2xl shadow-2xl p-8 animate-fade-in">
                <div className="flex flex-col items-center">
                    {/* Logo or Icon */}
                    <div className="bg-blue-600 rounded-full p-3 mb-2 shadow-lg">
                        {/* Simple SVG icon */}
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3zm0 2c-2.67 0-8 1.337-8 4v2a1 1 0 001 1h14a1 1 0 001-1v-2c0-2.663-5.33-4-8-4z" /></svg>
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Hesabınıza giriş yapın
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Hesabınız yok mu?{' '}
                        <Link
                            to="/register"
                            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            Kayıt olun
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* Error message with animation */}
                    {error && (
                        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg animate-shake shadow">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all sm:text-sm shadow-sm"
                                placeholder="E-posta adresiniz"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="relative">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all sm:text-sm shadow-sm pr-10"
                                placeholder="Şifreniz"
                            />
                            {/* Show/Hide password icon */}
                            <button
                                type="button"
                                tabIndex={-1}
                                className="absolute right-2 top-9 text-gray-400 hover:text-blue-500 transition-colors"
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
                                <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
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
