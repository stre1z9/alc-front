import { addToCart, updateCounter, uid, setupBuyButtons, showSizeModal } from "./modules/cart/cart-utils.js";

const API_URL = "https://backendalcraft-production.up.railway.app";

async function fetchTShirts() {
  try {
    const res = await fetch('https://backendalcraft-production.up.railway.app/t-shirts/get');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const responseData = await res.json();
    
    console.log("Полный ответ сервера:", responseData);
    
    const tShirts = responseData.data;
    
    console.log("Массив футболок:", tShirts);
    console.log("Количество:", tShirts.length);
    
    renderCarousels(tShirts);
  } catch (e) {
    console.error("Ошибка:", e);
    document.querySelectorAll(".loading").forEach(el => (el.textContent = "Ошибка загрузки"));
  }
}

// Функция для получения цвета коллекции по ID
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

function cardHTML(tShirt) {
  const product = tShirt || {};
  const collectionId = product.collectionID || 1;
  const color = getCollectionColor(collectionId);
  
  return `
    <div class="t-shirt-card" data-product='${JSON.stringify(product)}'>
      <div class="info">
        <p class="t-shirt-collection" style="background-color: ${color}; font-weight: bold;">
          ${product.nameCollection || "—"}
        </p>
        ${product.newShirt ? `<p class="t-shirt-new">${product.newShirt}</p>` : ''}
      </div>
      ${product.picturePath && product.picturePath.length
        ? `<img class="t-shirt-image" src="${product.picturePath[0]}" alt="${product.tShirtName || 'Футболка'}">`
        : `<div class="no-image">Нет фото</div>`}
      <p class="t-shirt-name">${product.tShirtName || "Без названия"}</p>
      <div class="price">
        ${product.discount && product.discount > 0
          ? `<span class="regular-price">${(product.price || 0).toFixed(0)} ₽</span>
             <span class="new-price">${Math.round((product.price || 0) * (1 - product.discount/100))} ₽</span>`
          : ``}
      </div>
      <button class="buy">В корзину</button>
      <button class="buy-one-click">Купить</button>
    </div>
  `;
}

function getItemsPerView() {
  const width = window.innerWidth;
  if (width < 480) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  return 3;
}

function createNavigationDots(tShirts) {
  const dotsContainers = document.querySelectorAll('.tcont-btn');
  if (!dotsContainers.length) return;

  dotsContainers.forEach((navigationDots, containerIndex) => {
    navigationDots.innerHTML = '';

    const itemsPerView = getItemsPerView();
    const slideCount = Math.ceil(tShirts.length / itemsPerView);
    
    for (let i = 0; i < slideCount; i++) {
      const dot = document.createElement('button');
      dot.className = 'btn-go-go';
      dot.dataset.index = i;
      dot.dataset.container = containerIndex;
      if (i === 0) dot.classList.add('active');
      
      dot.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        const containerIndex = parseInt(this.dataset.container);
        goToSlide(index, containerIndex);
      });
      
      navigationDots.appendChild(dot);
    }
  });
}

function goToSlide(index, containerIndex = 0) {
  const containers = document.querySelectorAll('.t-shirts-container');
  const track = containers[containerIndex];
  if (!track) return;
  
  const cards = track.querySelectorAll('.t-shirt-card');
  if (!cards.length) return;
  
  const itemsPerView = getItemsPerView();
  const maxIndex = Math.max(0, cards.length - itemsPerView);
  const safeIndex = Math.max(0, Math.min(index, maxIndex));
  
  const cardWidth = 100 / itemsPerView;
  const translateX = -safeIndex * cardWidth;
  
  track.style.transform = `translateX(${translateX}%)`;
  updateActiveDot(safeIndex, containerIndex);
  updateNavigationState(safeIndex, maxIndex, containerIndex);
}

