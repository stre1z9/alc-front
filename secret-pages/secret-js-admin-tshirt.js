async function createTShirt(tShirtData) {
    try {
        const response = await fetch('https://backendalcraft-production.up.railway.app/t-shirts/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tShirtData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        console.log('Товар успешно создан:', result);
        return result;

    } catch (error) {
        console.error('Ошибка при создании товара:', error);
        throw error;
    }
}
async function updateTShirt(id, tShirtData) {
    try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        
        const response = await fetch(`https://backendalcraft-production.up.railway.app/t-shirts/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(tShirtData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        console.log('Товар успешно обновлен:', result);
        return result;

    } catch (error) {
        console.error('Ошибка при обновлении товара:', error);
        throw error;
    }
}   
async function deleteTShirt(id) {
    try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        
        const response = await fetch(`https://backendalcraft-production.up.railway.app/t-shirts/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        console.log('Товар успешно удален:', result);
        return result;

    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        throw error;
    }
}

// Функция получения всех товаров
async function getAllTShirts() {
    try {
        const response = await fetch('https://backendalcraft-production.up.railway.app/t-shirts');
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        return result.data || result;

    } catch (error) {
        console.error('Ошибка при получении товаров:', error);
        throw error;
    }
}
async function getAllOrders() {
    try {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('https://backendalcraft-production.up.railway.app/orders/get', {
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        
        // Проверяем разные возможные форматы ответа
        if (Array.isArray(result)) {
            return result;
        } else if (result.data && Array.isArray(result.data)) {
            return result.data;
        } else if (result.orders && Array.isArray(result.orders)) {
            return result.orders;
        } else if (result.dataa && Array.isArray(result.dataa)) {
            return result.dataa;
        } else {
            console.warn('Неожиданный формат ответа:', result);
            return [];
        }
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        throw error;
    }
}



// Функция для получения данных пользователя по ID
async function getUserById(userId) {
    try {
        if (!userId || userId === 'Не указан') {
            return null;
        }

        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`https://backendalcraft-production.up.railway.app/users/get/${userId}`, {
            headers: headers
        });

        if (!response.ok) {
            // Если пользователь не найден, возвращаем null
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        return null;
    }
}

// Функция для форматирования ФИО пользователя
function formatUserName(userData) {
    if (!userData) return 'Неизвестный пользователь';
    
    const fullName = `${userData.data.surname || ''} ${userData.data.name || ''} ${userData.data.patronymic || ''}`.trim();
    if (fullName) return fullName;
    
    if (userData.email) return userData.email;
    if (userData.phone) return userData.phone;
    

}

// Функция для отображения заказов с данными пользователей
async function displayOrders() {
    const ordersContainer = document.getElementById('orders');
    
    try {
        const orders = await getAllOrders();
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<div class="no-orders">Заказов не найдено</div>';
            return;
        }
        
        // Создаем массив промисов для получения данных пользователей
        const userPromises = orders.map(order => 
            getUserById(order.userId).catch(() => null)
        );
        
        // Ждем завершения всех запросов
        const usersData = await Promise.all(userPromises);
        
        const ordersHTML = `
            <div class="orders-header">
                <h1>Управление заказами</h1>
                <p class="orders-count">Найдено заказов: <span>${orders.length}</span></p>
            </div>
            <div class="orders-grid">
                ${orders.map((order, index) => {
                    const userData = usersData[index];
                    const userName = formatUserName(userData);
                    
                    return `
                    <div class="order-card-admin">
                        <div class="order-header">
                            <div class="order-info">
                                <h3>Заказ #${order.id || order._id || 'N/A'}</h3>
                                <span class="order-stage ${getStageClass(order.stage)}">
                                    ${getStageText(order.stage)}
                                </span>
                                <span class="order-address">
                                    ${order.address}
                                </span>
                            </div>
                            <div class="order-date">
                                ${order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : 
                                  order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : 
                                  'Дата не указана'}
                            </div>
                        </div>
                        <div class="lol">
                            <div class="order-details-grid">
                                <div class="order-detail">
                                    <span class="detail-label">Клиент:</span>
                                    <span class="detail-value">${userName}</span>
                                </div>
                                <div class="order-detail">
                                    <span class="detail-label">Сумма:</span>
                                    <span class="detail-value price">${formatPrice(order.totalAmount || 0)}</span>
                                </div>
                                <div class="order-detail">
                                    <span class="detail-label">Товаров:</span>
                                    <span class="detail-value">${order.totalCount || 0} шт.</span>
                                </div>
                                <div class="order-detail">
                                    <span class="detail-label">ID заказа:</span>
                                    <span class="detail-value">${order._id || order.id || 'N/A'}</span>
                                </div>
                            </div>

                            ${order.items && Array.isArray(order.items) && order.items.length > 0 ? `
                                <div class="order-items-section">
                                    <h4>Товары (${order.items.length}):</h4>
                                    <div class="order-items-list">
                                        ${order.items.map(item => `
                                            <div class="order-item">
                                                <img src="${item.picturePath || item.image || '/placeholder.jpg'}" 
                                                    alt="${item.name || 'Товар'}" 
                                                    class="item-image">
                                                <div class="item-info">
                                                    <div class="item-name">${item.name || item.tShirtName || 'Неизвестный товар'}</div>
                                                    <div class="item-details">
                                                        <span>Размер ${item.size || ''}</span>
                                                        <span>Цвет ${item.color || ''}</span>
                                                        <span>Количество ${item.quantity || 1} шт.</span>
                                                    </div>
                                                </div>
                                                <div class="item-price">${Math.round((item.price || 0) * (1 - item.discount/100))} ₽</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        

                        

                        <div class="stage-actions">
                            <h4>Изменить стадию:</h4>
                            <div class="stage-buttons">
                                <button class="btn btn-stage btn-new" onclick="updateOrderStage('${order._id || order.id}', 'new')"
                                    ${order.stage === 'new' ? 'disabled' : ''}>
                                    Новый
                                </button>
                                <button class="btn btn-stage btn-processing" onclick="updateOrderStage('${order._id || order.id}', 'processing')"
                                    ${order.stage === 'processing' ? 'disabled' : ''}>
                                    В обработке
                                </button>
                                <button class="btn btn-stage btn-confirmed" onclick="updateOrderStage('${order._id || order.id}', 'confirmed')"
                                    ${order.stage === 'confirmed' ? 'disabled' : ''}>
                                    Подтвержден
                                </button>
                                <button class="btn btn-stage btn-shipped" onclick="updateOrderStage('${order._id || order.id}', 'shipped')"
                                    ${order.stage === 'shipped' ? 'disabled' : ''}>
                                    Отправлен
                                </button>
                                <button class="btn btn-stage btn-delivered" onclick="updateOrderStage('${order._id || order.id}', 'delivered')"
                                    ${order.stage === 'delivered' ? 'disabled' : ''}>
                                    Доставлен
                                </button>
                                <button class="btn btn-stage btn-completed" onclick="updateOrderStage('${order._id || order.id}', 'completed')"
                                    ${order.stage === 'completed' ? 'disabled' : ''}>
                                    Завершен
                                </button>
                                <button class="btn btn-stage btn-cancelled" onclick="updateOrderStage('${order._id || order.id}', 'cancelled')"
                                    ${order.stage === 'cancelled' ? 'disabled' : ''}>
                                    Отменен
                                </button>
                            </div>
                        </div>

                        <div class="order-meta">
                            <small>Создан: ${order.created_at ? new Date(order.created_at).toLocaleString('ru-RU') : 
                                  order.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU') : 
                                  'Не указано'}</small>
                            ${userData ? `<small>ID пользователя: ${order.userId}</small>` : ''}
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
        
        ordersContainer.innerHTML = ordersHTML;
        
    } catch (error) {
        ordersContainer.innerHTML = `
            <div class="error">
                <h3>Ошибка при загрузке заказов</h3>
                <p>${error.message}</p>
                <button onclick="displayOrders()">Попробовать снова</button>
            </div>
        `;
    }
}

// Обновляем функцию updateOrderStage для использования данных пользователя
async function updateOrderStage(orderId, newStage) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Токен авторизации не найден');
        }

        // Получаем текущие данные заказа
        const orders = await getAllOrders();
        const order = orders.find(o => o._id === orderId || o.id === orderId);
        
        if (!order) {
            throw new Error('Заказ не найден');
        }

        // Получаем данные пользователя для отправки
        const userData = await getUserById(order.userId);
        
        // Подготавливаем данные в нужном формате
        const updateData = {
            userId: order.userId || '',
            items: order.items || [],
            totalCount: order.totalCount?.toString() || '0',
            totalAmount: order.totalAmount?.toString() || '0',
            stage: newStage,
            created_at: order.createdAt ? new Date(order.createdAt) : new Date(),
            // Добавляем данные пользователя, если они есть
            userData: userData ? {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone
            } : null
        };

        const response = await fetch('https://backendalcraft-production.up.railway.app/orders/update-stage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Стадия заказа обновлена:', result);
        
        showNotification(`Стадия заказа изменена на "${getStageText(newStage)}"`, 'success');
        
        // Обновляем отображение заказов
        displayOrders();
        
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка обновления стадии заказа:', error);
        showNotification(`Ошибка обновления стадии: ${error.message}`, 'error');
        throw error;
    }
}

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('orders')) {
        displayOrders();
    }
});

