
function getUserIdFromStorage() {
    try {
        // 1. Прямое значение userId
        const directUserId = localStorage.getItem('userId');
        if (directUserId) {
            return directUserId;
        }
        
        // 2. Из userData объекта
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            return userData.id || userData.userId || userData._id;
        }
        
        // 3. Из currentUser объекта
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            return currentUser.id || currentUser.userId;
        }
        
        // 4. Проверяем другие возможные ключи
        const otherKeys = ['user_id', 'auth_user_id', 'user'];
        for (const key of otherKeys) {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    const data = JSON.parse(value);
                    return data.id || data.userId || data;
                } catch {
                    return value; // Возможно это строка с ID
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Ошибка при чтении localStorage:', error);
        return null;
    }
}
async function loadUserOrders() {
    const activeOrdersContainer = document.getElementById('active-orders');
    
    try {
        showLoader(activeOrdersContainer);
        
        // Получаем userId из localStorage
        const userId = getUserIdFromStorage();
        
        if (!userId) {
            throw new Error('Не удалось найти ID пользователя. Пожалуйста, войдите в систему.');
        }
        
        console.log('Используем userId:', userId);
        
        // Получаем заказы с сервера
        const response = await fetchUserOrders(userId);
        
        activeOrdersContainer.innerHTML = '';
        displayOrders(response.data, activeOrdersContainer);
        
    } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        showError(activeOrdersContainer, error.message);
    }
}

async function fetchUserOrders(userId) {
    if (!userId) {
        throw new Error('UserId не указан');
    }
    
    try {
        const response = await fetch(`https://backendalcraft-production.up.railway.app/orders/get/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 404) {
            return { success: true, data: [] };
        }

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        
        if (result && typeof result === 'object' && Array.isArray(result.data)) {
            return result;
        } else {
            console.warn('Неверная структура ответа сервера:', result);
            return { success: false, data: [] };
        }

    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        throw error;
    }
}

function displayOrders(orders, container) {
    console.log('Заказы для отображения:', orders);
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="no-orders-message">
                <img src="../assets/icons/no-orders.svg" alt="Нет заказов">
                <h3>Заказов пока нет</h3>
                <p>Самое время сделать первый заказ!</p>
                <button onclick="window.location.href='/catalog'" class="primary-btn">
                    Перейти в каталог
                </button>
            </div>
        `;
        return;
    }
    
    // Сортируем заказы по дате (новые сначала)
    const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
    });
    
    // Создаем карточки заказов
    sortedOrders.forEach(order => {
        try {
            const orderCard = createOrderCard(order);
            container.appendChild(orderCard);
        } catch (error) {
            console.error('Ошибка создания карточки заказа:', error, order);
        }
    });
    
    setupOrderCardsInteractions();
}

function createOrderCard(orderData) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order';
    orderCard.dataset.orderId = orderData.id || '';
    
    const orderId = orderData.id || 'N/A';
    const orderDate = orderData.createdAt || orderData.orderDate;
    const totalPrice = orderData.totalPrice || orderData.totalAmount || 0;
    const status = orderData.status || 'pending';
    const deliveryType = orderData.deliveryType || 'курьером';
    const deliveryAddress = orderData.deliveryAddress || '';

    orderCard.innerHTML = `
        <div class="order-header">
            <p class="order-stage ${getStatusClass(status)}">${getStatusText(status)}</p>
            <div class="order-info">
                <div class="order-main-info">
                    <p>Заказ №<span class="order-id">${orderId}</span> от <span class="order-date">${new Date(orderData.created_at).toLocaleString('ru-RU')}</span></p>
                    <p class="dostavka">Доставим: <span class="delivery-method">${deliveryType}</span></p>
                    ${deliveryAddress ? `<p>Адрес: <span class="delivery-address">${deliveryAddress}</span></p>` : ''}
                </div>
                <p class="order-price">Итого ${formatPrice(totalPrice)} ₽</p>
            </div>
        </div>
        <div class="order-details-toggle">
            <p>Подробнее</p>
            <img src="../assets/icons/vniz.svg" alt="Развернуть" class="toggle-icon">
        </div>
        <div class="order-details-content">
            <div class="loading-details">Загрузка деталей заказа...</div>
        </div>
    `;
    
    orderCard.dataset.orderData = JSON.stringify(orderData);
    
    return orderCard;
}

// Функция загрузки деталей заказа
async function loadOrderDetails(orderId, container, orderCard) {
    try {
        // Пробуем получить данные из data-атрибута
        const orderDataStr = orderCard.dataset.orderData;
        if (orderDataStr) {
            const orderData = JSON.parse(orderDataStr);
            renderOrderDetails(orderData, container);
            return;
        }
        
        // Если данных нет в атрибуте, запрашиваем с сервера
        const response = await fetch(`https://backendalcraft-production.up.railway.app/orders/get/${orderId}`);
        
        if (response.ok) {
            const orderDetails = await response.json();
            renderOrderDetails(orderDetails, container);
        } else {
            throw new Error('Не удалось загрузить детали заказа');
        }
    } catch (error) {
        if (container) {
            container.innerHTML = `
                <div class="error-details">
                    <p>Ошибка при загрузке деталей: ${error.message}</p>
                    <button onclick="loadOrderDetails('${orderId}', this.parentElement, this.closest('.order'))">Попробовать снова</button>
                </div>
            `;
        }
    }
}

