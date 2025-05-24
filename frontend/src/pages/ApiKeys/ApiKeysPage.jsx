import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { apiKeyAPI } from '../../services/api'

const ApiKeysPage = () => {
    const [apiKey, setApiKey] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm()

    const fetchApiKey = async () => {
        try {
            const response = await apiKeyAPI.getMe()
            setApiKey(response.data)
        } catch (err) {
            if (err.response?.status !== 404) {
                setError('API anahtarı durumu kontrol edilirken hata oluştu')
            }
            setApiKey(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApiKey()
    }, [])

    const onSubmit = async (data) => {
        setIsAdding(true)
        setError('')
        setSuccess('')

        try {
            await apiKeyAPI.create({
                api_key: data.api_key,
                secret_key: data.secret_key,
                label: data.label,
            })

            setSuccess('API anahtarı başarıyla eklendi!')
            reset()
            await fetchApiKey() // Listeyi yenile
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'API anahtarı eklenirken bir hata oluştu.'
            )
        } finally {
            setIsAdding(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('API anahtarını silmek istediğinizden emin misiniz?\n\nUYARI: Bu işlem API anahtarınızla birlikte tüm botlarınızı da silecektir ve geri alınamaz!')) {
            return
        }

        setIsDeleting(true)
        setError('')
        setSuccess('')

        try {
            await apiKeyAPI.deleteMe()
            setSuccess('API anahtarı başarıyla silindi!')
            setApiKey(null)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'API anahtarı silinirken bir hata oluştu.'
            )
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600 text-center font-medium">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12 animate-fadeIn">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-6 float">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        API Anahtarı Yönetimi
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Binance API anahtarınızı güvenli şekilde saklayın ve trading botlarınızla kullanın
                    </p>
                </div>

                {/* Alert Messages */}
                {error && (
                    <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg animate-fadeIn">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl shadow-lg animate-fadeIn success-bounce">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {success}
                        </div>
                    </div>
                )}

                {/* Mevcut API Key */}
                {apiKey ? (
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 card-hover animate-fadeIn">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-6">
                            <div className="flex items-center">
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mr-6">
                                    <span className="text-3xl">🔑</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        Kayıtlı API Anahtarı
                                    </h3>
                                    <p className="text-green-100">
                                        ✅ API anahtarınız güvenli şekilde saklanıyor
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            🔐 API Anahtarı
                                        </label>
                                        <div className="text-sm text-gray-900 font-mono bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                                            {apiKey.api_key_masked}
                                        </div>
                                    </div>

                                    {apiKey.label && (
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                🏷️ Etiket
                                            </label>
                                            <div className="text-sm text-gray-900 font-medium">
                                                {apiKey.label}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            📊 Durum
                                        </label>
                                        <div>
                                            <span
                                                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${apiKey.is_valid
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                                    }`}
                                            >
                                                {apiKey.is_valid ? '✅ Geçerli' : '❌ Geçersiz'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            📅 Oluşturulma Tarihi
                                        </label>
                                        <div className="text-sm text-gray-900 font-medium">
                                            {new Date(apiKey.created_at).toLocaleString('tr-TR')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-2xl">
                                    <div>
                                        <h4 className="text-lg font-semibold text-red-800 mb-2">⚠️ Tehlikeli Bölge</h4>
                                        <p className="text-sm text-red-700">
                                            API anahtarını silmek tüm botlarınızı kalıcı olarak siler. Bu işlem geri alınamaz!
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Siliniyor...
                                            </>
                                        ) : '🗑️ API Anahtarını Sil'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* API Key Ekleme Formu */
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden card-hover animate-fadeIn">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-6">
                            <div className="flex items-center">
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mr-6">
                                    <span className="text-3xl">🔑</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        Binance API Anahtarı Ekle
                                    </h3>
                                    <p className="text-indigo-100">
                                        🚀 Trading botlarınızı çalıştırmak için API anahtarı gerekli
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-8">
                            {/* Güvenlik Uyarısı */}
                            <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">🛡️</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-semibold text-amber-800 mb-3">
                                            Güvenlik Uyarısı
                                        </h4>
                                        <div className="text-sm text-amber-700 space-y-2">
                                            <div className="flex items-center">
                                                <span className="text-green-500 mr-2">✅</span>
                                                API anahtarınız şifrelenmiş olarak saklanır
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-green-500 mr-2">✅</span>
                                                Sadece spot trading izinleri vermeniz önerilir
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-red-500 mr-2">❌</span>
                                                Withdrawal (para çekme) izni vermeyin
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-red-500 mr-2">❌</span>
                                                API anahtarınızı kimseyle paylaşmayın
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                <div>
                                    <label htmlFor="api_key" className="block text-sm font-semibold text-gray-700 mb-3">
                                        🔐 API Anahtarı *
                                    </label>
                                    <input
                                        {...register('api_key', {
                                            required: 'API anahtarı gereklidir',
                                            minLength: {
                                                value: 10,
                                                message: 'API anahtarı en az 10 karakter olmalıdır',
                                            },
                                        })}
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                        placeholder="Binance API anahtarınızı girin"
                                    />
                                    {errors.api_key && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.api_key.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="secret_key" className="block text-sm font-semibold text-gray-700 mb-3">
                                        🔒 Secret Anahtarı *
                                    </label>
                                    <input
                                        {...register('secret_key', {
                                            required: 'Secret anahtarı gereklidir',
                                            minLength: {
                                                value: 10,
                                                message: 'Secret anahtarı en az 10 karakter olmalıdır',
                                            },
                                        })}
                                        type="password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                        placeholder="Binance Secret anahtarınızı girin"
                                    />
                                    {errors.secret_key && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.secret_key.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="label" className="block text-sm font-semibold text-gray-700 mb-3">
                                        🏷️ Etiket (Opsiyonel)
                                    </label>
                                    <input
                                        {...register('label')}
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                        placeholder="örn: Ana Hesap"
                                    />
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isAdding}
                                        className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        {isAdding ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Doğrulanıyor ve Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                API Anahtarını Ekle
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ApiKeysPage
