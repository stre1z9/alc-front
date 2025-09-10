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
        const response = await fetch('https://backendalcraft-production.up.railway.app/orders/get');

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        
        // Проверяем разные возможные форматы ответа
        if (Array.isArray(result)) {
            return result; // Если ответ уже массив
        } else if (result.dataa && Array.isArray(result.dataa)) {
            return result.dataa; // Если данные в поле dataa
        } else if (result.data && Array.isArray(result.data)) {
            return result.data; // Если данные в поле data
        } else if (result.orders && Array.isArray(result.orders)) {
            return result.orders; // Если данные в поле orders
        } else {
            console.warn('Неожиданный формат ответа:', result);
            return []; // Возвращаем пустой массив
        }
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        throw error;
    }
}

// Функция для отображения заказов
async function displayOrders() {
    const ordersContainer = document.getElementById('orders');
    
    // Показываем индикатор загрузки
    ordersContainer.innerHTML = '<div class="loading">Загрузка заказов...</div>';
    
    try {
        const orders = await getAllOrders();
        
        // Добавляем дополнительную проверку
        if (!Array.isArray(orders)) {
            console.warn('Orders is not an array:', orders);
            ordersContainer.innerHTML = `
                <div class="error">
                    <h3>Ошибка формата данных</h3>
                    <p>Полученные данные не являются массивом</p>
                    <pre>${JSON.stringify(orders, null, 2)}</pre>
                    <button onclick="displayOrders()">Попробовать снова</button>
                </div>
            `;
            return;
        }
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<div class="no-orders">Заказов не найдено</div>';
            return;
        }
        
        // Создаем HTML для отображения заказов
        const ordersHTML = `
            <div class="orders-header">
                <h2>Список заказов</h2>
                <p>Всего заказов: ${orders.length}</p>
            </div>
            <div class="orders-list">
                ${orders.map(order => `
                    <div class="order-card">
                        <h3>Заказ ${order.id || order._id || 'N/A'}</h3>
                        <div class="order-details">
                            <p><strong>Статус:</strong> ${order.status || 'Не указан'}</p>
                            <p><strong>Дата:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Не указана'}</p>
                            <p><strong>Сумма:</strong> ${order.totalAmount ? `${order.totalAmount} руб.` : 'Не указана'}</p>
                            <p><strong>Клиент:</strong> ${order.customerName || order.userId || order.email || 'Не указан'}</p>
                        </div>
                        ${order.items && Array.isArray(order.items) ? `
                            <div class="order-items">
                                <strong>Товары:</strong>
                                <ul>
                                    ${order.items.map(item => `
                                        <li>${item.name || item.title || 'Товар'} - ${item.quantity || 0} шт. × ${item.price || 0} руб.</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
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

// Генерация уникального ID для товара
function generateTShirtId() {
    return 'TS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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