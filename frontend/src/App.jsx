import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import PrivateRoute from './components/Auth/PrivateRoute'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ApiKeysPage from './pages/ApiKeys/ApiKeysPage'
import BotsPage from './pages/Bots/BotsPage'
import BotCreatePage from './pages/Bots/BotCreatePage'
import BotDetailPage from './pages/Bots/BotDetailPage'
import { ThemeProvider } from './contexts/ThemeContext'
import useAuthStore from './store/authStore'

function App() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    return (
        <ThemeProvider>
            <Router>
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

                        {/* Catch all route */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Router>
        </ThemeProvider>
    )
}

export default App
