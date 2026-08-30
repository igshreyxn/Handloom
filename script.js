// ---------- Sample/fallback products, shown until Firestore data loads ----------
let PRODUCTS = [
  {
    id: "1",
    name: "Handwoven Silk Saree",
    price: 4500,
    category: "sarees",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800"
  },
  {
    id: "2",
    name: "Printed Silk Saree",
    price: 1800,
    category: "sarees",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800"
  },
  {
    id: "3",
    name: "Ethnic Wear Ensemble",
    price: 2200,
    category: "womens-clothing",
    image: "https://images.unsplash.com/photo-1611574557783-9a50bb34e9f5?q=80&w=800"
  },
  {
    id: "4",
    name: "Hand-Painted Terracotta Horses",
    price: 950,
    category: "handicrafts",
    image: "https://images.unsplash.com/photo-1674530187072-f788b7282f17?q=80&w=800"
  },
  {
    id: "5",
    name: "Terracotta Pottery",
    price: 1200,
    category: "handicrafts",
    image: "https://images.unsplash.com/photo-1524497440-4da55062cb4a?q=80&w=800"
  },
  {
    id: "6",
    name: "Gifting Box: Saree + Handicraft",
    price: 5200,
    category: "gifting",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800"
  }
];

// ---------- Cart (stored in localStorage) ----------
const CART_KEY = "saree-shop-cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  const cart = getCart();
  const existing = cart.find((i) => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.id !== productId);
  saveCart(cart);
  if (document.getElementById("cart-page-content")) renderCartPage();
}

function updateQty(productId, qty) {
  qty = Math.max(1, parseInt(qty, 10) || 1);
  const cart = getCart().map((i) =>
    i.id === productId ? { ...i, qty } : i
  );
  saveCart(cart);
  if (document.getElementById("cart-page-content")) renderCartPage();
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function formatINR(amount) {
  return "\u20b9" + amount.toLocaleString("en-IN");
}

// ---------- Render a product grid into a container ----------
function renderProductGrid(containerId, category) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const list = category ? PRODUCTS.filter((p) => p.category === category) : PRODUCTS;

  el.innerHTML = list
    .map(
      (p, i) => `
    <div class="product-card fade-in" style="transition-delay:${i * 80}ms">
      <div class="product-card-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-row">
          <span class="product-price">${formatINR(p.price)}</span>
          <button class="add-to-cart-link" onclick="addToCart('${p.id}')">Add to Cart</button>
        </div>
      </div>
    </div>`
    )
    .join("");

  observeFadeIns();
}

// ---------- Re-render every product grid currently on the page ----------
// Any container with [data-product-grid] gets re-rendered using its
// data-category (or all products, if no category is set). Called once when
// the page first loads, and again whenever Firebase pushes new product data.
function renderAllGrids() {
  document.querySelectorAll("[data-product-grid]").forEach((el) => {
    renderProductGrid(el.id, el.dataset.category || null);
  });
}

// ---------- Called by firebase-sync.js when live product data arrives ----------
window.setProducts = function (products) {
  PRODUCTS = products;
  renderAllGrids();
};

// ---------- Cart page rendering ----------
function renderCartPage() {
  const container = document.getElementById("cart-page-content");
  if (!container) return;
  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 80px 0;">
        <h1 class="heading" style="font-size:30px;">Your cart is empty</h1>
        <a href="index.html" class="btn btn-primary" style="margin-top:24px;">Continue Shopping</a>
      </div>`;
    return;
  }

  const itemsHtml = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-image"><img src="${item.image}" alt="${item.name}" /></div>
      <div style="flex:1;">
        <div class="product-card-name">${item.name}</div>
        <div class="product-price" style="margin-top:4px;">${formatINR(item.price)}</div>
        <div style="margin-top:8px; display:flex; align-items:center; gap:10px;">
          <input type="number" min="1" class="cart-qty" value="${item.qty}"
            onchange="updateQty('${item.id}', this.value)" />
          <button class="remove-link" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    </div>`
    )
    .join("");

  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0);

  container.innerHTML = `
    <h1 class="heading" style="font-size:30px;">Your Cart</h1>
    <div style="margin-top:32px;">${itemsHtml}</div>
    <div class="cart-total-row">
      <span class="heading">Total</span>
      <span class="heading" style="color:var(--maroon);">${formatINR(total)}</span>
    </div>
    <button class="btn btn-primary" style="width:100%; margin-top:24px;" onclick="alert('TODO: connect Razorpay/Stripe checkout here')">
      Proceed to Checkout
    </button>`;
}

// ---------- Header: shrink on scroll + mobile menu ----------
function setupHeader() {
  const header = document.getElementById("site-header");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 24);
    });
  }

  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
    });
  }
}

// ---------- Fade-in on scroll (IntersectionObserver) ----------
function observeFadeIns() {
  const els = document.querySelectorAll(".fade-in:not(.observed)");
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => {
    el.classList.add("observed");
    observer.observe(el);
  });
}

// ---------- Craftsmanship "signature moment" section ----------
function setupStorySection() {
  const section = document.getElementById("story-section");
  if (!section) return;
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add("active");
          obs.unobserve(section);
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(section);
}

// ---------- Contact form (front-end only for now) ----------
function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // TODO: connect to an email service (Formspree, etc.) so this reaches your inbox
    document.getElementById("contact-success").style.display = "block";
    form.reset();
  });
}

// ---------- Run on every page ----------
document.addEventListener("DOMContentLoaded", () => {
  setupHeader();
  observeFadeIns();
  setupStorySection();
  setupContactForm();
  updateCartBadge();
  if (document.getElementById("cart-page-content")) renderCartPage();
});
