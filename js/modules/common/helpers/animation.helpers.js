const basketLink = document.querySelector(".basket-icon");
const cartIcon = document.getElementById("cart-icon");
const count = document.getElementById("count");
let cartCount = 0;
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

document.addEventListener("click", (e) => {
  

  const product = button.closest(".t-shirt-card");
  const img = product.querySelector(".t-shirt-image");
  const flyImg = img.cloneNode(true);
  const rect = img.getBoundingClientRect();
  flyImg.classList.add("fly-img");
  flyImg.style.left = rect.left + "px";
  flyImg.style.top = rect.top + "px";
  flyImg.style.width = rect.width + "px";
  document.body.appendChild(flyImg);

  const cartRect = cartIcon.getBoundingClientRect();
  requestAnimationFrame(() => {
    flyImg.style.left = cartRect.left + "px";
    flyImg.style.top = cartRect.top + "px";
    flyImg.style.width = "30px";
    flyImg.style.opacity = "0.5";
  });

  flyImg.addEventListener("transitionend", () => {
    flyImg.remove();
    cartCount++;
    count.textContent = cartCount;
  });

  basketLink.classList.remove("shake");
  void basketLink.offsetWidth;
  basketLink.classList.add("shake");
});
const buttons = switchBlock.querySelectorAll(".tab-btn");


buttons.forEach(btn => {
  btn.addEventListener("click", () => {

    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (btn.dataset.tab === "register") {
      switchBlock.classList.add("register-active");
    } else {
      switchBlock.classList.remove("register-active");
    }
  });
});
const switchBlock = document.querySelector(".butns");