// Функция отображения деталей заказа
function renderOrderDetails(order, container) {
    if (!container) return;
    
    // Анализируем структуру объекта
    let orderData = order;
    
    // Если есть вложенный data объект
    if (order.data && typeof order.data === 'object') {
        orderData = order.data;
    }
    
    const items = orderData.items || orderData.products || orderData.goods || [];
    const totalAmount = orderData.totalAmount || orderData.totalPrice || orderData.price || 0;
    const totalCount = orderData.totalCount || items.length;
    const discount = orderData.discount || orderData.discountPercent || 0;
    const finalAmount = Math.round(totalAmount * (1 - discount / 100));
    
    // Функция для форматирования цены
    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(price));
    }
    
    container.innerHTML = `
        <div class="order-details">
            <div class="ord">
                <p>Адрес: <span>${orderData.address || ""}</span></p>
                ${orderData.created_at ? `
                <div class="summary-info">
                    Дата заказа: ${new Date(orderData.created_at).toLocaleString('ru-RU')}
                </div>
                ` : ''}
                <div class="order-items">
                    ${items.map(item => {
                        // Получаем изображение для каждого товара
                        const picturePath = item.picturePath;
                        let image = '';
                        
                        if (Array.isArray(picturePath) && picturePath.length > 0) {
                            image = picturePath[0];
                        } else if (typeof picturePath === 'string') {
                            image = picturePath;
                        }
                        
                        // Рассчитываем цену со скидкой для каждого товара
                        const itemDiscount = item.discount || 0;
                        const itemPrice = item.price || 0;
                        const itemFinalPrice = Math.round(itemPrice * (1 - itemDiscount / 100));
                        const itemQuantity = item.quantity || 1;
                        const itemTotalPrice = itemFinalPrice * itemQuantity;
                        
                        return `
                            <div class="order-item-card">
                                ${image ? `<img src="${image}" alt="${item.name || 'Товар'}" class="t-shirt-image">` : ''}
                                <div class="order-item-info">
                                    <div class="name">
                                        <span class="item-name">${item.name || 'Товар'}</span>
                                        <span class="item-collection">${item.nameCollection || ''}</span>
                                    </div>
                                    <div class="item-details">
                                        <span>Размер: ${item.size || ''}</span>
                                        <span>Цвет: ${item.color || ''}</span>
                                        <span>Покрой: ${item.cut || ''}</span>
                                    </div>
                                    <div class="item-price-info">
                                        ${itemDiscount > 0 ? `
                                            <span class="discount-percent">-${itemDiscount}%</span>
                                            <span class="original-price">${formatPrice(itemPrice)} ₽</span>
                                            <span class="discounted-price">${formatPrice(itemFinalPrice)} ₽</span>
                                            
                                        ` : `
                                            <span class="final-price">${formatPrice(itemPrice)} ₽</span>
                                        `}
                                    </div>
                                    <div class="quant-total">
                                        <span class="item-quantity">${itemQuantity} шт.</span>
                                        <span class="item-total">Итого: ${formatPrice(itemTotalPrice)} ₽</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="order-summary">
                <div class="summary-row">
                    <span>Количество товаров:</span>
                    <span>${totalCount} шт.</span>
                </div>
                
                ${discount > 0 ? `
                <div class="summary-row discount">
                    <span>Скидка:</span>
                    <span>-${discount}%</span>
                </div>
                ` : ''}
                
                <div class="summary-row total">
                    <span>Итого к оплате:</span>
                    <span>${formatPrice(finalAmount)} ₽</span>
                </div>
                
                
                ${orderData.phone ? `
                <div class="summary-info">
                    <strong>Телефон:</strong> ${orderData.phone}
                </div>
                ` : ''}
            </div>
        </div>
    `;
}
// Обновленная функция toggleOrderDetails
async function toggleOrderDetails(orderCard) {
    const isExpanded = orderCard.classList.contains('expanded');
    const detailsContent = orderCard.querySelector('.order-details-content');
    const toggleIcon = orderCard.querySelector('.toggle-icon');
    const orderId = orderCard.dataset.orderId;
    
    if (!isExpanded) {
        // Раскрываем - загружаем детали
        orderCard.classList.add('expanded');
        if (toggleIcon) {
            toggleIcon.style.transform = 'rotate(180deg)';
        }
        
        // Загружаем детали
        if (detailsContent) {
            await loadOrderDetails(orderId, detailsContent, orderCard);
            detailsContent.style.display = 'block';
        }
    } else {
        // Скрываем
        orderCard.classList.remove('expanded');
        if (toggleIcon) {
            toggleIcon.style.transform = 'rotate(0deg)';
        }
        if (detailsContent) {
            detailsContent.style.display = 'none';
        }
    }
}

// Функция для настройки взаимодействий с карточками заказов
function setupOrderCardsInteractions() {
    const orderCards = document.querySelectorAll('.order');
    
    orderCards.forEach(card => {
        const toggleBtn = card.querySelector('.order-details-toggle');
        if (toggleBtn && !toggleBtn.hasAttribute('data-listener-added')) {
            toggleBtn.setAttribute('data-listener-added', 'true');
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleOrderDetails(card);
            });
        }
    });
}

// Вспомогательные функции
function getStatusText(status) {
    const statusMap = {
        'pending': 'В обработке',
        'processing': 'Готовится',
        'delivering': 'В пути',
        'delivered': 'Доставлен',
        'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const statusClassMap = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'delivering': 'status-delivering',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return statusClassMap[status] || '';
}

function formatDate(dateString) {
    if (!dateString) return 'Дата не указана';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Дата не указана';
        }
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Дата не указана';
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price || 0);
}

// Функции для отображения состояний
function showLoader(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="order-loader">
            <div class="loader-spinner"></div>
            <p>Загружаем ваши заказы...</p>
        </div>
    `;
}

// Инициализация
document.addEventListener('DOMContentLoaded', loadUserOrders);