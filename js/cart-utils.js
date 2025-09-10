
const API_URL = "http://localhost:3000";

export function getCurrentUser() {
  return {
    userId: localStorage.getItem("userId") || "guest",
    token: localStorage.getItem("token") || null
  };
}

export const getCart = () => {
  const { userId } = getCurrentUser();
  return JSON.parse(localStorage.getItem(`cart_${userId}`) || "[]");
};

export const setCart = (cart) => {
  const { userId } = getCurrentUser();
  localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
};

export function formatRub(n) {
  return new Intl.NumberFormat("ru-RU").format(Number(n) || 0) + " ₽";
}

export function updateCounter() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (Number(i.qty) || 1), 0);

  ["count", "counter", "quant"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = total;
  });
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

export function addToCart(product) {
  product.qty = Math.max(1, Number(product.qty) || 1);
  product.price = Number(product.price) || 0;

  let cart = getCart();
  const keyNew = buildKey(product);
  const existing = cart.find(item => buildKey(item) === keyNew);

  if (existing) {
    existing.qty = (Number(existing.qty) || 1) + product.qty;
  } else {
    if (!product._id) product._id = uid();
    cart.push(product);
  }

  setCart(cart);
  updateCounter();

  window.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart } }));


  saveCartToServer(cart).catch(console.error);
}

export async function fetchCartFromServer() {
  const { userId, token } = getCurrentUser();
  if (!token || userId === "guest") return getCart();

  try {
    const res = await fetch(`${API_URL}/cart/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Ошибка загрузки корзины: ${res.status}`);
    const data = await res.json();

    setCart(data);
    updateCounter();
    return data;
  } catch (err) {
    console.error("Не удалось загрузить корзину с сервера:", err);
    return getCart();
  }
}

export async function saveCartToServer(cart) {
  const { userId, token } = getCurrentUser();
  if (!token || userId === "guest") return;

  try {
    const res = await fetch(`${API_URL}/cart/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(cart)
    });
    if (!res.ok) throw new Error(`Ошибка сохранения корзины: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Не удалось сохранить корзину на сервер:", err);
  }
}
