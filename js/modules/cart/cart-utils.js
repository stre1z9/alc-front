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
  const { userId} = getCurrentUser(); // 🔥 ДОБАВИЛИ isAuthenticated
  
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
  const total = cart.reduce((s, i) => s + (Number(i.qty) || 1), 0);

  ["count", "counter", "quant", "cart-count"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = total;
  });

  const totalPrice = cart.reduce((s, i) => s + (Number(i.price) * Number(i.qty) || 0), 0);
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

    product.qty = Math.max(1, Number(product.qty) || 1);
    product.price = Number(product.price) || 0;

    if (!product.productId) {
        product.productId = product._id || uid();
    }

    let cart = getCart();
    const keyNew = buildKey(product);
    const existingIndex = cart.findIndex(item => buildKey(item) === keyNew);

    if (existingIndex !== -1) {
        cart[existingIndex].qty = (Number(cart[existingIndex].qty) || 1) + product.qty;
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
    const item = cart.find(i => i.productId === productId);
    if (item) return item;
  }
  return cart.find(i => i._id === itemId);
}

export async function updateCartItemQuantity(productId, newQuantity) {
  let cart = getCart();
  const item = findCartItem(null, productId);
  
  if (item) {
    item.qty = Math.max(1, Number(newQuantity) || 1);
    item.lastUpdated = Date.now(); // 🔥 ОБНОВЛЯЕМ МЕТКУ ВРЕМЕНИ
    setCart(cart);
    updateCounter();
    
    try {
      await saveCartToServer(cart);
    } catch (error) {
      console.error('Ошибка обновления количества:', error);
    }
  }
}

export async function removeFromCart(productId) {
    try {
        // 1. Получаем текущую корзину
        const cart = JSON.parse(localStorage.getItem(`cart_${localStorage.getItem('userId')}`) || "[]");
        
        // 2. Фильтруем массив, убирая товар
        const newCart = cart.filter(item => 
            item.productId !== productId && 
            item._id !== productId
        );
        
        // 3. Сохраняем обратно в localStorage
        localStorage.setItem(`cart_${localStorage.getItem('userId')}`, JSON.stringify(newCart));

        const total = newCart.reduce((sum, item) => sum + (item.qty || 1), 0);
        document.getElementById('count').textContent = total;
        
        return true;
        
    } catch (error) {
        console.error('💥 Полная хуйня при удалении:', error);
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
    qty: serverItem.quantity,
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
      if (localItem.qty !== serverItem.quantity) {
        console.log('Сохраняем локальное количество для товара:', localItem.tShirtName);
        // Локальное количество остается без изменений
      }
      // Обновляем остальные данные с сервера
      merged[existingIndex] = {
        ...serverItem,
        qty: localItem.qty, // 🔥 СОХРАНЯЕМ ЛОКАЛЬНОЕ КОЛИЧЕСТВО
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
      quantity: item.qty || 1,
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
          (parseInt(card.querySelector('.qty-value').textContent) || 1) + 1
        );
      } else if (decreaseBtn) {
        await updateCartItemQuantity(productId, 
          Math.max(1, (parseInt(card.querySelector('.qty-value').textContent) || 1) - 1)
        );
      } else if (removeBtn) {
        if (confirm('Удалить товар из корзины?')) {
          await removeFromCart(productId);
        }
      }
    }
  });
}

export async function syncCartOnAuthChange() {
  const { userId, token } = getCurrentUser();
  
  if (token && userId !== "guest") {
    try {
      await fetchCartFromServer();
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
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
      qty: 1
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
            qty: 1
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

            updateCartTotal();
        }
    }
});