// Вспомогательные функции
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' ₽';
}

// Вспомогательная функция для получения текста стадии
function getStageText(stage) {
    const stageTexts = {
        'new': 'Новый',
        'processing': 'В обработке',
        'confirmed': 'Подтвержден',
        'shipped': 'Отправлен',
        'delivered': 'Доставлен',
        'cancelled': 'Отменен',
        'completed': 'Завершен'
    };
    return stageTexts[stage] || stage;
}

// Функция для получения класса CSS для стадии
function getStageClass(stage) {
    const stageClasses = {
        'new': 'stage-new',
        'processing': 'stage-processing',
        'confirmed': 'stage-confirmed',
        'shipped': 'stage-shipped',
        'delivered': 'stage-delivered',
        'cancelled': 'stage-cancelled',
        'completed': 'stage-completed'
    };
    return stageClasses[stage] || 'stage-unknown';
}

// Функция для отладки - посмотреть raw данные
async function debugOrders() {
    try {
        const response = await fetch('https://backendalcraft-production.up.railway.app/orders/get');
        const result = await response.json();
        console.log('Raw response:', result);
        
        // Проверяем структуру ответа
        if (result.dataa) {
            console.log('dataa field:', result.dataa);
            console.log('Is array:', Array.isArray(result.dataa));
        }
        if (result.data) {
            console.log('data field:', result.data);
            console.log('Is array:', Array.isArray(result.data));
        }
        if (result.orders) {
            console.log('orders field:', result.orders);
            console.log('Is array:', Array.isArray(result.orders));
        }
        
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('orders')) {
        displayOrders();
        
        // Для отладки - раскомментируйте следующую строку
        // debugOrders();
    }
});
// Вспомогательная функция для валидации данных
function validateTShirtData(data) {
    const errors = [];

    if (!data.tShirtName || data.tShirtName.trim() === '') {
        errors.push('Название товара обязательно');
    }

    if (!data.nameCollection || data.nameCollection.trim() === '') {
        errors.push('Название коллекции обязательно');
    }

    if (!data.color || data.color.trim() === '') {
        errors.push('Цвет обязателен');
    }

    if (!data.cut || data.cut.trim() === '') {
        errors.push('Покрой обязателен');
    }

    if (!data.price || data.price <= 0) {
        errors.push('Цена должна быть больше 0');
    }

    if (data.picturePath && !Array.isArray(data.picturePath)) {
        errors.push('PicturePath должен быть массивом');
    }

    if (data.techInfo && !Array.isArray(data.techInfo)) {
        errors.push('TechInfo должен быть массивом');
    }

    if (data.size && !Array.isArray(data.size)) {
        errors.push('Size должен быть массивом');
    }

    if (data.density && !Array.isArray(data.density)) {
        errors.push('Density должен быть массивом');
    }

    return errors;
}
let lastId = 0;

