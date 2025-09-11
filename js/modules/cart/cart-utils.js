const API_URL = "https://backendalcraft-production.up.railway.app";

export function getCurrentUser() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("access_token");
  
  console.log('🔍 DEBUG getCurrentUser:', { 
    userId, 
    token,
    storedUserId: localStorage.getItem("userId"),
    storedToken: localStorage.getItem("access_token")
  });

  return {
    userId: userId,
    token: token,

  };
}
let currentProduct = null; 
export function showSizeModal(sizes) {
  const modal = document.getElementById('size-modal');
  const sizeGrid = modal.querySelector('.size-grid');
  const confirmBtn = modal.querySelector('.wb-modal__confirm');

  sizeGrid.innerHTML = '';

  sizes.forEach(size => {
    const sizeItem = document.createElement('div');
    sizeItem.className = 'size-item';
    sizeItem.innerHTML = `
      <input type="radio" name="size" value="${size}" id="size-${size}" class="size-input">
      <label for="size-${size}" class="size-label">${size}</label>
    `;
    sizeGrid.appendChild(sizeItem);
  });

  confirmBtn.disabled = true;

  const sizeInputs = modal.querySelectorAll('.size-input');
  sizeInputs.forEach(input => {
    input.addEventListener('change', () => {
      confirmBtn.disabled = false;
    });
  });

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; 

  return new Promise((resolve, reject) => {
    const onConfirm = () => {
      const selectedSize = modal.querySelector('.size-input:checked').value;
      hideModal();
      resolve(selectedSize);
    };
    
    const onClose = () => {
      hideModal();
      reject(new Error('Выбор размера отменен'));
    };
    
    const hideModal = () => {
      modal.style.display = 'none';
      document.body.style.overflow = ''; // Восстанавливаем скролл
    };
    
    // Вешаем обработчики
    confirmBtn.addEventListener('click', onConfirm);
    modal.querySelector('.wb-modal__close').addEventListener('click', onClose);
    modal.querySelector('.wb-modal__overlay').addEventListener('click', onClose);
    
    // Закрытие по Escape
    const onEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEscape);
    
    // Убираем обработчики после использования
    const cleanup = () => {
      confirmBtn.removeEventListener('click', onConfirm);
      modal.querySelector('.wb-modal__close').removeEventListener('click', onClose);
      modal.querySelector('.wb-modal__overlay').removeEventListener('click', onClose);
      document.removeEventListener('keydown', onEscape);
    };
  });
}

// Функция скрытия модального окна
function hideSizeModal() {
    const modal = document.getElementById('size-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentProduct = null;
}
export const getCart = () => {
  const { userId } = getCurrentUser(); // 🔥 ДОБАВИЛИ isAuthenticated
  
  console.log('🛒 getCart called for user:', userId);

  const cartData = localStorage.getItem(`cart_${userId}`);
  
  try {
    const cart = JSON.parse(cartData);
    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error('❌ Ошибка парсинга корзины:', error);
    return [];
  }
};

export const setCart = (cart) => {
  const { userId } = getCurrentUser();
  console.log(`Установка корзины для пользователя ${userId}:`, cart);
  localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
};

export function formatRub(n) {
  return new Intl.NumberFormat("ru-RU").format(Number(n) || 0) + " ₽";
}

export function updateCounter() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (Number(i.quantity) || 1), 0);

  ["count", "counter", "quant", "cart-count"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = total;
  });

  const totalPrice = cart.reduce((s, i) => s + (Number(i.price) * Number(i.quantity) || 0), 0);
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = formatRub(totalPrice);
}

export function uid() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function firstPic(p) {
  if (!p) return "";
  if (Array.isArray(p)) return p[0] || "";
  return p;
}

function buildKey(p) {
  return [
    (p.tShirtName || "").trim().toLowerCase(),
    (p.size || "").toString().trim().toLowerCase(),
    (p.color || "").toString().trim().toLowerCase(),
    (p.cut || "").toString().trim().toLowerCase(),
    (p.nameCollection || "").toString().trim().toLowerCase(),
    firstPic(p.picturePath)
  ].join("||");
}

