import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'

const MainLayout = () => {
    const { isAuthenticated, user, logout } = useAuthStore()
    const { isDark, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const isActivePath = (path) => {
        if (path === '/dashboard' && location.pathname === '/') return true
        return location.pathname.startsWith(path)
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: '📊' },
        { name: 'Botlar', href: '/bots', icon: '🤖' },
        { name: 'Backtest', href: '/backtest', icon: '📈' },
        { name: 'API Anahtarları', href: '/api-keys', icon: '🔑' },
    ]

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
            {/* Modern Navbar */}
            <nav className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg border-b backdrop-blur-lg bg-opacity-95 sticky top-0 z-50 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 group">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                                        <span className="text-xl">🚀</span>
                                    </div>
                                    <h1 className={`text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
                                        TradeBot
                                    </h1>
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {isAuthenticated ? (
                                <>
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 group ${isActivePath(item.href)
                                                ? `${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'} shadow-lg`
                                                : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                                                }`}
                                        >
                                            <span className="text-lg group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}

                                    {/* Theme Toggle */}
                                    <button
                                        onClick={toggleTheme}
                                        className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'text-gray-300 hover:text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}
                                        title={isDark ? 'Açık moda geç' : 'Koyu moda geç'}
                                    >
                                        {isDark ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* User Menu */}
                                    <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-300 dark:border-gray-600">
                                        <div className={`hidden sm:flex flex-col items-end ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <span className="text-sm font-medium">Merhaba!</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                                                {user?.email}
                                            </span>
                                        </div>
                                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                            title="Çıkış Yap"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Theme Toggle for non-authenticated users */}
                                    <button
                                        onClick={toggleTheme}
                                        className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'text-gray-300 hover:text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}
                                        title={isDark ? 'Açık moda geç' : 'Koyu moda geç'}
                                    >
                                        {isDark ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        )}
                                    </button>

                                    <Link
                                        to="/login"
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center space-x-2">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'text-gray-300 hover:text-yellow-400' : 'text-gray-600 hover:text-blue-600'}`}
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                            >
                                {isMobileMenuOpen ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className={`md:hidden ${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="px-4 pt-2 pb-4 space-y-2">
                            {isAuthenticated ? (
                                <>
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 flex items-center space-x-3 ${isActivePath(item.href)
                                                ? `${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`
                                                : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                                                }`}
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}

                                    <div className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} mt-4`}>
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {user?.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">Merhaba!</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                                        >
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Modern Footer */}
            <footer className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t transition-colors duration-300`}>
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-lg">🚀</span>
                            </div>
                            <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                TradeBot
                            </span>
                        </div>
                        <p className={`text-sm mt-2 sm:mt-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            © 2024 TradeBot. Tüm hakları saklıdır.
                        </p>
                        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                v1.0.0
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default MainLayout
