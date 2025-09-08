import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
        this.handleRetry = this.handleRetry.bind(this)
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error('ErrorBoundary caught an error:', error, info)
        }
    }

    handleRetry() {
        this.setState({ hasError: false, error: null })
        if (typeof this.props.onRetry === 'function') {
            try { this.props.onRetry() } catch (_) { }
        }
    }

    render() {
        const { hasError, error } = this.state
        const { children, message, fallback } = this.props

        if (hasError) {
            if (typeof fallback === 'function') {
                return fallback(error, this.handleRetry)
            }
            return (
                <div className="p-6">
                    <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
                        {message || 'Bir hata oluştu'}
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm"
                    >
                        Tekrar Dene
                    </button>
                </div>
            )
        }

        return children
    }
}

export default ErrorBoundary