function generateTShirtId() {
    lastId++;
    return `TS${String(lastId).padStart(6, '0')}`;
}
// Функция для создания объекта товара
function createTShirtObject(formData) {
    return {
        tShirtId: formData.tShirtId || generateTShirtId(),
        tShirtName: formData.tShirtName,
        nameCollection: formData.nameCollection,
        collectionID: formData.collectionID || null,
        color: formData.color,
        cut: formData.cut,
        price: parseFloat(formData.price),
        picturePath: formData.picturePath ? formData.picturePath.split(',').map(url => url.trim()) : [],
        discount: parseInt(formData.discount) || 0,
        techInfo: formData.techInfo ? formData.techInfo.split(',').map(item => item.trim()) : [],
        size: formData.size ? formData.size.split(',').map(item => item.trim()) : [],
        density: formData.density ? formData.density.split(',').map(num => parseFloat(num)) : [],
        description: formData.description || null
    };
}


// Пример использования
async function handleTShirtSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    // Создаем объект товара
    const tShirtData = createTShirtObject(data);
    
    // Валидация
    const errors = validateTShirtData(tShirtData);
    if (errors.length > 0) {
        alert('Ошибки валидации:\n' + errors.join('\n'));
        return;
    }
    
    try {
        const result = await createTShirt(tShirtData);
        alert('Товар успешно создан!');
        console.log('Созданный товар:', result);
        
        // Очистка формы
        event.target.reset();
        
    } catch (error) {
        alert('Ошибка при создании товара: ' + error.message);
    }
}

