// Markets Page Error Testing
const MarketPageTester = {
    testTradingViewFailure() {
        console.log('Testing TradingView failure...')
        const orig = document.createElement
        document.createElement = function(tag) {
            const el = orig.call(this, tag)
            if (tag === 'script' && el.src?.includes('tradingview')) {
                el.onerror(new Error('Test failure'))
            }
            return el
        }
        setTimeout(() => { document.createElement = orig }, 5000)
    },
    
    testAPIFailure() {
        console.log('Testing API failure...')
        const origFetch = window.fetch
        window.fetch = function(url) {
            if (url.includes('symbols')) {
                return Promise.reject(new Error('API test failure'))
            }
            return origFetch.call(this, url)
        }
        setTimeout(() => { window.fetch = origFetch }, 10000)
    },
    
    runAllTests() {
        console.log('Running all tests...')
        setTimeout(() => this.testTradingViewFailure(), 1000)
        setTimeout(() => this.testAPIFailure(), 3000)
    }
}

window.MarketPageTester = MarketPageTester