// cart.js
import { showToasts } from "../common/helpers/toast.helpers.js";
import { getCart, setCart, formatRub, updateCounter, saveCartToServer, retryFailedSync } from "./cart-utils.js";

const BASKET_ID = "basket-container";
const LOADING_ID = "loading";

export function renderBasket() {
  const wrap = document.getElementById(BASKET_ID);
  const loading = document.getElementById(LOADING_ID);
  const makingBlock = document.querySelector(".making");
  const discountBlock = document.querySelector(".discount");
  const totalBlock = document.querySelector(".full-price")

  if (!wrap) return;

  const cart = getCart();

  if (!cart.length) {
    if (loading) loading.style.display = "";
    wrap.innerHTML = "";
    updateCounter();

    if (makingBlock) makingBlock.style.display = "none";
    if (discountBlock) discountBlock.textContent = "";
    if (totalBlock) totalBlock.textContent = "₽"
    return;
  }

  if (loading) loading.style.display = "none";

  let totalDiscount = 0;
  let totalFinalSum = 0;
  
  const html = cart.map(item => {
    const size = item.size;
    const quantity   = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const disc  = Number(item.discount) || 0;
    const final = Math.round(price * (1 - disc / 100));
    const collectionId = item.collectionId || 1;
    const totalFinal = final * quantity;
    const totalPrice = price * quantity;
    const img = Array.isArray(item.picturePath) ? (item.picturePath[0] || "") : (item.picturePath || "");
    const discountSum = (price - final) * quantity;
    totalDiscount += discountSum;
    totalFinalSum += totalFinal;
    const color = getCollectionColor(collectionId);

    return `
      <div class="t-shirt-card" data-id="${item._id}">
        
        ${img ? `<img src="${img}" alt="${item.tShirtName}" class="t-shirt-image">`
              : `<div class="no-image">Нет фото</div>`}
        <div class="info">
          <div class="cart-info">
            <p class="t-shirt-new">${item.tShirtNew || "  "}</p>
            <p class="t-shirt-name">${item.tShirtName}</p>
          </div>
          <div class="techinfo">
            <p class="color">Цвет: <span>${item.color || "—"}</span></p>
            <p class="size">Размер: <span>${size || "—"}</span></p>
            <p class="cut">Крой: <span>${item.cut || "—"}</span></p>
          </div>
          <div class="t-shirt-collection" style="background-color: ${color}">${item.nameCollection}</div>
        </div>
        <div class="price">
          <div class="quantity">
            <button class="decrease" data-action="decrease" data-id="${item._id}" style="cursor: pointer">−</button>
            <span class="quantity-value">${quantity}</span>
            <button class="increase" data-action="increase" data-id="${item._id}" style="cursor: pointer">+</button>
          </div>
          <div class="pr">
            ${disc
              ? `
                <span>${formatRub(totalFinal)}</span>
                <span class="final">${final} цена за 1 шт</span>`
              : `${formatRub(totalFinal)}`
            }
          </div>
        </div>
        <button class="remove" data-action="remove" data-id="${item._id}" style="cursor: pointer"><svg width="20" height="20" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 3.22234L6.72234 0.5L7.5 1.27766L4.77766 4L7.5 6.72234L6.72234 7.5L4 4.77766L1.27766 7.5L0.5 6.72234L3.22234 4L0.5 1.27766L1.27766 0.5L4 3.22234Z" fill="black"/>
          </svg>
        </button>
      </div>
    `;
  }).join("");

  wrap.innerHTML = html;
  updateCounter();
  setCart(cart);

  if (makingBlock) makingBlock.style.display = "";

  if (discountBlock) {
    discountBlock.textContent = totalDiscount > 0
      ? `${formatRub(totalDiscount)}`
      : "";
  }
  if (totalBlock) {
    totalBlock.textContent = `${formatRub(totalFinalSum)}`;
  }
}
function getCollectionColor(collectionId) {
  const id = parseInt(collectionId) || 1;
  const colors = [
      '#FF6B6B', // ID 1 - Ярко-красный
      '#4ECDC4', // ID 2 - Бирюзовый  
      '#45B7D1', // ID 3 - Голубой
      '#F9A826', // ID 4 - Оранжевый
      '#6C5CE7', // ID 5 - Фиолетовый
      '#FD79A8', // ID 6 - Розовый
      '#00B894', // ID 7 - Зеленый
      '#FDCB6E', // ID 8 - Желтый
      '#E17055', // ID 9 - Коралловый
      '#546DE5'  // ID 10 - Синий
  ];
  
  return colors[(id - 1) % colors.length];
}
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (!id || !action) return;

  try {
    let cart = getCart();
    let hasChanges = false;

    if (action === "remove") {
      cart = cart.filter(i => i._id !== id);
      hasChanges = true;
    } else if (action === "increase" || action === "decrease") {
      cart = cart.map(i => {
        if (i._id !== id) return i;
        
        let quantity = Number(i.quantity) || 1;
        quantity = action === "increase" ? quantity + 1 : Math.max(1, quantity - 1);
        
        hasChanges = true;
        return { ...i, quantity };
      });
    }

    if (hasChanges) {
      // Сначала сохраняем локально и обновляем UI
      setCart(cart);
      renderBasket();
      updateCounter();
      saveCartToServer(cart).catch(error => {
        console.error('Ошибка синхронизации:', error);
        showNotification('Ошибка синхронизации с сервером', 'error');
      });
    }

  } catch (error) {
    console.error(`Ошибка при ${action}:`, error);
    showToasts('Произошла ошибка', 'error');
  }
});

window.addEventListener("cart:updated", () => {
  saveCartToServer(cart);
  renderBasket();
});

document.addEventListener("DOMContentLoaded", () => {
  
  renderBasket();
  updateCounter();
});
document.addEventListener('DOMContentLoaded', function() {
    const editIcon = document.querySelector('.edit-address-icon');
    const addressElement = document.getElementById('address');
    
    if (editIcon && addressElement) {
        editIcon.style.cursor = 'pointer';
        editIcon.title = 'Редактировать адрес';
        
        editIcon.addEventListener('click', function() {
            const newAddress = prompt('Введите новый адрес доставки:', addressElement.textContent);
            
            if (newAddress !== null) { // Если не нажали "Отмена"
                const trimmedAddress = newAddress.trim();
                addressElement.textContent = trimmedAddress || 'Адрес не указан';
                localStorage.setItem('userAddress', trimmedAddress);
            }
        });

        const savedAddress = localStorage.getItem('userAddress');
        if (savedAddress) {
            addressElement.textContent = savedAddress;
        }
    }
});
document.addEventListener("click", (e) => {
  const button = e.target.closest(".go-ctg");
  if (!button) return;

  window.location.href = "catalog.html";
});
setInterval(retryFailedSync, 30000);