// Функция для загрузки изображений (если нужно загружать файлы)
async function uploadTShirtImages(files) {
    try {
        const formData = new FormData();
        
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const response = await fetch('https://backendalcraft-production.up.railway.app/admin/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки изображений');
        }
        
        const result = await response.json();
        return result.urls; // Массив URL загруженных изображений
        
    } catch (error) {
        console.error('Ошибка загрузки изображений:', error);
        throw error;
    }
}


// Подключение к форме
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('tShirtForm');
    if (form) {
        form.addEventListener('submit', handleTShirtSubmit);
    }
    
    // Кнопка для загрузки изображений
    const imageUploadBtn = document.getElementById('imageUpload');
    if (imageUploadBtn) {
        imageUploadBtn.addEventListener('change', async function(event) {
            const files = event.target.files;
            if (files.length > 0) {
                try {
                    const urls = await uploadTShirtImages(files);
                    document.getElementById('picturePath').value = urls.join(',');
                    alert('Изображения успешно загружены!');
                } catch (error) {
                    alert('Ошибка загрузки изображений: ' + error.message);
                }
            }
        });
    }
    getAllOrders();
});
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.container button');
    const tabContents = document.querySelectorAll('.tab-content');

    buttons.forEach(button => {
        button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
                    
            if (tabId) {
                buttons.forEach(btn => btn.classList.remove('active'));

                this.classList.add('active');
                tabContents.forEach(tab => tab.classList.remove('active'));
                const targetTab = document.getElementById(tabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            }
        });
    });

    const deleteButton = document.getElementById('delete-item');
    if (deleteButton) {
        deleteButton.addEventListener('click', function() {
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            tabContents.forEach(tab => tab.classList.remove('active'));        
            const deleteTab = document.getElementById('delete-item-content');
            if (deleteTab) {
                deleteTab.classList.add('active');
            }
        });
    }

});