function updateActiveDot(index, containerIndex = 0) {
  const dotsContainers = document.querySelectorAll('.tcont-btn');
  const dots = dotsContainers[containerIndex]?.querySelectorAll('.btn-go-go');
  if (!dots) return;
  
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function updateNavigationState(currentIndex, maxIndex, containerIndex = 0) {
  const containers = document.querySelectorAll('.tcont');
  const tcont = containers[containerIndex];
  if (!tcont) return;
  
  const prevBtn = tcont.querySelector('.go-no.prev');
  const nextBtn = tcont.querySelector('.go-no.next');
  
  if (prevBtn) {
    prevBtn.disabled = currentIndex === 0;
    prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentIndex >= maxIndex;
    nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
  }
}

function renderCarousels(tShirts) {
  console.log("Данные для рендеринга:", tShirts);
  
  if (!tShirts || tShirts.length === 0) {
    document.querySelectorAll(".loading").forEach(el => {
      el.textContent = "Нет товаров";
    });
    return;
  }
  
  document.querySelectorAll(".loading").forEach(el => {
    el.style.display = "none";
  });

  document.querySelectorAll(".tcont").forEach(tcont => {
    const track = tcont.querySelector(".t-shirts-container");
    if (!track) return;

    track.innerHTML = tShirts.map(cardHTML).join("");
  });

  createNavigationDots(tShirts);
  initCarousels(tShirts);
}

function initCarousels(tShirts) {
  const containers = document.querySelectorAll('.tcont');
  
  containers.forEach((tcont, containerIndex) => {
    const track = tcont.querySelector(".t-shirts-container");
    const prevBtn = tcont.querySelector(".go-no.prev");
    const nextBtn = tcont.querySelector(".go-no.next");
    
    if (!track || !prevBtn || !nextBtn) return;

    const cards = track.querySelectorAll(".t-shirt-card");
    if (cards.length === 0) return;

    let currentIndex = 0;
    let itemsPerView = getItemsPerView();

    function updateCarousel() {
      const maxIndex = Math.max(0, cards.length - itemsPerView);
      const cardWidth = 100 / itemsPerView;
      const translateX = -currentIndex * cardWidth;
      
      track.style.transform = `translateX(${translateX}%)`;
      updateButtons();
      updateActiveDot(currentIndex, containerIndex);
    }

    function updateButtons() {
      const maxIndex = Math.max(0, cards.length - itemsPerView);
      prevBtn.disabled = currentIndex === 0;
      prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
      nextBtn.disabled = currentIndex >= maxIndex;
      nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
    }

    nextBtn.addEventListener('click', () => {
      const maxIndex = Math.max(0, cards.length - itemsPerView);
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel();
      }
    });

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });

    tcont._currentIndex = currentIndex;
    tcont._updateCarousel = updateCarousel;

    track.style.display = 'flex';
    track.style.transition = 'transform 0.3s ease';
    updateCarousel();
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

window.addEventListener('resize', debounce(() => {
  const itemsPerView = getItemsPerView();
  const containers = document.querySelectorAll('.tcont');
  
  containers.forEach((tcont, containerIndex) => {
    const track = tcont.querySelector(".t-shirts-container");
    const cards = track?.querySelectorAll(".t-shirt-card");
    
    if (!track || !cards.length) return;

    const maxIndex = Math.max(0, cards.length - itemsPerView);
    if (tcont._currentIndex > maxIndex) {
      tcont._currentIndex = maxIndex;
    }

    createNavigationDots(Array.from(cards).map(card => 
      JSON.parse(card.dataset.product || "{}")
    ));

    if (tcont._updateCarousel) {
      tcont._updateCarousel();
    }
  });
}, 250));

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#4caf50" : "#f44336"};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      animation: slideIn 1.5s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
      toast.style.animation = "slideOut 1.5s ease";
      setTimeout(() => toast.remove(), 1000);
  }, 10000);
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".buy");
  if (!btn) return;
  const card = btn.closest(".t-shirt-card");
  if (!card) return;

  const product = JSON.parse(card.dataset.product || "{}");
  product._id = product._id || uid();
  product.quantity = product.quantity || 1;

  e.preventDefault();

  try {
    const sizes = product.sizes || [ 'XS' , 'S', 'M', 'L', 'XL' , '2XL' , '3XL' , '4XL' ];

    const selectedSize = await showSizeModal(sizes);

    product.size = selectedSize;

    addToCart(product);
    updateCounter();
    showToast(`Товар добавлен в корзину (размер: ${selectedSize})`, "success");
    
  } catch (error) {
    console.log("Добавление в корзину отменено");
  }
});



document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = `
      @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
      }
      /* Стили для карусели */
      .t-shirts-container {
        display: flex;
        transition: transform 0.3s ease;
      }
      
      
      .btn-go-go.active {
        background: #007bff !important;
      }
  `;
  document.head.appendChild(style);
  
  updateCounter();
  fetchTShirts();
});