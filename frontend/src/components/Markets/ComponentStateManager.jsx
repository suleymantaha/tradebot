import React, { createContext, useContext, useReducer, useCallback } from 'react'

// State shape definition
const initialState = {
    // UI state
    ui: {
        loading: true,
        error: null,
        retryCount: 0,
        lastUpdate: null
    },
    
    // Feature availability
    features: {
        tradingView: 'loading', // 'loading' | 'ready' | 'failed' | 'disabled'
        symbols: 'loading',     // 'loading' | 'loaded' | 'cached' | 'static' | 'failed'
        webSocket: 'connecting', // 'connecting' | 'connected' | 'disconnected' | 'failed'
        realTimeData: false
    },
    
    // Fallback data
    fallbacks: {
        symbolsCache: null,
        lastKnownData: null,
        staticConfig: null
    },
    
    // Recovery state
    recovery: {
        circuitBreaker: {
            tradingView: { failures: 0, lastFailure: null, isOpen: false },
            symbols: { failures: 0, lastFailure: null, isOpen: false },
            webSocket: { failures: 0, lastFailure: null, isOpen: false }
        },
        retryScheduler: {},
        healthCheck: {
            lastCheck: null,
            status: 'unknown' // 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
        }
    }
}

// Action types
const ActionTypes = {
    // UI actions
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    INCREMENT_RETRY: 'INCREMENT_RETRY',
    RESET_RETRY: 'RESET_RETRY',
    
    // Feature status actions
    SET_FEATURE_STATUS: 'SET_FEATURE_STATUS',
    ENABLE_FEATURE: 'ENABLE_FEATURE',
    DISABLE_FEATURE: 'DISABLE_FEATURE',
    
    // Fallback data actions
    SET_FALLBACK_DATA: 'SET_FALLBACK_DATA',
    CLEAR_FALLBACK_DATA: 'CLEAR_FALLBACK_DATA',
    
    // Circuit breaker actions
    RECORD_FAILURE: 'RECORD_FAILURE',
    RECORD_SUCCESS: 'RECORD_SUCCESS',
    OPEN_CIRCUIT: 'OPEN_CIRCUIT',
    CLOSE_CIRCUIT: 'CLOSE_CIRCUIT',
    
    // Health check actions
    UPDATE_HEALTH_STATUS: 'UPDATE_HEALTH_STATUS',
    
    // Batch actions
    BATCH_UPDATE: 'BATCH_UPDATE',
    RESET_STATE: 'RESET_STATE'
}

