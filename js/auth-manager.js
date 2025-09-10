import { sha256WithSaltBase64 } from "./utils/hash.js";
import { AuthService } from "./auth-service.js";
import { DomHelper } from "./dom-helpers.js";
import { setupUserDataHandlers } from "./user-data-handler.js";

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authService = new AuthService();
        this.domHelper = new DomHelper();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormSwitcher();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        const submitBtn = document.querySelector(".submit-btn");
        if (submitBtn) {
            submitBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

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
        const extraInput = document.querySelector(".extra-input");
        const knowPass = document.querySelector(".know-pass");
        const submitBtn = document.querySelector(".submit-btn");

        if (buttons) {
            buttons.forEach(btn => {
                btn.addEventListener("click", () => {
                    buttons.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");

                    const isRegister = btn.dataset.tab === "register";
                    switchBlock.classList.toggle("register-active", isRegister);
                    extraInput?.classList.toggle("show", isRegister);
                    knowPass?.classList.toggle("hide", isRegister);
                    
                    if (submitBtn) {
                        submitBtn.textContent = isRegister ? "Зарегистрироваться" : "Войти";
                    }
                });
            });
        }
    }

    async checkAuthStatus() {
        const userId = localStorage.getItem('userId');
        
        if (userId && userId !== 'undefined' && userId !== 'null') {
            try {
                const user = await this.authService.fetchUserData(userId);
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

    async register() {
        const formData = this.domHelper.getFormData();
        
        if (!this.validateInput(formData.email, formData.password, formData.repeat)) {
            return;
        }

        try {
            const salt = formData.email.toLowerCase();
            const clientHash = await sha256WithSaltBase64(formData.password, salt);

            const result = await this.authService.registerUser(formData.email, clientHash);
            console.log('Registration result:', result);
            
            // ✅ ОБНОВЛЕНО: данные в result.data
            const user = result.data;
            this.currentUser = user;

            console.log('User ID to save:', user.userId);
            
            localStorage.setItem('userId', user.userId);
            localStorage.setItem('userEmail', user.email);

            this.showCabinet();
            this.displayUserData(user);
            this.domHelper.showNotification('Регистрация успешна!', 'success');
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.domHelper.showNotification('Ошибка регистрации: ' + error.message, 'error');
        }
    }

    async login() {
        const formData = this.domHelper.getFormData();
        
        if (!this.validateLoginInput(formData.email, formData.password)) {
            return;
        }

        try {
            this.domHelper.showLoading(true);
            const result = await this.authService.loginUser(formData.email, formData.password);
            
            // ✅ ПРОВЕРКА ПЕРЕД ВЫЗОВОМ
            if (!result || typeof result !== 'object') {
                throw new Error('Неверный ответ сервера');
            }
            
            this.handleLoginSuccess(result);
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.domHelper.showNotification('Ошибка входа: ' + error.message, 'error');
        } finally {
            this.domHelper.showLoading(false);
        }
    }


    validateInput(email, password, repeat) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?\d{10,15}$/;

        if (!emailRegex.test(email) && !phoneRegex.test(email)) {
            this.domHelper.showNotification('Введите корректный email или телефон!', 'error');
            return false;
        }

        if (password.length < 6) {
            this.domHelper.showNotification('Пароль должен быть не менее 6 символов!', 'error');
            return false;
        }

        if (password !== repeat) {
            this.domHelper.showNotification('Пароли не совпадают!', 'error');
            return false;
        }

        return true;
    }

    validateLoginInput(email, password) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?\d{10,15}$/;

        if (!emailRegex.test(email) && !phoneRegex.test(email)) {
            this.domHelper.showNotification('Введите корректный email или телефон!', 'error');
            return false;
        }

        if (password.length < 6) {
            this.domHelper.showNotification('Пароль должен быть не менее 6 символов!', 'error');
            return false;
        }

        return true;
    }

    handleLoginSuccess(result) {
        console.log('Login success result:', result);
        
        try {
            // ✅ БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ ДАННЫХ
            const accessToken = result?.data?.access_token;
            const refreshToken = result?.data?.refresh_token;
            const user = result?.data?.user;
            
            if (!accessToken || !refreshToken || !user) {
                console.error('Invalid server response structure:', result);
                throw new Error('Неверный формат ответа сервера при входе');
            }

            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('userId', user.userId);
            localStorage.setItem('userEmail', user.email);

            this.currentUser = user;
            this.showCabinet();
            this.displayUserData(user);
            this.domHelper.showNotification('Вход выполнен успешно!', 'success');
            
        } catch (error) {
            console.error('Error processing login response:', error);
            throw new Error('Ошибка обработки ответа сервера: ' + error.message);
        }
    }

    showCabinet() {
        this.domHelper.toggleAuthVisibility(false);
    }

    showAuth() {
        this.domHelper.toggleAuthVisibility(true);
    }

    displayUserData(user) {
        if (!user) return;

        this.domHelper.updateUserProfile(user);
        this.domHelper.updateUserFormFields(user);
        this.domHelper.resetEditMode();
    }

    logout() {
        this.currentUser = null;
        this.authService.clearStorage();
        this.showAuth();
        this.domHelper.showNotification('Вы вышли из системы', 'info');
    }
}