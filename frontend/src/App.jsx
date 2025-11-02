import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import MainLayout from './components/Layout/MainLayout'
import PrivateRoute from './components/Auth/PrivateRoute'
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'))
const ApiKeysPage = lazy(() => import('./pages/ApiKeys/ApiKeysPage'))
const BotsPage = lazy(() => import('./pages/Bots/BotsPage'))
const BotCreatePage = lazy(() => import('./pages/Bots/BotCreatePage'))
const BotDetailPage = lazy(() => import('./pages/Bots/BotDetailPage'))
const BotEditPage = lazy(() => import('./pages/Bots/BotEditPage'))
const BotTrades = lazy(() => import('./pages/Bots/BotTrades'))
const BotPerformance = lazy(() => import('./pages/Bots/BotPerformance'))
const BacktestPage = lazy(() => import('./pages/Backtest/BacktestPage'))
const BacktestReportPage = lazy(() => import('./pages/Backtest/BacktestReportPage'))
const MarketsPage = lazy(() => import('./pages/Markets/MarketsPage'))
import { ThemeProvider } from './contexts/ThemeContext'
import MarketsErrorBoundary from './components/ErrorBoundary/MarketsErrorBoundary'
import useAuthStore from './store/authStore'

function App() {
    const { isAuthenticated, initializeFromStorage } = useAuthStore()

    // Store'u localStorage'dan initialize et
    useEffect(() => {
        initializeFromStorage()
    }, [initializeFromStorage])

    return (
        <ThemeProvider>
            <Router>
                <Suspense fallback={<div className="p-6 text-center">Yükleniyor...</div>}>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            {/* Public routes */}
                            <Route
                                index
                                element={
                                    isAuthenticated ?
                                        <Navigate to="/dashboard" replace /> :
                                        <Navigate to="/login" replace />
                                }
                            />
                            <Route
                                path="login"
                                element={
                                    isAuthenticated ?
                                        <Navigate to="/dashboard" replace /> :
                                        <LoginPage />
                                }
                            />
                            <Route
                                path="register"
                                element={
                                    isAuthenticated ?
                                        <Navigate to="/dashboard" replace /> :
                                        <RegisterPage />
                                }
                            />
                            <Route
                                path="forgot-password"
                                element={
                                    isAuthenticated ?
                                        <Navigate to="/dashboard" replace /> :
                                        <ForgotPasswordPage />
                                }
                            />
                            <Route
                                path="reset-password"
                                element={
                                    isAuthenticated ?
                                        <Navigate to="/dashboard" replace /> :
                                        <ResetPasswordPage />
                                }
                            />

                            {/* Private routes */}
                            <Route
                                path="dashboard"
                                element={
                                    <PrivateRoute>
                                        <DashboardPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="api-keys"
                                element={
                                    <PrivateRoute>
                                        <ApiKeysPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="bots"
                                element={
                                    <PrivateRoute>
                                        <BotsPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="bots/create"
                                element={
                                    <PrivateRoute>
                                        <BotCreatePage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="bots/:id"
                                element={
                                    <PrivateRoute>
                                        <BotDetailPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="bots/:id/edit"
                                element={
                                    <PrivateRoute>
                                        <BotEditPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="bots/:id/trades"
                                element={
                                    <PrivateRoute>
                                        <BotTrades />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="bots/:id/performance"
                                element={
                                    <PrivateRoute>
                                        <BotPerformance />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="backtest"
                                element={
                                    <PrivateRoute>
                                        <BacktestPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="backtest/report"
                                element={
                                    <PrivateRoute>
                                        <BacktestReportPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="markets"
                                element={
                                    <PrivateRoute>
                                        <MarketsErrorBoundary>
                                            <MarketsPage />
                                        </MarketsErrorBoundary>
                                    </PrivateRoute>
                                }
                            />

                            {/* Catch all route */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </Suspense>
            </Router>
        </ThemeProvider>
    )
}

export default App
