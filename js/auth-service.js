export class AuthService {
    constructor() {
        this.baseUrl = 'backendalcraft-production.up.railway.app';
    }

    async registerUser(email, clientHash) {
        const response = await fetch(`${this.baseUrl}/users/create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                email: email,
                pass: clientHash,
                name: '',
                surname: '',
                phone: email.includes('@') ? '' : email
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        console.log('Register response:', result); // ← для отладки
        
        // ✅ ВОЗВРАЩАЕМ ВЕСЬ ОБЪЕКТ, А НЕ ТОЛЬКО DATA
        return result;
    }

    async loginUser(email, password) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                email: email,
                pass: password
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        console.log('Login response:', result); // ← ДОБАВЬТЕ ЭТО
        return result;
    }

    async fetchUserData(userId) {
        if (!userId || userId === 'undefined' || userId === 'null') {
            throw new Error('Invalid user ID');
        }

        const accessToken = localStorage.getItem('access_token');
        const headers = {
            'Accept': 'application/json'
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${this.baseUrl}/users/get/${userId}`, {
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        console.log('Fetch user response:', result); // ← для отладки
        
        // ✅ ОБНОВЛЕНО: данные также в result.data
        if (result && result.data) {
            return result.data;
        } else {
            throw new Error('Неверный формат ответа сервера');
        }
    }

    async refreshTokens(refreshToken) {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        return response.json();
    }

    clearStorage() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
    }

}
