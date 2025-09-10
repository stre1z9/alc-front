export function showToasts(message, type = "success") {
  // Создаем контейнер если его нет
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(container);
  }

  const toastConfig = {
    success: {
      background: '#05C50D',  
    },
    error: {
      background: '#B3112F',
    },
    warning: {
      background: '#ff9800',
    },
    info: {
      background: '#2196f3',

    }
  };

  const config = toastConfig[type] || toastConfig.success;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  toast.innerHTML = `
    <div style="display: flex; justify-content: center; gap: 100px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <p style="font-size: 18px; font-family: 'cproreg';">${message}</p>
      </div>
    </div>
  `;

  toast.style.cssText = `
    background: ${config.background};
    color: white;
    padding: 12px 12px;
    border-radius: 6px;
    border: none;
    min-width: 250px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    cursor: pointer;
    font-family:"cpromed";
    
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 5);

  // Автоматическое закрытие через 5 секунд
  const timeoutId = setTimeout(() => {
    hideToasts(toast);
  }, 5000);

  // Закрытие по клику
  toast.addEventListener('click', () => {
    clearTimeout(timeoutId);
    hideToasts(toast);
  });

  return toast;
}

function hideToasts(toast) {
  toast.style.transform = 'translateX(100%)';
  toast.style.opacity = '0';
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Дополнительные методы для удобства
export const toast = {
  success: (message) => showToasts(message, 'success'),
  error: (message) => showToasts(message, 'error'),
  warning: (message) => showToasts(message, 'warning'),
  info: (message) => showToasts(message, 'info')
};

export default showToasts;