document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.data-btn button[data-target]');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetContainer = document.getElementById(targetId);
            
            // Проверяем существование контейнера
            if (!targetContainer) {
                console.error('Контейнер не найден:', targetId);
                return;
            }
            
            // Убираем active у всех кнопок
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем active текущей кнопке
            this.classList.add('active');
            
            // Убираем active у всех контейнеров
            document.querySelectorAll('.con').forEach(container => {
                container.classList.remove('active');
            });
            
            // Добавляем active целевому контейнеру
            targetContainer.classList.add('active');
        });
    });
});
document.addEventListener('DOMContentLoaded', function() {
    // Обработчик для кнопок переключения
    const switchButtons = document.querySelectorAll('.data-btn button[data-target]');
    
    switchButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetContainer = document.getElementById(targetId);
            
            if (targetContainer) {
                switchButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.con').forEach(con => con.classList.remove('active'));
                
                this.classList.add('active');
                targetContainer.classList.add('active');
            }
        });
    });
    
    // Отдельный обработчик для кнопки выхода
    const logoutButton = document.querySelector('.data-btn .logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите выйти?')) {
                // Код для выхода
                console.log('Выход из системы');
            }
        });
    }
});
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Убираем active у всех
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        
        // Добавляем active текущей
        this.classList.add('active');
        
        // Обновляем индикатор через JS
        const index = Array.from(this.parentElement.children).indexOf(this);
        document.querySelector('.indicator').style.transform = `translateX(${index * 100}%)`;
    });
});
// Функция переключения табов заказов
function setupOrderTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Активность кнопок
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Индикатор
            const indicator = document.querySelector('.indicator');
            if (indicator) {
                const index = Array.from(this.parentElement.children).indexOf(this);
                indicator.style.transform = `translateX(${index * 100}%)`;
            }
            
            // Переключение контента
            const tabType = this.getAttribute('data-tab');
            const activeOrders = document.getElementById('active-orders');
            const nonActiveOrders = document.getElementById('non-active-orders');
            
            if (tabType === 'active-orders') {
                if (activeOrders) activeOrders.style.display = 'flex';
                if (nonActiveOrders) nonActiveOrders.style.display = 'none';
            } else if (tabType === 'non-active-orders') {
                if (activeOrders) activeOrders.style.display = 'none';
                if (nonActiveOrders) nonActiveOrders.style.display = 'block';
            }
        });
    });
    
    // Активируем первую кнопку
    const firstTab = document.querySelector('.tab-btn');
    if (firstTab) firstTab.click();
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    setupOrderTabs();
});