// Reducer function
function componentStateReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_LOADING:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    loading: action.payload,
                    lastUpdate: Date.now()
                }
            }
            
        case ActionTypes.SET_ERROR:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    error: action.payload,
                    lastUpdate: Date.now()
                }
            }
            
        case ActionTypes.CLEAR_ERROR:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    error: null,
                    lastUpdate: Date.now()
                }
            }
            
        case ActionTypes.INCREMENT_RETRY:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    retryCount: state.ui.retryCount + 1,
                    lastUpdate: Date.now()
                }
            }
            
        case ActionTypes.RESET_RETRY:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    retryCount: 0,
                    lastUpdate: Date.now()
                }
            }
            
        case ActionTypes.SET_FEATURE_STATUS:
            return {
                ...state,
                features: {
                    ...state.features,
                    [action.payload.feature]: action.payload.status
                }
            }
            
        case ActionTypes.ENABLE_FEATURE:
            return {
                ...state,
                features: {
                    ...state.features,
                    [action.payload]: 'ready'
                }
            }
            
        case ActionTypes.DISABLE_FEATURE:
            return {
                ...state,
                features: {
                    ...state.features,
                    [action.payload]: 'disabled'
                }
            }
            
        case ActionTypes.SET_FALLBACK_DATA:
            return {
                ...state,
                fallbacks: {
                    ...state.fallbacks,
                    [action.payload.key]: action.payload.data
                }
            }
            
        case ActionTypes.CLEAR_FALLBACK_DATA:
            return {
                ...state,
                fallbacks: {
                    ...state.fallbacks,
                    [action.payload]: null
                }
            }
            
        case ActionTypes.RECORD_FAILURE:
            const service = action.payload
            const currentFailures = state.recovery.circuitBreaker[service]?.failures || 0
            return {
                ...state,
                recovery: {
                    ...state.recovery,
                    circuitBreaker: {
                        ...state.recovery.circuitBreaker,
                        [service]: {
                            failures: currentFailures + 1,
                            lastFailure: Date.now(),
                            isOpen: currentFailures + 1 >= 3 // Open circuit after 3 failures
                        }
                    }
                }
            }
            
        case ActionTypes.RECORD_SUCCESS:
            return {
                ...state,
                recovery: {
                    ...state.recovery,
                    circuitBreaker: {
                        ...state.recovery.circuitBreaker,
                        [action.payload]: {
                            failures: 0,
                            lastFailure: null,
                            isOpen: false
                        }
                    }
                }
            }
            
        case ActionTypes.OPEN_CIRCUIT:
            return {
                ...state,
                recovery: {
                    ...state.recovery,
                    circuitBreaker: {
                        ...state.recovery.circuitBreaker,
                        [action.payload]: {
                            ...state.recovery.circuitBreaker[action.payload],
                            isOpen: true
                        }
                    }
                }
            }
            
        case ActionTypes.CLOSE_CIRCUIT:
            return {
                ...state,
                recovery: {
                    ...state.recovery,
                    circuitBreaker: {
                        ...state.recovery.circuitBreaker,
                        [action.payload]: {
                            ...state.recovery.circuitBreaker[action.payload],
                            isOpen: false,
                            failures: 0
                        }
                    }
                }
            }
            
        case ActionTypes.UPDATE_HEALTH_STATUS:
            return {
                ...state,
                recovery: {
                    ...state.recovery,
                    healthCheck: {
                        lastCheck: Date.now(),
                        status: action.payload
                    }
                }
            }
            
        case ActionTypes.BATCH_UPDATE:
            return {
                ...state,
                ...action.payload
            }
            
        case ActionTypes.RESET_STATE:
            return {
                ...initialState,
                ui: {
                    ...initialState.ui,
                    lastUpdate: Date.now()
                }
            }
            
        default:
            return state
    }
}

// Context
const ComponentStateContext = createContext()

