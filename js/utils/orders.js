// order.js
import { showToasts } from '../modules/common/helpers/toast.helpers.js';
import { getCart, updateCounter, saveCartToServer, getCurrentUser } from '../modules/cart/cart-utils.js';

export async function createOrder() {
    const button = document.getElementById('sub-order');
    if (!button) return;

    button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Сначала синхронизируем корзину с сервером
        try {
            await saveCartToServer();
            console.log('✅ Корзина синхронизирована перед созданием заказа');
        } catch (error) {
            console.error('❌ Ошибка синхронизации корзины:', error);
            showToasts('Ошибка синхронизации корзины. Попробуйте снова.', 'error');
            return;
        }

        const addressElement = document.getElementById('address');
        const totalCountElement = document.getElementById('quant');
        const totalAmountElement = document.getElementById('fp');
        
        if (!totalCountElement || !totalAmountElement) {
            alert('Ошибка: не найдены данные заказа');
            return;
        }
        
        const address = addressElement.textContent || "Адрес отсутствует";
        const totalCount = parseInt(totalCountElement.textContent) || 0;
        const totalAmount = parseFloat(totalAmountElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

        if (totalCount <= 0) {
            alert('Корзина пуста');
            return;
        }

        if (totalAmount <= 0) {
            toast.warning("Неверная сумма заказа!")
            return;
        }

        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('access_token');

        // Получаем актуальную корзину для отправки в заказ
        const cart = getCart();
        const items = cart.map(item => ({
            productId: item.productId || item._id,
            name: item.tShirtName || item.name || 'Неизвестный товар',
            price: item.price || 0,
            quantity: item.quantity || 1,
            size: item.size || '',
            color: item.color || '',
            discount: item.discount || 0,
            picturePath: Array.isArray(item.picturePath) ? item.picturePath[0] : item.picturePath || '',
            nameCollection: item.nameCollection || '',
            cut: item.cut || ''
        }));

        const orderData = {
            userId: userId,
            totalCount: totalCount,
            totalAmount: totalAmount,
            address: address,
            items: items, // Добавляем товары в заказ
            createdAt: new Date().toISOString()
        };

        try {
            button.disabled = true;
            button.textContent = 'Обработка заказа...';

            console.log('📦 Отправка заказа:', orderData);

            const response = await fetch('https://backendalcraft-production.up.railway.app/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Заказ создан:', result);

            // Очищаем корзину после успешного создания заказа
            await clearCartAfterOrder();
            
            // Синхронизируем пустую корзину с сервером
            await saveCartToServer([]);
            
            showToasts('Заказ успешно создан!', 'success');
            
            // Перенаправляем на страницу заказов или обновляем
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Ошибка создания заказа:', error);
            showToasts(`Ошибка создания заказа: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
            button.textContent = 'Оформить заказ';
        }
    });
}

// Функция для очистки корзины после заказа
async function clearCartAfterOrder() {
    try {
        const { userId } = getCurrentUser();
        if (userId) {
            // Очищаем локальную корзину
            localStorage.setItem(`cart_${userId}`, JSON.stringify([]));
            
            // Обновляем счетчики
            updateCounter();
            updateCartTotal();
            
            console.log('✅ Корзина очищена после заказа');
        }
    } catch (error) {
        console.error('❌ Ошибка очистки корзины:', error);
    }
}

// Дополнительная функция для принудительной синхронизации
export async function forceCartSync() {
    try {
        await saveCartToServer();
        console.log('✅ Принудительная синхронизация корзины выполнена');
        return true;
    } catch (error) {
        console.error('❌ Ошибка принудительной синхронизации:', error);
        return false;
    }
}

// Можно вызвать при загрузке страницы оформления заказа
document.addEventListener('DOMContentLoaded', function() {
    // Принудительно синхронизируем корзину при загрузке страницы оформления
    if (window.location.pathname.includes('checkout') || 
        window.location.pathname.includes('order')) {
        forceCartSync().catch(console.error);
    }
});

export function validateCartBeforeOrder() {
    const cart = getCart(); 
    const button = document.getElementById('sub-order');
    
    if (!button) return;
    
    if (cart.length === 0) {
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
        button.title = 'Добавьте товары в корзину';
    } else {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.title = 'Оформить заказ';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    validateCartBeforeOrder();
    createOrder();

    window.addEventListener('cart:updated', () => {
        validateCartBeforeOrder();
    });
});