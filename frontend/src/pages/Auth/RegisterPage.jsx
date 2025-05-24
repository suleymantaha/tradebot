import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../services/api'

const RegisterPage = () => {
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
                err.response?.data?.detail ||
                'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.'
            )
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg
                                className="h-6 w-6 text-green-600"
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
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Kayıt başarılı!
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Hesap oluşturun
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Zaten hesabınız var mı?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-blue-600 hover:text-blue-500"
                        >
                            Giriş yapın
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="E-posta adresiniz"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
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
                                type="password"
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Şifreniz"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Şifre Tekrarı
                            </label>
                            <input
                                {...register('confirmPassword', {
                                    required: 'Şifre tekrarı gereklidir',
                                    validate: (value) =>
                                        value === password || 'Şifreler eşleşmiyor',
                                })}
                                type="password"
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Şifrenizi tekrar girin"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RegisterPage