// Provider component
export function ComponentStateProvider({ children, initialData = {} }) {
    const [state, dispatch] = useReducer(componentStateReducer, {
        ...initialState,
        ...initialData
    })
    
    // Action creators
    const actions = {
        // UI actions
        setLoading: useCallback((loading) => {
            dispatch({ type: ActionTypes.SET_LOADING, payload: loading })
        }, []),
        
        setError: useCallback((error) => {
            dispatch({ type: ActionTypes.SET_ERROR, payload: error })
        }, []),
        
        clearError: useCallback(() => {
            dispatch({ type: ActionTypes.CLEAR_ERROR })
        }, []),
        
        incrementRetry: useCallback(() => {
            dispatch({ type: ActionTypes.INCREMENT_RETRY })
        }, []),
        
        resetRetry: useCallback(() => {
            dispatch({ type: ActionTypes.RESET_RETRY })
        }, []),
        
        // Feature actions
        setFeatureStatus: useCallback((feature, status) => {
            dispatch({ 
                type: ActionTypes.SET_FEATURE_STATUS, 
                payload: { feature, status } 
            })
        }, []),
        
        enableFeature: useCallback((feature) => {
            dispatch({ type: ActionTypes.ENABLE_FEATURE, payload: feature })
        }, []),
        
        disableFeature: useCallback((feature) => {
            dispatch({ type: ActionTypes.DISABLE_FEATURE, payload: feature })
        }, []),
        
        // Fallback data actions
        setFallbackData: useCallback((key, data) => {
            dispatch({ 
                type: ActionTypes.SET_FALLBACK_DATA, 
                payload: { key, data } 
            })
        }, []),
        
        clearFallbackData: useCallback((key) => {
            dispatch({ type: ActionTypes.CLEAR_FALLBACK_DATA, payload: key })
        }, []),
        
        // Circuit breaker actions
        recordFailure: useCallback((service) => {
            dispatch({ type: ActionTypes.RECORD_FAILURE, payload: service })
        }, []),
        
        recordSuccess: useCallback((service) => {
            dispatch({ type: ActionTypes.RECORD_SUCCESS, payload: service })
        }, []),
        
        openCircuit: useCallback((service) => {
            dispatch({ type: ActionTypes.OPEN_CIRCUIT, payload: service })
        }, []),
        
        closeCircuit: useCallback((service) => {
            dispatch({ type: ActionTypes.CLOSE_CIRCUIT, payload: service })
        }, []),
        
        // Health check actions
        updateHealthStatus: useCallback((status) => {
            dispatch({ type: ActionTypes.UPDATE_HEALTH_STATUS, payload: status })
        }, []),
        
        // Batch actions
        batchUpdate: useCallback((updates) => {
            dispatch({ type: ActionTypes.BATCH_UPDATE, payload: updates })
        }, []),
        
        resetState: useCallback(() => {
            dispatch({ type: ActionTypes.RESET_STATE })
        }, [])
    }
    
    // Computed properties
    const computed = {
        isHealthy: () => {
            const { features, recovery } = state
            const featureHealth = Object.values(features).filter(
                status => status === 'ready' || status === 'loaded' || status === 'connected'
            ).length
            
            const totalFeatures = Object.keys(features).length
            const healthRatio = featureHealth / totalFeatures
            
            if (healthRatio >= 0.8) return 'healthy'
            if (healthRatio >= 0.5) return 'degraded'
            return 'unhealthy'
        },
        
        getOverallStatus: () => {
            const { ui, features } = state
            
            if (ui.loading) return 'loading'
            if (ui.error) return 'error'
            
            const readyFeatures = Object.values(features).filter(
                status => status === 'ready' || status === 'loaded' || status === 'connected'
            ).length
            
            if (readyFeatures === 0) return 'failed'
            if (readyFeatures === Object.keys(features).length) return 'ready'
            return 'partial'
        },
        
        canRetry: (service) => {
            const circuit = state.recovery.circuitBreaker[service]
            if (!circuit) return true
            
            if (!circuit.isOpen) return true
            
            // Allow retry after 30 seconds if circuit is open
            const timeSinceLastFailure = Date.now() - (circuit.lastFailure || 0)
            return timeSinceLastFailure > 30000
        },
        
        getRetryDelay: (service, attempt = 0) => {
            const circuit = state.recovery.circuitBreaker[service]
            if (circuit?.isOpen) return 30000 // 30 seconds for open circuit
            
            // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
            return Math.min(15000, 1000 * Math.pow(2, attempt))
        }
    }
    
    const value = {
        state,
        actions,
        computed,
        dispatch
    }
    
    return (
        <ComponentStateContext.Provider value={value}>
            {children}
        </ComponentStateContext.Provider>
    )
}

// Hook to use the context
export function useComponentState() {
    const context = useContext(ComponentStateContext)
    
    if (!context) {
        throw new Error('useComponentState must be used within a ComponentStateProvider')
    }
    
    return context
}

// Selectors for efficient component re-renders
export const selectors = {
    // UI selectors
    selectLoading: (state) => state.ui.loading,
    selectError: (state) => state.ui.error,
    selectRetryCount: (state) => state.ui.retryCount,
    
    // Feature selectors
    selectFeatureStatus: (feature) => (state) => state.features[feature],
    selectAllFeatures: (state) => state.features,
    selectReadyFeatures: (state) => Object.entries(state.features)
        .filter(([, status]) => status === 'ready' || status === 'loaded' || status === 'connected')
        .map(([feature]) => feature),
    
    // Fallback selectors
    selectFallbackData: (key) => (state) => state.fallbacks[key],
    selectAllFallbacks: (state) => state.fallbacks,
    
    // Recovery selectors
    selectCircuitStatus: (service) => (state) => state.recovery.circuitBreaker[service],
    selectHealthStatus: (state) => state.recovery.healthCheck.status
}

// Higher-order component for automatic state management
export function withComponentState(WrappedComponent, options = {}) {
    const ComponentWithState = (props) => {
        return (
            <ComponentStateProvider initialData={options.initialState}>
                <WrappedComponent {...props} />
            </ComponentStateProvider>
        )
    }
    
    ComponentWithState.displayName = `withComponentState(${WrappedComponent.displayName || WrappedComponent.name})`
    
    return ComponentWithState
}

export default ComponentStateProvider