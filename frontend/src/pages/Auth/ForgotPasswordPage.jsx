import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'
import { extractErrorMessage } from '../../utils/error'

const ForgotPasswordPage = () => {
    const { isDark } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const onSubmit = async (data) => {
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await authAPI.forgotPassword(data)
            setSuccess(response.data.message)
        } catch (err) {
            setError(
                extractErrorMessage(err) ||
                'Şifre sıfırlama talebi gönderilirken bir hata oluştu.'
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
                    {/* Icon */}
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-3 mb-2 shadow-lg">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className={`mt-2 text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Şifrenizi mi unuttunuz?
                    </h2>
                    <p className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        E-posta adresinizi girin, şifre sıfırlama linki gönderelim
                    </p>
                </div>

                {!success && (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {/* Error message */}
                        {error && (
                            <div className={`px-4 py-3 rounded-lg animate-shake shadow ${isDark
                                ? 'bg-red-900/30 border border-red-700 text-red-300'
                                : 'bg-red-100 border border-red-300 text-red-700'
                                }`}>
                                {error}
                            </div>
                        )}

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
                                className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all sm:text-sm shadow-sm ${isDark
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                    }`}
                                placeholder="E-posta adresinizi girin"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                        </svg>
                                        Gönderiliyor...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Sıfırlama Linki Gönder
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Success message */}
                {success && (
                    <div className={`p-6 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="w-full">
                                <h3 className={`text-lg font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                                    Email Gönderildi! 📧
                                </h3>
                                <div className={`mt-2 text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                                    {/* 🔧 Development mode'da reset linkini göster */}
                                    {success.includes('DEV MODE:') ? (
                                        <div className="space-y-3">
                                            <p>{success.split('\n\n🔧 DEV MODE:')[0]}</p>
                                            <div className={`p-3 rounded-lg border-2 border-dashed ${isDark ? 'border-yellow-400 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-50'}`}>
                                                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                                    🔧 DEVELOPMENT MODE - Şifre Sıfırlama Linki:
                                                </p>
                                                <Link
                                                    to={success.split('🔧 DEV MODE: ')[1]}
                                                    className={`inline-block w-full text-center px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${isDark
                                                        ? 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100'
                                                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                        }`}
                                                >
                                                    🔗 Şifre Sıfırlama Sayfasına Git
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <p>{success}</p>
                                    )}
                                </div>
                                <p className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    ⚠️ Email gelmezse spam klasörünüzü kontrol edin.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Back to login */}
                <div className="text-center">
                    <Link
                        to="/login"
                        className={`text-sm font-medium transition-colors ${isDark
                            ? 'text-gray-300 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        ← Giriş sayfasına dön
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordPage
