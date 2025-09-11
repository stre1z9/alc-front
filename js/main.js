import { AuthManager } from './modules/auth/auth-manager.js';
import { setupUserDataHandlers } from './modules/auth/user-data-handler.js';
import { updateCounter, fetchCartFromServer, setCart } from '../js/modules/cart/cart-utils.js';

document.addEventListener("DOMContentLoaded", async () => {
    console.log('DOM loaded, initializing AuthManager...');
    const authManager = new AuthManager();
    setupUserDataHandlers(authManager);
    
    // ✅ ЗАГРУЖАЕМ КОРЗИНУ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
    try {
        await fetchCartFromServer();
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
    updateCounter();
});