import React, { useCallback, useRef } from 'react'
import { useComponentState } from './ComponentStateManager'

// Retry configurations
const RETRY_CONFIGS = {
    api: { maxAttempts: 3, baseDelay: 1000, backoffMultiplier: 2, maxDelay: 10000 },
    websocket: { maxAttempts: Infinity, baseDelay: 5000, backoffMultiplier: 1.5, maxDelay: 30000 },
    script: { maxAttempts: 3, baseDelay: 2000, backoffMultiplier: 2, maxDelay: 15000 }
}

/**
 * Enhanced Retry Manager Hook
 */
export const useRetryManager = () => {
    const { state, actions, computed } = useComponentState()
    const timeoutsRef = useRef({})
    const attemptsRef = useRef({})

    const calculateDelay = useCallback((attempt, config) => {
        const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)
        return Math.min(delay, config.maxDelay)
    }, [])

    const canRetry = useCallback((serviceName) => {
        return computed.canRetry(serviceName)
    }, [computed])

    const recordSuccess = useCallback((serviceName) => {
        actions.recordSuccess(serviceName)
        if (attemptsRef.current[serviceName]) {
            attemptsRef.current[serviceName] = 0
        }
    }, [actions])

    const recordFailure = useCallback((serviceName, error) => {
        actions.recordFailure(serviceName)
        attemptsRef.current[serviceName] = (attemptsRef.current[serviceName] || 0) + 1
    }, [actions])

    // Execute operation with retry logic
    const executeWithRetry = useCallback(async (operation, options = {}) => {
        const {
            serviceName = 'default',
            retryType = 'api',
            onAttempt = () => { },
            onSuccess = () => { },
            onFailure = () => { },
            maxAttempts = null
        } = options

        const config = RETRY_CONFIGS[retryType] || RETRY_CONFIGS.api
        const maxRetries = maxAttempts || config.maxAttempts

        let attempt = 0
        let lastError = null

        while (attempt < maxRetries) {
            try {
                if (!canRetry(serviceName)) {
                    throw new Error(`Circuit breaker open for ${serviceName}`)
                }

                onAttempt(attempt, serviceName)
                const result = await operation(attempt)

                recordSuccess(serviceName)
                onSuccess(result, attempt)
                return result

            } catch (error) {
                lastError = error
                attempt++

                recordFailure(serviceName, error)
                onFailure(error, attempt - 1)

                if (attempt >= maxRetries) break

                const delay = calculateDelay(attempt - 1, config)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }

        throw lastError
    }, [canRetry, recordSuccess, recordFailure, calculateDelay])

    // Schedule retry with delay
    const scheduleRetry = useCallback((operation, options = {}) => {
        const { serviceName = 'default', retryType = 'api', delay = null } = options
        const config = RETRY_CONFIGS[retryType] || RETRY_CONFIGS.api
        const currentAttempt = attemptsRef.current[serviceName] || 0
        const retryDelay = delay || calculateDelay(currentAttempt, config)

        const timeoutId = setTimeout(async () => {
            try {
                await operation(currentAttempt)
            } catch (error) {
                console.error(`Scheduled retry failed for ${serviceName}:`, error)
            }
            delete timeoutsRef.current[serviceName]
        }, retryDelay)

        timeoutsRef.current[serviceName] = timeoutId

        return () => {
            if (timeoutsRef.current[serviceName]) {
                clearTimeout(timeoutsRef.current[serviceName])
                delete timeoutsRef.current[serviceName]
            }
        }
    }, [calculateDelay])

    const cancelRetry = useCallback((serviceName) => {
        if (timeoutsRef.current[serviceName]) {
            clearTimeout(timeoutsRef.current[serviceName])
            delete timeoutsRef.current[serviceName]
        }
    }, [])

    const getRetryStatus = useCallback((serviceName) => {
        const circuit = state.recovery.circuitBreaker[serviceName]
        const attempts = attemptsRef.current[serviceName] || 0
        const isScheduled = !!timeoutsRef.current[serviceName]

        return {
            attempts,
            isScheduled,
            canRetry: canRetry(serviceName),
            circuitOpen: circuit?.isOpen || false,
            failures: circuit?.failures || 0
        }
    }, [state.recovery.circuitBreaker, canRetry])

    const resetRetryState = useCallback((serviceName) => {
        cancelRetry(serviceName)
        if (attemptsRef.current[serviceName]) {
            attemptsRef.current[serviceName] = 0
        }
        actions.closeCircuit(serviceName)
    }, [cancelRetry, actions])

    return {
        executeWithRetry,
        scheduleRetry,
        cancelRetry,
        getRetryStatus,
        resetRetryState,
        recordSuccess,
        recordFailure,
        canRetry
    }
}

/**
 * Smart Retry Button Component
 */
export const SmartRetryButton = ({
    serviceName,
    onRetry,
    className = "",
    children = "Yeniden Dene"
}) => {
    const retryManager = useRetryManager()
    const status = retryManager.getRetryStatus(serviceName)

    const handleRetry = useCallback(async () => {
        if (onRetry) {
            await onRetry()
        }
    }, [onRetry])

    const isDisabled = !status.canRetry || status.isScheduled

    const getButtonText = () => {
        if (status.isScheduled) return 'Deneniyor...'
        if (status.circuitOpen) return 'Bekleniyor...'
        if (status.attempts > 0) return `${children} (${status.attempts})`
        return children
    }

    return (
        <button
            onClick={handleRetry}
            disabled={isDisabled}
            className={`
                inline-flex items-center px-3 py-2 text-sm font-medium rounded-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${status.circuitOpen ?
                    'bg-red-100 text-red-800 border border-red-300' :
                    'bg-indigo-600 hover:bg-indigo-700 text-white'
                }
                ${className}
            `}
        >
            {status.isScheduled && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            )}
            {getButtonText()}
        </button>
    )
}

export default useRetryManager
