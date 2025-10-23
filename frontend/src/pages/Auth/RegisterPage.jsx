import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'
import { extractErrorMessage } from '../../utils/error'

const RegisterPage = () => {
    const { isDark } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm()

    const password = watch('password')

    const onSubmit = async (data) => {
        setIsLoading(true)
        setError('')

        try {
            await authAPI.register({
                email: data.email,
                password: data.password,
            })

            setSuccess(true)
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err) {
            setError(
                extractErrorMessage(err) ||
                'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.'
            )
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-gray-900 to-gray-800'
                : 'bg-gradient-to-br from-green-50 to-emerald-100'
                }`}>
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${isDark ? 'bg-green-900/30' : 'bg-green-100'} animate-bounce`}>
                            <svg
                                className="h-8 w-8 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className={`mt-6 text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Kayıt başarılı! 🎉
                        </h2>
                        <p className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark
            ? 'bg-gradient-to-br from-gray-900 to-gray-800'
            : 'bg-gradient-to-br from-indigo-50 to-purple-100'
            }`}>
            <div className={`max-w-md w-full space-y-8 rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${isDark
                ? 'bg-gray-800/90 backdrop-blur-sm'
                : 'bg-white/80 backdrop-blur-sm'
                }`}>
                <div className="text-center">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-3 mb-4 shadow-lg mx-auto w-fit">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className={`text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Hesap oluşturun
                    </h2>
                    <p className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Zaten hesabınız var mı?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                        >
                            Giriş yapın
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className={`px-4 py-3 rounded-lg shadow ${isDark
                            ? 'bg-red-900/30 border border-red-700 text-red-300'
                            : 'bg-red-50 border border-red-200 text-red-700'
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
                                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
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
                                type="password"
                                className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm shadow-sm ${isDark
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                    }`}
                                placeholder="Şifreniz"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Şifre Tekrarı
                            </label>
                            <input
                                {...register('confirmPassword', {
                                    required: 'Şifre tekrarı gereklidir',
                                    validate: (value) =>
                                        value === password || 'Şifreler eşleşmiyor',
                                })}
                                type="password"
                                className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm shadow-sm ${isDark
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                    }`}
                                placeholder="Şifrenizi tekrar girin"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                            )}
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
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                    </svg>
                                    Kayıt olunuyor...
                                </span>
                            ) : 'Kayıt Ol'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RegisterPage

