import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'
import { extractErrorMessage } from '../../utils/error'

const ResetPasswordPage = () => {
    const { isDark } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm()

    const password = watch('password', '')

    // Token kontrolü
    useEffect(() => {
        if (!token) {
            setError('Geçersiz şifre sıfırlama linki. Lütfen yeni bir talep oluşturun.')
        }
    }, [token])

    // Şifre gücü kontrolü
    const getPasswordStrength = (password) => {
        if (!password) return { score: 0, text: '', color: 'gray' }

        let score = 0
        if (password.length >= 6) score += 1
        if (password.length >= 8) score += 1
        if (/[A-Z]/.test(password)) score += 1
        if (/[a-z]/.test(password)) score += 1
        if (/[0-9]/.test(password)) score += 1
        if (/[^A-Za-z0-9]/.test(password)) score += 1

        if (score <= 2) return { score, text: 'Zayıf', color: 'red' }
        if (score <= 4) return { score, text: 'Orta', color: 'yellow' }
        return { score, text: 'Güçlü', color: 'green' }
    }

    const passwordStrength = getPasswordStrength(password)

    const onSubmit = async (data) => {
        if (!token) return

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await authAPI.resetPassword({
                token,
                new_password: data.password
            })
            setSuccess(response.data.message)

            // 3 saniye sonra login sayfasına yönlendir
            setTimeout(() => {
                navigate('/login')
            }, 3000)

        } catch (err) {
            setError(
                extractErrorMessage(err) ||
                'Şifre sıfırlama işlemi sırasında bir hata oluştu.'
            )
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-gray-900 to-gray-800'
                : 'bg-gradient-to-br from-red-50 to-red-100'
                }`}>
                <div className={`max-w-md w-full space-y-8 rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${isDark
                    ? 'bg-gray-800/90 backdrop-blur-sm'
                    : 'bg-white/80 backdrop-blur-sm'
                    }`}>
                    <div className="text-center">
                        <div className="bg-red-500 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Geçersiz Link
                        </h2>
                        <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            Şifre sıfırlama linki geçersiz veya eksik.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="mt-4 inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                        >
                            Yeni Talep Oluştur
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark
            ? 'bg-gradient-to-br from-gray-900 to-gray-800'
            : 'bg-gradient-to-br from-green-50 to-green-100'
            }`}>
            <div className={`max-w-md w-full space-y-8 rounded-2xl shadow-2xl p-8 animate-fade-in transition-colors duration-300 ${isDark
                ? 'bg-gray-800/90 backdrop-blur-sm'
                : 'bg-white/80 backdrop-blur-sm'
                }`}>
                <div className="flex flex-col items-center">
                    {/* Icon */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-3 mb-2 shadow-lg">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className={`mt-2 text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Yeni Şifre Belirleyin
                    </h2>
                    <p className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Güvenli bir şifre seçin ve hesabınıza erişimi yeniden kazanın
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

                        <div className="space-y-4">
                            {/* New Password */}
                            <div className="relative">
                                <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Yeni Şifre
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
                                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all sm:text-sm shadow-sm pr-10 ${isDark
                                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                        }`}
                                    placeholder="Yeni şifrenizi girin"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    className={`absolute right-2 top-9 transition-colors ${isDark
                                        ? 'text-gray-400 hover:text-green-400'
                                        : 'text-gray-400 hover:text-green-500'
                                        }`}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675m1.675-2.05A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.336 3.236-.938 4.675m-1.675 2.05A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.password.message}</p>
                                )}

                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Şifre Gücü:
                                            </span>
                                            <span className={`font-medium text-${passwordStrength.color}-500`}>
                                                {passwordStrength.text}
                                            </span>
                                        </div>
                                        <div className="mt-1 w-full bg-gray-300 rounded-full h-1">
                                            <div
                                                className={`h-1 rounded-full transition-all bg-${passwordStrength.color}-500`}
                                                style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="relative">
                                <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Şifre Tekrarı
                                </label>
                                <input
                                    {...register('confirmPassword', {
                                        required: 'Şifre tekrarı gereklidir',
                                        validate: value => value === password || 'Şifreler eşleşmiyor'
                                    })}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all sm:text-sm shadow-sm pr-10 ${isDark
                                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                        }`}
                                    placeholder="Şifrenizi tekrar girin"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    className={`absolute right-2 top-9 transition-colors ${isDark
                                        ? 'text-gray-400 hover:text-green-400'
                                        : 'text-gray-400 hover:text-green-500'
                                        }`}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675m1.675-2.05A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.336 3.236-.938 4.675m-1.675 2.05A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                        </svg>
                                        Şifre Sıfırlanıyor...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Şifreyi Sıfırla
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
                            <div>
                                <h3 className={`text-lg font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                                    Şifre Başarıyla Sıfırlandı! 🎉
                                </h3>
                                <p className={`mt-2 text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                                    {success}
                                </p>
                                <p className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    3 saniye içinde giriş sayfasına yönlendirileceksiniz...
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

export default ResetPasswordPage