export async function addToCart(product) {
    if ((product.sizes && product.sizes.length > 0) && !product.selectedSize) {
        showSizeModal(product);
        return;
    }

    product.quantity = Math.max(1, Number(product.quantity) || 1);
    product.price = Number(product.price) || 0;

    if (!product.productId) {
        product.productId = product._id || uid();
    }

    let cart = getCart();
    const keyNew = buildKey(product);
    const existingIndex = cart.findIndex(item => buildKey(item) === keyNew);

    if (existingIndex !== -1) {
        cart[existingIndex].quantity = (Number(cart[existingIndex].quantity) || 1) + product.quantity;
    } else {
        if (!product._id) product._id = uid();
        cart.push(product);
    }

    setCart(cart);
    updateCounter();
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart } }));

    try {
        await saveCartToServer(cart);
        console.log('Товар добавлен в корзину');
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
    }
    
    // Сбрасываем выбранный размер
    if (product.selectedSize) {
        delete product.selectedSize;
    }
}

// Обработчики для модального окна
document.addEventListener('DOMContentLoaded', function() {
    // Кнопка подтверждения выбора размера
    const confirmBtn = document.getElementById('confirm-size');
    const cancelBtn = document.getElementById('cancel-size');
    const modal = document.getElementById('size-modal');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (currentProduct && currentProduct.selectedSize) {
                addToCart(currentProduct);
                hideSizeModal();
            } else {
                alert('Пожалуйста, выберите размер');
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideSizeModal);
    }
    
    // Закрытие по клику вне модального окна
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideSizeModal();
            }
        });
    }
});

function findCartItem(itemId, productId = null) {
  const cart = getCart();

  if (productId) {
    const item = cart.find(i => i.productId === productId || i._id === productId);
    if (item) return item;
  }
  
  if (itemId) {
    return cart.find(i => i._id === itemId || i.productId === itemId);
  }
  
  return null;
}
export async function updateMultipleCartItems(updates) {
  let cart = getCart();
  let hasChanges = false;

  updates.forEach(update => {
    const item = findCartItem(null, update.productId);
    if (item && item.quantity !== update.quantity) {
      item.quantity = Math.max(1, Number(update.quantity) || 1);
      item.lastUpdated = Date.now();
      hasChanges = true;
    }
  });

  if (hasChanges) {
    setCart(cart);
    updateCounter();
    
    try {
      await saveCartToServer(cart);
      console.log('✅ Корзина синхронизирована с сервером');
      return true;
    } catch (error) {
      console.error('❌ Ошибка синхронизации корзины:', error);
      // Можно добавить механизм повтора или уведомление пользователя
      return false;
    }
  }
  
  return true;
}
export async function updateCartItemQuantity(productId, newQuantity) {
  let cart = getCart();
  const item = findCartItem(null, productId);
  
  if (item) {
    const oldQuantity = item.quantity;
    item.quantity = Math.max(1, Number(newQuantity) || 1);
    item.lastUpdated = Date.now();
    setCart(cart);
    updateCounter();
    
    try {
      // Синхронизируем с сервером
      await saveCartToServer(cart);
      console.log('✅ Количество товара обновлено на сервере');
    } catch (error) {
      // Если ошибка синхронизации - откатываем изменения
      item.quantity = oldQuantity;
      setCart(cart);
      updateCounter();
      console.error('❌ Ошибка обновления количества на сервере:', error);
      throw error;
    }
  }
}

