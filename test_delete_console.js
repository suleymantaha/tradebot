// Tarayıcı konsolunda çalıştırılabilir DELETE test scripti
// Bu scripti frontend'te (localhost:3000) çalışırken geliştirici konsoluna yapıştırın

console.log('🔧 API Key Delete Test Scripti');

// API base URL
const API_BASE_URL = 'http://localhost:8000';

// Auth token'ı localStorage'dan al (Zustand persist storage)
let token = null;
try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
        const parsedAuth = JSON.parse(authStorage);
        token = parsedAuth.state?.token || parsedAuth.token;
    }
} catch (e) {
    console.log('⚠️ Auth storage parse hatası:', e.message);
}

console.log('📋 Token bulundu:', token ? 'Evet' : 'Hayır');
console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'Yok');

if (!token) {
    console.error('❌ Token bulunamadı! Önce giriş yapmalısınız.');
    console.log('💡 localStorage içeriği kontrol ediliyor...');
    console.log('🗄️ auth-storage:', localStorage.getItem('auth-storage'));
} else {
    console.log('🚀 DELETE isteği gönderiliyor...');

    // DELETE isteği gönder
    fetch(`${API_BASE_URL}/api/v1/api-keys/me`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('📡 Response Status:', response.status);
            console.log('📡 Response OK:', response.ok);
            console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                console.log('✅ DELETE isteği başarılı!');
                return response.json().catch(() => 'No JSON response');
            } else {
                console.log('❌ DELETE isteği başarısız!');
                return response.text();
            }
        })
        .then(data => {
            console.log('📦 Response Data:', data);
        })
        .catch(error => {
            console.error('🚨 Fetch Hatası:', error);
            console.error('🚨 Error Stack:', error.stack);
        });
}

console.log('📝 Test tamamlandı. Backend loglarını kontrol edin.');

// Alternatif olarak axios kullanarak test
console.log('🔄 Axios ile test ediliyor...');
if (window.axios) {
    const axiosInstance = window.axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    axiosInstance.delete('/api/v1/api-keys/me')
        .then(response => {
            console.log('✅ Axios DELETE başarılı:', response.data);
        })
        .catch(error => {
            console.error('❌ Axios DELETE hatası:', error.response?.data || error.message);
        });
} else {
    console.log('⚠️ Axios mevcut değil, sadece fetch ile test edildi.');
}
