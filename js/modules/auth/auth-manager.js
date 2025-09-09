import { AuthService } from "./auth-service.js";
import { DomHelper } from "./dom-helpers.js";
import { syncCartOnAuthChange,  getCart, saveCartToServer } from "../cart/cart-utils.js";
import { showToasts } from "../common/helpers/toast.helpers.js";

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
        const token = localStorage.getItem('access_token');
        
        console.log('🔍 Check auth status called', { userId, hasToken: !!token });
        
        if (userId && userId !== 'undefined' && userId !== 'null') {
            try {
                console.log('🔄 Fetching user data...');
                const user = await this.authService.fetchUserData(userId);
                this.currentUser = user;
                this.showCabinet();
                this.displayUserData(user);
                
                if (token) {
                    console.log('⏰ Scheduling cart sync...');
                    setTimeout(() => {
                        syncCartOnAuthChange().catch(console.error);
                    }, 500);
                }
            } catch (error) {
                console.error('❌ Error loading user:', error);
                this.logout();
            }
        } else {
            console.log('👤 No user ID, showing auth form');
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

            const result = await this.authService.registerUser(formData.email, formData.password);
            console.log('Registration result:', result);

            const user = result.data;
            console.log('User object from registration:', user);
            
            if (!user.userId) {
                throw new Error('Сервер не вернул userId при регистрации');
            }

            this.currentUser = user;

            localStorage.setItem('userId', user.userId);
            localStorage.setItem('userEmail', user.email);

            console.log('Saved userId after registration:', localStorage.getItem('userId'));

            this.showCabinet();
            this.displayUserData(user);
            showToasts('Регистрация успешна!', 'success');
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            showToasts('Ошибка регистрации: ' + error.message, 'error');
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

            if (!result || typeof result !== 'object') {
                throw new Error('Неверный ответ сервера');
            }
            
            this.handleLoginSuccess(result);
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            showToasts('Ошибка входа: ' + error.message, 'error');
        } finally {
            this.domHelper.showLoading(false);
        }
    }


    validateInput(email, password, repeat) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?\d{10,15}$/;

        if (!emailRegex.test(email) && !phoneRegex.test(email)) {
            showToasts('Введите корректный email или телефон!', 'warning');
            return false;
        }

        if (password.length < 6) {
            showToasts('Пароль должен быть не менее 6 символов!', 'warning');
            return false;
        }

        if (password !== repeat) {
            showToasts('Пароли не совпадают!', 'error');
            return false;
        }

        return true;
    }

    validateLoginInput(email, password) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?\d{10,15}$/;

        if (!emailRegex.test(email) && !phoneRegex.test(email)) {
            showToasts('Введите корректный email или телефон!', 'warning');
            return false;
        }

        if (password.length < 6) {
            showToasts('Пароль должен быть не менее 6 символов!', 'warning');
            return false;
        }

        return true;
    }

    handleLoginSuccess(result) {
        console.log('✅ Login success result received');
        
        const accessToken = result.data.access_token;
        const refreshToken = result.data.refresh_token;
        const user = result.data.user;
        
        if (!accessToken || !refreshToken || !user) {
            throw new Error('Неверный формат ответа сервера при входе');
        }

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('userId', user.userId);
        localStorage.setItem('userEmail', user.email);

        this.currentUser = user;
        this.showCabinet();
        this.displayUserData(user);
        showToasts('Вход выполнен успешно!', 'success');

        setTimeout(() => {
            syncCartOnAuthChange().catch(console.error);
        }, 1000);
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
        console.log('Logging out');
        this.currentUser = null;

        const cart = getCart();
        if (cart.length > 0) {
            console.log('Сохраняем корзину перед выходом');
            saveCartToServer(cart).catch(console.error);
        }
        
        this.authService.clearStorage();
        this.showAuth();
        updateCounter();
    }

}