export async function removeFromCart(productId) {
    try {
        // 1. Получаем userId
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.error('UserId не найден');
            return false;
        }
        
        // 2. Получаем текущую корзину (правильно обрабатываем null)
        const cartKey = `cart_${userId}`;
        const cartData = localStorage.getItem(cartKey);
        const cart = cartData ? JSON.parse(cartData) : [];
        
        console.log('📦 Корзина до удаления:', cart);
        console.log('🎯 Удаляем productId:', productId);
        
        // 3. Фильтруем массив, убирая товар
        const newCart = cart.filter(item => {
            const matches = item.productId === productId || item._id === productId;
            console.log(`🔍 Товар ${item.productId || item._id}: ${matches ? 'УДАЛЯЕМ' : 'ОСТАВЛЯЕМ'}`);
            return !matches;
        });
        
        console.log('📦 Корзина после удаления:', newCart);
        
        // 4. Сохраняем обратно в localStorage
        localStorage.setItem(cartKey, JSON.stringify(newCart));

        // 5. Обновляем счетчик
        const total = newCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const countElement = document.getElementById('count');
        if (countElement) {
            countElement.textContent = total;
        }
        
        await saveCartToServer(newCart);
        // 6. Вызываем обновление общей суммы (если такая функция есть)
        if (typeof updateCartTotal === 'function') {
            updateCartTotal();
        }
        
        console.log('✅ Товар успешно удален');
        return true;
        
    } catch (error) {
        console.error('💥 Ошибка при удалении:', error);
        return false;
    }
}
export async function fetchCartFromServer() {
  const { userId, token } = getCurrentUser();
  
  if (!token || userId === "guest") {
    console.log('Гостевая корзина');
    return getCart();
  }

  try {
    const res = await fetch(`${API_URL}/cart/get/${userId}`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        console.log('Корзина на сервере не найдена');
        return getCart(); 
      }
      throw new Error(`Ошибка загрузки корзины: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Корзина с сервера:', data);

    const currentCart = getCart();
    
    let serverItems = [];
    if (data.data && data.data.items && Array.isArray(data.data.items)) {
      serverItems = data.data.items;
    }

    const mergedCart = mergeCarts(currentCart, serverItems);
    
    console.log('Объединенная корзина:', mergedCart);
    setCart(mergedCart);
    updateCounter();
    
    // 🔥 СИНХРОНИЗИРУЕМ ОБЪЕДИНЕННУЮ КОРЗИНУ НА СЕРВЕР
    await saveCartToServer(mergedCart);
    
    return mergedCart;
    
  } catch (err) {
    console.error("Не удалось загрузить корзину с сервера:", err);
    // 🔥 ПРИ ОШИБКЕ ВОЗВРАЩАЕМ ТЕКУЩУЮ КОРЗИНУ
    return getCart();
  }
}

// 🔥 ФУНКЦИЯ ОБЪЕДИНЕНИЯ КОРЗИН
function mergeCarts(localCart, serverItems) {
  if (!serverItems.length) return localCart;

  const serverCart = serverItems.map(serverItem => ({
    _id: serverItem.id || uid(),
    productId: serverItem.productId,
    tShirtName: serverItem.name,
    price: serverItem.price,
    quantity: serverItem.quantity,
    size: serverItem.size,
    color: serverItem.color,
    picturePath: serverItem.picturePath,
    nameCollection: serverItem.nameCollection,
    discount: serverItem.discount,
    cut: serverItem.cut,
    lastUpdated: Date.now() 
  }));

  const merged = [...localCart];
  
  serverCart.forEach(serverItem => {
    const existingIndex = merged.findIndex(item => 
      item.productId === serverItem.productId
    );
    
    if (existingIndex === -1) {

      merged.push(serverItem);
    } else {
      // 🔥 СОХРАНЯЕМ ЛОКАЛЬНОЕ КОЛИЧЕСТВО, ЕСЛИ ОНО БЫЛО ИЗМЕНЕНО
      const localItem = merged[existingIndex];
      if (localItem.quantity !== serverItem.quantity) {
        console.log('Сохраняем локальное количество для товара:', localItem.tShirtName);
        // Локальное количество остается без изменений
      }
      // Обновляем остальные данные с сервера
      merged[existingIndex] = {
        ...serverItem,
        quantity: localItem.quantity, // 🔥 СОХРАНЯЕМ ЛОКАЛЬНОЕ КОЛИЧЕСТВО
        _id: localItem._id // Сохраняем локальный ID
      };
    }
  });
  
  return merged;
}

export async function saveCartToServer(cart = null) { // ✅ ЗНАЧЕНИЕ ПО УМОЛЧАНИЮ
  const { userId, token } = getCurrentUser();
  
  if (!token || userId === "guest") {
    console.log('Гостевая корзина - сохранение только локально');
    return;
  }

  // 🔥 ЕСЛИ cart НЕ ПЕРЕДАН, БЕРЕМ ИЗ localStorage
  const cartToSave = cart || getCart();
  
  try {
    const itemsToSend = cartToSave.map(item => ({
      discount: item.discount,
      productId: item.productId || item._id,
      name: item.tShirtName || 'Неизвестный товар',
      price: item.price || 0,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      picturePath: item.picturePath || '',
      nameCollection: item.nameCollection,
      cut: item.cut
    }));

    console.log('Отправка на сервер:', itemsToSend);

    const res = await fetch(`${API_URL}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        items: itemsToSend
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка сервера: ${res.status}`);
    }

    const result = await res.json();
    console.log('Корзина сохранена на сервер:', result);
    return result;
    
  } catch (err) {
    console.error("Не удалось сохранить корзину на сервер:", err);
    throw err;
  }
}

// 🔥 ОБРАБОТЧИКИ СОБЫТИЙ - РАБОТАЮТ С productId
export function setupCartEventListeners() {
  document.addEventListener('click', async (e) => {
    const increaseBtn = e.target.closest('.increase');
    const decreaseBtn = e.target.closest('.decrease');
    const removeBtn = e.target.closest('.remove');

    if (increaseBtn || decreaseBtn || removeBtn) {
      e.preventDefault();
      
      const card = (increaseBtn || decreaseBtn || removeBtn).closest('[data-product-id]');
      if (!card) return;

      const productId = card.dataset.productId;
      if (!productId) return;

      if (increaseBtn) {
        await updateCartItemQuantity(productId, 
          (parseInt(card.querySelector('.quantity-value').textContent) || 1) + 1
        );
      } else if (decreaseBtn) {
        await updateCartItemQuantity(productId, 
          Math.max(1, (parseInt(card.querySelector('.quantity-value').textContent) || 1) - 1)
        );
      } else if (removeBtn) {
        if (confirm('Удалить товар из корзины?')) {
          await removeFromCart(productId);
        }
      }
    }
  });
}


export async function retryFailedSync() {
  const { userId, token } = getCurrentUser();
  
  if (!token || userId === "guest") return;

  const errorKey = `cart_error_${userId}`;
  const errorData = localStorage.getItem(errorKey);
  
  if (errorData) {
    try {
      const { cart, timestamp } = JSON.parse(errorData);
      console.log('🔄 Попытка повторной синхронизации корзины...');
      
      const result = await saveCartToServer(cart);
      
      if (result.success) {
        localStorage.removeItem(errorKey);
        console.log('✅ Повторная синхронизация успешна');
      }
    } catch (error) {
      console.error('❌ Повторная синхронизация не удалась:', error);
    }
  }
}
export function setupCartButtons() {
  document.addEventListener('click', async (e) => {
    const addButton = e.target.closest('.add-to-cart');
    if (!addButton) return;

    e.preventDefault();
    
    const product = {
      discount: addButton.dataset.discount,
      productId: addButton.dataset.productId, 
      price: parseFloat(addButton.dataset.price),
      size: addButton.dataset.size,
      color: addButton.dataset.color,
      picturePath: addButton.dataset.image,
      quantity: 1
    };

    try {
      await addToCart(product);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  });
}
export function setupBuyButtons() {
    document.addEventListener('click', async (e) => {
        const buyButton = e.target.closest('.buy');
        if (!buyButton) return;

        e.preventDefault();

        const product = {
            productId: buyButton.dataset.productId,
            tShirtName: buyButton.dataset.name,
            price: parseFloat(buyButton.dataset.price),
            sizes: buyButton.dataset.sizes ? JSON.parse(buyButton.dataset.sizes) : [], // Массив размеров
            color: buyButton.dataset.color,
            picturePath: buyButton.dataset.image,
            quantity: 1
        };

        showSizeModal(product);
    });
}
document.addEventListener('click', async (e) => {
    if (e.target.closest('.remove')) {
        const card = e.target.closest('.t-shirt-card');
        const productId = card.dataset.productId || card.dataset.id;

        const success = await removeFromCart(productId);
        
        if (success) {

            card.remove();
        }
        updateCartTotal();
    }
});
setInterval(retryFailedSync, 30000);