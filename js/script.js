import { addToCart, updateCounter, uid, showSizeModal } from "./modules/cart/cart-utils.js";

const API_URL = "https://backendalcraft-production.up.railway.app/t-shirts/get";

class ProductFilter {
    constructor() {
        this.tShirts = [];
        this.filteredTShirts = [];
        this.filters = {
            price: { min: null, max: null },
            sizes: [],
            colors: [],
            cuts: [],
            collections: []
        };
    }

    async fetchTShirts() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const responseData = await res.json();
            
            this.tShirts = responseData.data || [];
            this.filteredTShirts = [...this.tShirts];
            
            console.log("Данные загружены:", this.tShirts);
            
            this.initFilters();
            this.renderCatalog();
            
        } catch (e) {
            console.error("Ошибка:", e);
            document.querySelectorAll(".loading").forEach(el => (el.textContent = "Ошибка загрузки"));
        }
    }

    renderCatalog() {
        document.querySelectorAll(".loading").forEach(l => (l.style.display = "none"));
        const containers = document.querySelectorAll(".t-shirts-container");
        
        if (!this.filteredTShirts.length) {
            containers.forEach(c => (c.innerHTML = "<p>Нет футболок</p>"));
            return;
        }
        
        const html = this.filteredTShirts.map(t => this.cardHTML(t)).join("");
        containers.forEach(c => (c.innerHTML = html));
    }

    cardHTML(tShirt) {
        const product = tShirt || {};
        const collectionId = product.collectionID || 1;
        const color = this.getCollectionColor(collectionId);
        
        return `
            <div class="t-shirt-card" data-product='${JSON.stringify(product)}'>
                <div class="info">
                    <p class="t-shirt-collection" style="background-color: ${color}; font-weight: bold;">
                        ${product.nameCollection || "—"}
                    </p>
                    ${product.newShirt ? `<p class="t-shirt-new">${product.newShirt}</p>` : ''}
                </div>
                ${product.picturePath?.length
                    ? `<img class="t-shirt-image" src="${product.picturePath[0]}" alt="${product.tShirtName}">`
                    : `<div class="no-image">Нет фото</div>`}
                <p class="t-shirt-name">${product.tShirtName || "Без названия"}</p>
                <div class="price">
                    ${product.discount
                        ? `
                           <span class="new-price">${Math.round((product.price || 0) * (1 - product.discount/100))} ₽</span>`
                        : ``}
                </div>
                <button class="buy">В корзину</button>
                <button class="buy-one-click">Купить</button>
            </div>
        `;
    }

    getCollectionColor(collectionId) {
        const id = parseInt(collectionId) || 1;
        const colors = [
            '#FF6B6B',
            '#4ECDC4',   
            '#45B7D1', 
            '#F9A826', 
            '#6C5CE7', 
            '#FD79A8', 
            '#00B894', 
            '#FDCB6E', 
            '#E17055', 
            '#546DE5'  
        ];
        
        return colors[(id - 1) % colors.length];
    }

    initFilters() {
        const container = document.querySelector(".filters");
        if (!container) return;

        this.initAccordion(container);
        this.bindFilterEvents();

        document.getElementById('see')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('notsee')?.addEventListener('click', () => this.resetFilters());
    }

    initAccordion(container) {
        const closeFilter = (filter) => {
            const body = filter.querySelector('.filter-body');
            filter.classList.remove('active');

            if (getComputedStyle(body).maxHeight === 'none') {
                body.style.maxHeight = body.scrollHeight + 'px';
                body.offsetHeight;
            }

            body.style.opacity = '0';
            body.style.paddingTop = '0';
            body.style.paddingBottom = '0';
            body.style.maxHeight = '0px';
        };

        const openFilter = (filter) => {
            const arrow = filter.querySelector('.filter-arrow');
            const body = filter.querySelector('.filter-body');
            filter.classList.add('active');
            
            if (getComputedStyle(body).maxHeight === 'none') {
                body.style.maxHeight = body.scrollHeight + 'px';
            }

            body.style.opacity = '1';
            body.style.paddingTop = '12px';
            body.style.paddingBottom = '12px';

            arrow?.classList.add("rotated");
            body.style.maxHeight = body.scrollHeight + 'px';
            body.addEventListener('transitionend', function onEnd(ev) {
                if (ev.propertyName !== 'max-height') return;
                body.style.maxHeight = 'none';
                body.removeEventListener('transitionend', onEnd);
            });
        };

        container.addEventListener("click", (e) => {
            const header = e.target.closest(".filter-header");
            if (!header || !container.contains(header)) return;

            const filter = header.closest(".filter");
            if (!filter) return;

            const isOpen = filter.classList.contains("active");

            container.querySelectorAll(".filter.active").forEach(f => {
                if (f !== filter) closeFilter(f);
            });

            if (isOpen) {
                closeFilter(filter);
            } else {
                openFilter(filter);
            }
        });

        let resizeTO;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTO);
            resizeTO = setTimeout(() => {
                container.querySelectorAll(".filter.active .filter-body").forEach(body => {
                    body.style.maxHeight = body.scrollHeight + "px";
                });
            }, 150);
        });
    }

    bindFilterEvents() {
        const priceInputs = document.querySelectorAll('.pit');
        priceInputs[0]?.addEventListener('input', (e) => {
            this.filters.price.min = e.target.value ? parseInt(e.target.value) : null;
            this.applyFilters();
        });
        priceInputs[1]?.addEventListener('input', (e) => {
            this.filters.price.max = e.target.value ? parseInt(e.target.value) : null;
            this.applyFilters();
        });

        const sizeCheckboxes = document.querySelectorAll('.filter:nth-child(2) .check');
        sizeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const size = e.target.parentElement.textContent.trim();
                if (e.target.checked) {
                    this.filters.sizes.push(size);
                } else {
                    this.filters.sizes = this.filters.sizes.filter(s => s !== size);
                }
                this.applyFilters();
            });
        });

        const colorButtons = document.querySelectorAll('#colors button');
        colorButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const color = this.getColorByIndex(index);
                const indexInArray = this.filters.colors.indexOf(color);
                
                if (indexInArray === -1) {
                    this.filters.colors.push(color);
                    button.classList.add('active');
                } else {
                    this.filters.colors.splice(indexInArray, 1);
                    button.classList.remove('active');
                }
                this.applyFilters();
            });
        });

        const cutCheckboxes = document.querySelectorAll('.filter:nth-child(4) .check');
        cutCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const cut = e.target.parentElement.textContent.trim();
                if (e.target.checked) {
                    this.filters.cuts.push(cut);
                } else {
                    this.filters.cuts = this.filters.cuts.filter(c => c !== cut);
                }
                this.applyFilters();
            });
        });

        const printButtons = document.querySelectorAll('#prints button');
        printButtons.forEach(button => {
            button.addEventListener('click', () => {
                const collection = button.textContent.trim();
                const indexInArray = this.filters.collections.indexOf(collection);
                
                if (indexInArray === -1) {
                    this.filters.collections.push(collection);
                    button.classList.add('active');
                } else {
                    this.filters.collections.splice(indexInArray, 1);
                    button.classList.remove('active');
                }
                this.applyFilters();
            });
        });
    }

    getColorByIndex(index) {
        const colors = ['black', 'white', 'red', 'blue', 'green'];
        return colors[index] || 'unknown';
    }

    applyFilters() {
        if (!this.tShirts.length) return;
        
        this.filteredTShirts = this.tShirts.filter(product => {
            if (this.filters.price.min !== null && (product.price || 0) < this.filters.price.min) return false;
            if (this.filters.price.max !== null && (Math.round((product.price || 0) * (1 - product.discount/100))) > this.filters.price.max) return false;

            if (this.filters.sizes.length > 0 && product.size) {
                const hasMatchingSize = this.filters.sizes.some(size => 
                    product.sizes.includes(size)
                );
                if (!hasMatchingSize) return false;
            }

            if (this.filters.colors.length > 0 && product.color) {
                if (!this.filters.colors.includes(product.color.toLowerCase())) return false;
            }

            if (this.filters.cuts.length > 0 && product.cut) {
                if (!this.filters.cuts.includes(product.cut)) return false;
            }

            if (this.filters.collections.length > 0 && product.nameCollection) {
                if (!this.filters.collections.includes(product.nameCollection)) return false;
            }

            return true;
        });

        this.renderCatalog();
    }

    resetFilters() {
        this.filters = {
            price: { min: null, max: null },
            sizes: [],
            colors: [],
            cuts: [],
            collections: []
        };

        document.querySelectorAll('.pit').forEach(input => input.value = '');
        document.querySelectorAll('.check').forEach(checkbox => checkbox.checked = false);
        document.querySelectorAll('#colors button, #prints button').forEach(btn => 
            btn.classList.remove('active')
        );

        this.filteredTShirts = [...this.tShirts];
        this.renderCatalog();
    }
}

function initCartHandlers() {
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".buy");
        if (!btn) return;
        const card = btn.closest(".t-shirt-card");
        if (!card) return;

        const product = JSON.parse(card.dataset.product || "{}");
        product._id = product._id || uid();
        product.qty = product.qty || 1;

        e.preventDefault();

        try {
            // Получаем размеры из данных продукта или используем стандартные
            const sizes = product.sizes || ['S', 'M', 'L', 'XL'];
            
            // Показываем модалку и ждем выбора размера
            const selectedSize = await showSizeModal(sizes);
            
            // Добавляем размер к продукту
            product.size = selectedSize;
            
            // Отправляем в корзину
            addToCart(product);
            updateCounter();
            showToast(`Товар добавлен в корзину (размер: ${selectedSize})`, "success");
            
        } catch (error) {
            // Пользователь закрыл модалку
            console.log("Добавление в корзину отменено");
        }
    });
}
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
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let productFilter;

document.addEventListener("DOMContentLoaded", () => {
    updateCounter();
    productFilter = new ProductFilter();
    productFilter.fetchTShirts();
    initCartHandlers();
    
    // Стили для анимаций
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
    `;
    document.head.appendChild(style);
});