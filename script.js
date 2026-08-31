// ---------- Shown for products added without a photo ----------
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="100%" height="100%" fill="#f0ece4"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#a89f92" text-anchor="middle" dy=".3em">No Image</text></svg>`
  );

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
        <img src="${p.image || PLACEHOLDER_IMAGE}" alt="${p.name}" loading="lazy" />
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
    <form id="checkout-form" style="margin-top:28px;">
      <h2 class="heading" style="font-size:20px; margin-bottom:14px;">Delivery Details</h2>
      <input type="text" id="checkout-name" class="form-field" placeholder="Your name" required />
      <input type="tel" id="checkout-phone" class="form-field" placeholder="Phone number" required />
      <textarea id="checkout-address" class="form-field" placeholder="Delivery address" rows="3" required></textarea>
      <button type="submit" class="btn btn-primary" style="width:100%;" id="checkout-submit-btn">Place Order</button>
      <p id="checkout-status" class="status-msg" style="margin-top:10px; font-size:13px;"></p>
      <p style="margin-top:10px; font-size:12px; color:rgba(43,38,34,0.55);">
        We'll contact you on WhatsApp or phone to confirm your order and delivery — no online payment yet.
      </p>
    </form>
  `;

  attachCheckoutFormHandler();
}

function attachCheckoutFormHandler() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("checkout-submit-btn");
    const status = document.getElementById("checkout-status");
    const name = document.getElementById("checkout-name").value.trim();
    const phone = document.getElementById("checkout-phone").value.trim();
    const address = document.getElementById("checkout-address").value.trim();
    const cart = getCart();
    const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0);

    btn.disabled = true;
    status.className = "status-msg";
    status.style.color = "";
    status.textContent = "Placing your order…";

    try {
      if (typeof window.submitOrder !== "function") {
        throw new Error("Order system isn't ready yet — please try again in a moment.");
      }
      await window.submitOrder({
        items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total,
        customerName: name,
        phone,
        address
      });

      localStorage.removeItem(CART_KEY);
      updateCartBadge();

      document.getElementById("cart-page-content").innerHTML = `
        <div style="text-align:center; padding: 80px 0;">
          <h1 class="heading" style="font-size:30px;">Thank you!</h1>
          <p style="margin-top:12px; font-size:14px; color:rgba(43,38,34,0.7);">
            Your order has been placed. We'll reach out on WhatsApp or phone shortly to confirm.
          </p>
          <a href="index.html" class="btn btn-primary" style="margin-top:24px;">Continue Shopping</a>
        </div>`;
    } catch (err) {
      status.style.color = "#b3261e";
      status.textContent = "Something went wrong — please try again, or message us on WhatsApp.";
      btn.disabled = false;
    }
  });
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

// ---------- Contact form ----------
function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const successMsg = document.getElementById("contact-success");
    const errorMsg = document.getElementById("contact-error");
    const inputs = form.querySelectorAll("input, textarea");
    const [nameField, phoneField, emailField, messageField] = inputs;

    if (submitBtn) submitBtn.disabled = true;
    if (errorMsg) errorMsg.style.display = "none";
    if (successMsg) successMsg.style.display = "none";

    try {
      if (typeof window.submitContactMessage !== "function") {
        throw new Error("Message system isn't ready yet.");
      }
      await window.submitContactMessage({
        name: nameField.value.trim(),
        phone: phoneField.value.trim(),
        email: emailField.value.trim(),
        message: messageField.value.trim()
      });
      if (successMsg) successMsg.style.display = "block";
      form.reset();
    } catch (err) {
      if (errorMsg) errorMsg.style.display = "block";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
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
