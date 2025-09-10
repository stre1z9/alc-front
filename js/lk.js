import { addToCart, updateCounter, uid } from "./cart-utils.js";
import { sha256WithSaltBase64 } from "./utils/hash.js";

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormSwitcher();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Кнопка регистрации/входа
        const submitBtn = document.querySelector(".submit-btn");
        if (submitBtn) {
            submitBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Кнопка выхода
        const logoutBtn = document.getElementById("logout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                this.logout();
            });
        }
    }

    setupFormSwitcher() {
        const switchBlock = document.querySelector(".butns");
        const buttons = switchBlock?.querySelectorAll(".tab-btn");
        const inputsWrap = document.querySelector(".inputs");
        const extraInput = inputsWrap?.querySelector(".extra-input");
        const knowPass = document.querySelector(".know-pass");
        const submitBtn = document.querySelector(".submit-btn");

        if (buttons) {
            buttons.forEach(btn => {
                btn.addEventListener("click", () => {
                    buttons.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");

                    if (btn.dataset.tab === "register") {
                        switchBlock.classList.add("register-active");
                        extraInput?.classList.add("show");
                        knowPass?.classList.add("hide");
                        if (submitBtn) submitBtn.textContent = "Зарегистрироваться";
                    } else {
                        switchBlock.classList.remove("register-active");
                        extraInput?.classList.remove("show");
                        knowPass?.classList.remove("hide");
                        if (submitBtn) submitBtn.textContent = "Войти";
                    }
                });
            });
        }
    }

    async checkAuthStatus() {
        const userId = localStorage.getItem('userId');
        console.log('Checking auth status, userId:', userId);
        
        if (userId && userId !== 'undefined' && userId !== 'null') {
            try {
                const user = await this.fetchUserData(userId);
                console.log('User data fetched:', user);
                this.currentUser = user;
                this.showCabinet();
                this.displayUserData(user);
            } catch (error) {
                console.error('Ошибка загрузки пользователя:', error);
                this.logout();
            }
        } else {
            this.showAuth();
        }
    }

    async handleSubmit() {
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        
        if (activeTab === 'register') {
            await this.register();
        } else {
            await this.login();
        }
    }

    getFormData() {
        return {
            email: document.getElementById('reg-email')?.value.trim() || '',
            password: document.getElementById('password')?.value.trim() || '',
            repeat: document.getElementById('repeat-password')?.value.trim() || ''
        };
    }

    async register() {
        const { email, password, repeat } = this.getFormData();
        
        if (!email || !password || !repeat) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        if (!this.validateInput(email, password, repeat)) {
            return;
        }

        try {
            const salt = email.toLowerCase();
            const clientHash = await sha256WithSaltBase64(password, salt);

            const result = await this.registerUser(email, clientHash);
            console.log('Registration result:', result);
            
            const user = result.data;
            this.currentUser = user;

            console.log('User ID to save:', user.userId);
            
            localStorage.setItem('userId', user.userId);
            localStorage.setItem('userEmail', user.email);

            console.log('Saved userId:', localStorage.getItem('userId'));

            this.showCabinet();
            this.displayUserData(user);
            this.showNotification('Регистрация успешна!', 'success');
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showNotification('Ошибка регистрации: ' + error.message, 'error');
        }
    }

    async login() {
        this.showNotification('Функция входа в разработке', 'info');
    }

    validateInput(email, password, repeat) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?\d{10,15}$/;

        if (!emailRegex.test(email) && !phoneRegex.test(email)) {
            this.showNotification('Введите корректный email или телефон!', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showNotification('Пароль должен быть не менее 6 символов!', 'error');
            return false;
        }

        if (password !== repeat) {
            this.showNotification('Пароли не совпадают!', 'error');
            return false;
        }

        return true;
    }

    async registerUser(email, clientHash) {
        const res = await fetch('http://localhost:3000/users/create', {
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

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка сервера: ${res.status}`);
        }

        const response = await res.json();
        console.log('✅ Register response structure:', response);
        console.log('✅ User ID in response:', response.data?.userId);
        
        return response;
    }

    async fetchUserData(userId) {
        if (!userId || userId === 'undefined' || userId === 'null') {
            throw new Error('Invalid user ID');
        }
        
        try {
            console.log('Fetching user data for ID:', userId);
            const res = await fetch(`http://localhost:3000/users/get/${userId}`);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка сервера: ${res.status}`);
            }         
            
            const response = await res.json();
            console.log('Server response:', response);
            
            if (response && response.data) {
                return response.data;
            } else {
                throw new Error('Неверный формат ответа сервера');
            }
            
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            throw new Error(error.message || 'Ошибка получения данных');
        }
    }

    showCabinet() {
        console.log('Showing cabinet');
        const authBlock = document.getElementById('auth-block');
        const cabinetBlock = document.getElementById('cabinet-block');

        if (authBlock) {
            authBlock.style.display = 'none';
            console.log('Auth block hidden');
        }
        if (cabinetBlock) {
            cabinetBlock.style.display = 'flex';
            console.log('Cabinet block shown');
        }
    }

    showAuth() {
        console.log('Showing auth form');
        const authBlock = document.getElementById('auth-block');
        const cabinetBlock = document.getElementById('cabinet-block');

        if (authBlock) {
            authBlock.style.display = 'block';
            console.log('Auth block shown');
        }
        if (cabinetBlock) {
            cabinetBlock.style.display = 'none';
            console.log('Cabinet block hidden');
        }
    }

    displayUserData(user) {
        console.log('Displaying user data:', user);
        
        if (!user) {
            console.error('User is null or undefined!');
            return;
        }

        const nameSurname = document.querySelector('.name-surname');
        console.log('Name surname element:', nameSurname);
        if (nameSurname) {
            const fullName = `${user.surname || ''} ${user.name || ''}`.trim();
            nameSurname.textContent = fullName || '—';
            console.log('Set name surname to:', fullName);
        }

        const phoneEl = document.getElementById('phone');
        console.log('Phone element:', phoneEl);
        if (phoneEl) {
            phoneEl.textContent = user.phone || '—';
            console.log('Set phone to:', user.phone);
        }

        const fields = [
            { span: "surname-text", input: "surname-input", key: "surname" },
            { span: "name-text", input: "name-input", key: "name" },
            { span: "patronymic-text", input: "patronymic-input", key: "patronymic" },
            { span: "email", input: "email-input", key: "email" },
            { span: "phone-text", input: "phone-input", key: "phone" },
            { span: "date-text", input: "date-input", key: "date" }
        ];

        fields.forEach(f => {
            const span = document.getElementById(f.span);
            const input = document.getElementById(f.input);
            
            console.log(`Processing field ${f.key}:`, { span, input });

            if (span && input) {
                const value = user[f.key] || '';
                console.log(`Setting ${f.key} to:`, value);
                
                span.textContent = value || '—';
                input.value = value;
                
                span.classList.remove("hidden");
                input.classList.add("hidden");
                input.disabled = true;
            }
        });

        // 4. Сбрасываем кнопки редактирования
        const editBtn = document.getElementById("edit");
        const saveBtn = document.getElementById("saveBtn");
        
        console.log('Edit/Save buttons:', { editBtn, saveBtn });
        
        if (editBtn && saveBtn) {
            editBtn.classList.remove("hidden");
            saveBtn.classList.add("hidden");
        }
    }

    logout() {
        console.log('Logging out');
        this.currentUser = null;
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        this.showAuth();
        this.showNotification('Вы вышли из системы', 'info');
    }

    showNotification(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

function setupUserDataHandlers() {
    const editBtn = document.getElementById("edit");
    const saveBtn = document.getElementById("saveBtn");

    const fields = [
        { span: "surname-text", input: "surname-input", key: "surname" },
        { span: "name-text", input: "name-input", key: "name" },
        { span: "patronymic-text", input: "patronymic-input", key: "patronymic" },
        { span: "email", input: "email-input", key: "email" },
        { span: "phone-text", input: "phone-input", key: "phone" },
        { span: "date-text", input: "date-input", key: "date" }
    ];

    function editData() {
        fields.forEach(f => {
            const span = document.getElementById(f.span);
            const input = document.getElementById(f.input);

            if (input && span) {
                span.classList.add("hidden");
                input.classList.remove("hidden");
                input.disabled = false;
            }
        });

        if (editBtn && saveBtn) {
            editBtn.classList.add("hidden");
            saveBtn.classList.remove("hidden");
        }
    }

    async function saveData() {
        const userData = {};
        let isValid = true;

        fields.forEach(f => {
            const input = document.getElementById(f.input);
            if (input) {
                userData[f.key] = input.value;

                if (f.key === 'email' && input.value && !input.value.includes('@')) {
                    isValid = false;
                    alert('Введите корректный email');
                }
            }
        });

        if (!isValid) return;

        try {
            const userId = localStorage.getItem('userId');
            const response = await fetch(`http://localhost:3000/users/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Ошибка сохранения данных');
            }

            fields.forEach(f => {
                const span = document.getElementById(f.span);
                const input = document.getElementById(f.input);

                if (span && input) {
                    span.textContent = input.value || '—';
                    span.classList.remove("hidden");
                    input.classList.add("hidden");
                    input.disabled = true;
                }
            });

            if (editBtn && saveBtn) {
                editBtn.classList.remove("hidden");
                saveBtn.classList.add("hidden");
            }

            this.showNotification('Данные сохранены успешно!', 'success');

        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showNotification('Ошибка сохранения данных', 'error');
        }
    }

    if (editBtn && saveBtn) {
        editBtn.addEventListener("click", editData);
        saveBtn.addEventListener("click", saveData.bind(this));
    }
}

// Инициализация при загрузке DOM
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded, initializing AuthManager...');
    const authManager = new AuthManager();
    setupUserDataHandlers.call(authManager);
    updateCounter();
});

// Экспорт для использования в других файлах
export default AuthManager;