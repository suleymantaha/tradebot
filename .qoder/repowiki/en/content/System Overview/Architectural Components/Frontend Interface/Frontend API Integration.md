# Frontend API Integration

<cite>
**Referenced Files in This Document**   
- [api.js](file://frontend/src/services/api.js)
- [authStore.js](file://frontend/src/store/authStore.js)
- [vite.config.js](file://frontend/vite.config.js)
- [package.json](file://frontend/package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Configuration and Base URL](#api-configuration-and-base-url)
3. [ApiService Class and Request Lifecycle](#apiservice-class-and-request-lifecycle)
4. [Authentication Flow and JWT Token Management](#authentication-flow-and-jwt-token-management)
5. [Error Handling and Unauthorized Response Management](#error-handling-and-unauthorized-response-management)
6. [File Download Implementation with downloadCSV](#file-download-implementation-with-downloadcsv)
7. [Convenience Methods for HTTP Operations](#convenience-methods-for-http-operations)
8. [Legacy Axios Instance and Interceptors](#legacy-axios-instance-and-interceptors)
9. [Domain-Specific API Clients](#domain-specific-api-clients)
10. [Debugging and Development Features](#debugging-and-development-features)

## Introduction
This document provides comprehensive documentation for the frontend API integration in the TradeBot application, focusing on the ApiService class and related API clients. The documentation covers the complete API integration architecture, including configuration, authentication, error handling, and utility functions that enable seamless communication between the frontend and backend services. The implementation follows modern JavaScript practices with a focus on maintainability, security, and developer experience.

## API Configuration and Base URL
The API integration is configured through environment variables, allowing for flexible deployment across different environments. The base API URL is defined using Vite's environment variable system, with a fallback to a default localhost address for development purposes.

```mermaid
flowchart TD
A["Environment Variable VITE_API_URL"] --> B{Exists?}
B --> |Yes| C[Use VITE_API_URL value]
B --> |No| D[Use fallback: http://localhost:8000]
C --> E[Set API_BASE_URL constant]
D --> E
E --> F[ApiService uses baseURL for all requests]
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L5)
- [vite.config.js](file://frontend/vite.config.js#L10-L12)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L1-L6)
- [vite.config.js](file://frontend/vite.config.js#L7-L15)

## ApiService Class and Request Lifecycle
The ApiService class serves as the primary interface for API communication, implementing a robust request lifecycle that handles configuration, authentication, and response processing. The class encapsulates the fetch API with enhanced error handling and logging capabilities.

```mermaid
sequenceDiagram
participant Client as "Component"
participant ApiService as "ApiService"
participant Fetch as "fetch()"
participant Server as "Backend API"
Client->>ApiService : request(endpoint, options)
ApiService->>ApiService : getToken()
ApiService->>ApiService : Build request config
ApiService->>ApiService : Add Authorization header if token exists
ApiService->>ApiService : Log request details (dev mode)
ApiService->>Fetch : fetch(url, config)
Fetch->>Server : HTTP Request
Server-->>Fetch : HTTP Response
Fetch-->>ApiService : Response object
ApiService->>ApiService : Check response.ok
alt Response successful
ApiService->>ApiService : Parse JSON response
ApiService-->>Client : Return data
else Response failed
ApiService->>ApiService : Handle error (401, etc.)
ApiService-->>Client : Throw error
end
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L7-L97)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L7-L97)

## Authentication Flow and JWT Token Management
The authentication system implements a dual-storage approach for JWT tokens, checking both the application state and localStorage to ensure session persistence across page reloads. This approach provides a seamless user experience while maintaining security best practices.

```mermaid
flowchart TD
A[ApiService.getToken()] --> B{Check Zustand Store}
B --> |Token exists| C[Return store token]
B --> |No token| D{Check localStorage}
D --> |Token exists| E[Return localStorage token]
D --> |No token| F[Return null]
C --> G[Use token in Authorization header]
E --> G
F --> H[Proceed without Authorization header]
G --> I[Make API request]
H --> I
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L12-L17)
- [authStore.js](file://frontend/src/store/authStore.js#L8)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L12-L17)
- [authStore.js](file://frontend/src/store/authStore.js#L1-L68)

## Error Handling and Unauthorized Response Management
The API integration includes comprehensive error handling strategies, with special attention to unauthorized (401) responses. When a 401 error is detected, the system automatically logs the user out and redirects to the login page, ensuring that expired or invalid sessions are handled gracefully.

```mermaid
flowchart TD
A[API Response received] --> B{response.ok?}
B --> |Yes| C[Parse and return JSON]
B --> |No| D[Read error text]
D --> E{Status = 401?}
E --> |Yes| F[Call logout() on authStore]
E --> |No| G[Log error details]
F --> H[Redirect to /login]
G --> I[Throw formatted error]
H --> J[User redirected to login]
I --> K[Component handles error]
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L73-L87)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L73-L87)
- [authStore.js](file://frontend/src/store/authStore.js#L21-L28)

## File Download Implementation with downloadCSV
The downloadCSV utility method provides specialized handling for file downloads, particularly CSV files from the backend. It properly handles binary data through blob objects and extracts filenames from Content-Disposition headers, ensuring that downloaded files retain their intended names.

```mermaid
sequenceDiagram
participant Component as "Component"
participant ApiService as "ApiService"
participant Fetch as "fetch()"
participant Browser as "Browser"
Component->>ApiService : downloadCSV(endpoint, fallback)
ApiService->>Fetch : fetch(url, {headers})
Fetch-->>ApiService : Response with blob
ApiService->>ApiService : Get Content-Disposition header
ApiService->>ApiService : Extract filename with regex
ApiService->>ApiService : Use fallback if no filename
ApiService->>Browser : Create blob URL
ApiService->>Browser : Create anchor element
ApiService->>Browser : Set href and download attributes
ApiService->>Browser : Programmatically click anchor
ApiService->>Browser : Clean up DOM and revoke URL
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L100-L132)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L100-L132)

## Convenience Methods for HTTP Operations
The ApiService class provides convenience methods (get, post, put, delete) that simplify common HTTP operations. These methods wrap the core request method with appropriate HTTP verbs and parameter handling, reducing boilerplate code in components that consume the API.

```mermaid
classDiagram
class ApiService {
+get(endpoint, options)
+post(endpoint, data, options)
+put(endpoint, data, options)
+delete(endpoint, options)
-request(endpoint, options)
}
ApiService : get() calls request() with method='GET'
ApiService : post() calls request() with method='POST'
ApiService : put() calls request() with method='PUT'
ApiService : delete() calls request() with method='DELETE'
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L136-L157)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L136-L157)

## Legacy Axios Instance and Interceptors
For backward compatibility, the system maintains a legacy axios instance with request and response interceptors. This allows older code to continue using axios while new code can adopt the modern fetch-based ApiService. The interceptors handle token injection and unauthorized response handling consistently across both systems.

```mermaid
sequenceDiagram
participant Component as "Component"
participant Axios as "axios instance"
participant RequestInterceptor as "Request Interceptor"
participant ResponseInterceptor as "Response Interceptor"
participant Server as "Backend API"
Component->>Axios : api.get('/endpoint')
Axios->>RequestInterceptor : Intercept request
RequestInterceptor->>RequestInterceptor : Get token from authStore
RequestInterceptor->>RequestInterceptor : Add Authorization header
RequestInterceptor->>Axios : Continue request
Axios->>Server : HTTP Request
Server-->>Axios : HTTP Response
Axios->>ResponseInterceptor : Intercept response
ResponseInterceptor->>ResponseInterceptor : Check for 401
alt Status = 401
ResponseInterceptor->>authStore : Call logout()
ResponseInterceptor->>Browser : Redirect to /login
end
ResponseInterceptor-->>Component : Return response or error
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L214-L244)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L214-L244)
- [package.json](file://frontend/package.json#L13)

## Domain-Specific API Clients
The system exports modular, domain-specific API clients (authAPI, apiKeyAPI, botConfigAPI, etc.) that provide higher-level interfaces for specific application domains. These clients encapsulate endpoint URLs and parameter structures, making it easier for components to interact with the API without knowing implementation details.

```mermaid
graph TB
A[Domain-Specific API Clients] --> B[authAPI]
A --> C[apiKeyAPI]
A --> D[botConfigAPI]
A --> E[botStateAPI]
A --> F[botRunnerAPI]
A --> G[symbolsAPI]
B --> H[register, login, getMe]
C --> I[create, getMe, delete]
D --> J[create, getAll, getById, update, delete]
E --> K[getById, update]
F --> L[start, stop]
G --> M[getSpotSymbols, getFuturesSymbols]
subgraph "Implementation"
H -.->|Uses| Z[axios]
I -.->|Uses| Z
J -.->|Uses| Z
K -.->|Uses| Z
L -.->|Uses| Z
M -.->|Uses| fetch
end
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L247-L371)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L247-L371)

## Debugging and Development Features
The API integration includes comprehensive debugging features for non-production environments, including detailed request logging, authentication debugging, and hidden token display in logs. These features help developers troubleshoot issues during development without compromising security in production.

```mermaid
flowchart TD
A[Development Mode Check] --> B{import.meta.env.MODE !== 'production'?}
B --> |Yes| C[Enable Debug Logging]
B --> |No| D[Skip Debug Logging]
C --> E[Log request details]
C --> F[Log authentication debug info]
C --> G[Log request config with hidden token]
C --> H[Log error details]
E --> I[Console output with endpoint and options]
F --> J[Console output with token sources]
G --> K[Console output with [TOKEN_HIDDEN]]
H --> L[Console error with stack trace]
```

**Diagram sources**
- [api.js](file://frontend/src/services/api.js#L20-L44)

**Section sources**
- [api.js](file://frontend/src/services/api.js#L20-L44)
- [vite.config.js](file://frontend/vite.config.js#L5)