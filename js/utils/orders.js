// order.js
import { showToasts } from '../modules/common/helpers/toast.helpers.js';
import { getCart, updateCounter } from '../modules/cart/cart-utils.js';

export async function createOrder() {
    const button = document.getElementById('sub-order');
    if (!button) return;

    button.addEventListener('click', async (e) => {
        e.preventDefault();
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

        const orderData = {
            userId: userId,
            totalCount: totalCount,
            totalAmount: totalAmount,
            address: address
        };

        try {
            button.disabled = true;
            button.textContent = 'Обработка заказа...';

            const response = await fetch('https://backendalcraft-production.up.railway.app/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            await clearCartAfterOrder();
            showToasts('Заказ успешно создан!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Ошибка создания заказа:', error);
            showToasts('Ошибка создания заказа', 'error' + error.message);
        } finally {

            button.disabled = false;
            button.textContent = 'Оформить заказ';
        }
    });
}

async function clearCartAfterOrder() {
    const userId = localStorage.getItem('userId');
    
    if (!userId) return;

    try {
        localStorage.setItem(`cart_${userId}`, JSON.stringify([]));

        updateCounter();

        const token = localStorage.getItem('access_token');
        if (token) {
            await fetch('https://backendalcraft-production.up.railway.app/cart/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(err => console.warn('Не удалось очистить корзину на сервере:', err));
        }
        
    } catch (error) {
    }
}

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