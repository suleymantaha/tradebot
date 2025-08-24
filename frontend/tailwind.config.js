/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        // Text colors used dinamik olarak: success/warn/error/neutral
        'text-green-500',
        'text-red-500',
        'text-yellow-500',
        'text-gray-500',
        // Background badges/labels
        'bg-green-100',
        'bg-red-100',
        'bg-yellow-100',
        'bg-gray-100',
        // Dark mode variants might be composed at runtime
        'dark:bg-green-900',
        'dark:bg-red-900',
        'dark:bg-yellow-900',
        'dark:text-green-300',
        'dark:text-red-300',
        'dark:text-yellow-200',
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            animation: {
                'fadeIn': 'fadeIn 0.5s ease-in-out',
                'float': 'float 6s ease-in-out infinite',
                'pulse': 'pulse 2s infinite',
                'slideInBottom': 'slideInBottom 0.5s ease-out',
                'successBounce': 'successBounce 0.6s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                slideInBottom: {
                    '0%': { transform: 'translateY(100px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                successBounce: {
                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                    '40%': { transform: 'translateY(-10px)' },
                    '60%': { transform: 'translateY(-5px)' },
                },
            },
        },
    },
    plugins: [],
}
