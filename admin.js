import { auth, db } from "./firebase-init.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ---------- Cloudinary (free image hosting, no backend needed) ----------
const CLOUDINARY_CLOUD_NAME = "sjycf8tg";
const CLOUDINARY_UPLOAD_PRESET = "resham-roots-admin";

async function uploadImageToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(url, { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error("Image upload failed. Check your Cloudinary preset settings.");
  }
  const data = await response.json();
  return data.secure_url;
}

// ---------- Starter products (mirrors script.js's fallback sample data) ----------
const STARTER_PRODUCTS = [
  { name: "Handwoven Silk Saree", price: 4500, category: "sarees", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800" },
  { name: "Printed Silk Saree", price: 1800, category: "sarees", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800" },
  { name: "Ethnic Wear Ensemble", price: 2200, category: "womens-clothing", image: "https://images.unsplash.com/photo-1611574557783-9a50bb34e9f5?q=80&w=800" },
  { name: "Hand-Painted Terracotta Horses", price: 950, category: "handicrafts", image: "https://images.unsplash.com/photo-1674530187072-f788b7282f17?q=80&w=800" },
  { name: "Terracotta Pottery", price: 1200, category: "handicrafts", image: "https://images.unsplash.com/photo-1524497440-4da55062cb4a?q=80&w=800" },
  { name: "Gifting Box: Saree + Handicraft", price: 5200, category: "gifting", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800" }
];

// =====================================================================
// DOM ELEMENTS (all grabbed up front)
// =====================================================================
const loginView = document.getElementById("login-view");
const adminView = document.getElementById("admin-view");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const logoutBtn = document.getElementById("logout-btn");

const tabs = document.querySelectorAll(".admin-tab");
const panels = {
  products: document.getElementById("panel-products"),
  orders: document.getElementById("panel-orders"),
  messages: document.getElementById("panel-messages")
};

const productForm = document.getElementById("product-form");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const formStatus = document.getElementById("form-status");
const editingIdField = document.getElementById("editing-id");
const nameField = document.getElementById("product-name");
const priceField = document.getElementById("product-price");
const categoryField = document.getElementById("product-category");
const imageField = document.getElementById("product-image");
const productsTableBody = document.getElementById("products-table-body");
const seedBtn = document.getElementById("seed-products-btn");

const ordersTableBody = document.getElementById("orders-table-body");
const messagesTableBody = document.getElementById("messages-table-body");

// =====================================================================
// STATE
// =====================================================================
let unsubscribeProducts = null;
let unsubscribeOrders = null;
let unsubscribeMessages = null;
let currentProducts = [];
let currentOrders = [];
let currentMessages = [];

// =====================================================================
// SHARED HELPERS
// =====================================================================
function formatTimestamp(ts) {
  if (!ts || !ts.toDate) return "—";
  return ts.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// =====================================================================
// PRODUCTS
// =====================================================================
function startListeningToProducts() {
  unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
    currentProducts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderProductsTable();
  });
}

function renderProductsTable() {
  if (currentProducts.length === 0) {
    productsTableBody.innerHTML =
      '<tr><td colspan="5" style="padding:20px 8px; color:rgba(43,38,34,0.5);">No products yet — add your first one above.</td></tr>';
    return;
  }
  productsTableBody.innerHTML = currentProducts
    .map(
      (p) => `
    <tr>
      <td><img class="admin-thumb" src="${p.image || ""}" alt="${p.name}" onerror="this.style.visibility='hidden'" /></td>
      <td>${p.name}</td>
      <td>₹${Number(p.price).toLocaleString("en-IN")}</td>
      <td>${p.category}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-secondary small-btn" data-edit="${p.id}">Edit</button>
        <button class="btn small-btn" style="background:#b3261e; color:#fff;" data-delete="${p.id}">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  productsTableBody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => startEditProduct(btn.dataset.edit));
  });
  productsTableBody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteProduct(btn.dataset.delete));
  });
}

function startEditProduct(id) {
  const product = currentProducts.find((p) => p.id === id);
  if (!product) return;
  editingIdField.value = id;
  nameField.value = product.name;
  priceField.value = product.price;
  categoryField.value = product.category;
  imageField.value = "";
  formTitle.textContent = "Edit Product";
  submitBtn.textContent = "Save Changes";
  cancelEditBtn.classList.remove("hidden");
  formStatus.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetProductForm() {
  productForm.reset();
  editingIdField.value = "";
  formTitle.textContent = "Add a Product";
  submitBtn.textContent = "Add Product";
  cancelEditBtn.classList.add("hidden");
}

async function handleDeleteProduct(id) {
  const product = currentProducts.find((p) => p.id === id);
  if (!product) return;
  if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (err) {
    alert("Couldn't delete product: " + err.message);
  }
}

// =====================================================================
// ORDERS
// =====================================================================
function startListeningToOrders() {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  unsubscribeOrders = onSnapshot(q, (snapshot) => {
    currentOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderOrdersTable();
  });
}

function renderOrdersTable() {
  if (currentOrders.length === 0) {
    ordersTableBody.innerHTML =
      '<tr><td colspan="5" style="padding:20px 8px; color:rgba(43,38,34,0.5);">No orders yet.</td></tr>';
    return;
  }
  ordersTableBody.innerHTML = currentOrders
    .map((o) => {
      const itemsList = (o.items || [])
        .map((i) => `<li>${i.name} × ${i.qty}</li>`)
        .join("");
      const status = o.status || "new";
      return `
      <tr>
        <td style="white-space:nowrap;">${formatTimestamp(o.createdAt)}</td>
        <td>
          <div>${o.customerName || "—"}</div>
          <div style="font-size:12px; color:rgba(43,38,34,0.6);">${o.phone || ""}</div>
          <div style="font-size:12px; color:rgba(43,38,34,0.6); max-width:180px;">${o.address || ""}</div>
        </td>
        <td><ul class="order-items-list">${itemsList}</ul></td>
        <td>₹${Number(o.total || 0).toLocaleString("en-IN")}</td>
        <td>
          <select class="form-field" data-order-status="${o.id}" style="font-size:12px; padding:6px 8px;">
            <option value="new" ${status === "new" ? "selected" : ""}>New</option>
            <option value="confirmed" ${status === "confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="delivered" ${status === "delivered" ? "selected" : ""}>Delivered</option>
          </select>
        </td>
      </tr>`;
    })
    .join("");

  ordersTableBody.querySelectorAll("[data-order-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      try {
        await updateDoc(doc(db, "orders", select.dataset.orderStatus), { status: select.value });
      } catch (err) {
        alert("Couldn't update order status: " + err.message);
      }
    });
  });
}

// =====================================================================
// MESSAGES
// =====================================================================
function startListeningToMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    currentMessages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderMessagesTable();
  });
}

function renderMessagesTable() {
  if (currentMessages.length === 0) {
    messagesTableBody.innerHTML =
      '<tr><td colspan="4" style="padding:20px 8px; color:rgba(43,38,34,0.5);">No messages yet.</td></tr>';
    return;
  }
  messagesTableBody.innerHTML = currentMessages
    .map(
      (m) => `
    <tr>
      <td style="white-space:nowrap;">${formatTimestamp(m.createdAt)}</td>
      <td>${m.name || "—"}</td>
      <td>
        <div>${m.phone || ""}</div>
        <div style="font-size:12px; color:rgba(43,38,34,0.6);">${m.email || ""}</div>
      </td>
      <td style="max-width:260px;">${m.message || ""}</td>
    </tr>`
    )
    .join("");
}

// =====================================================================
// EVENT LISTENERS (safe to attach now — everything above is defined)
// =====================================================================
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    Object.entries(panels).forEach(([name, el]) => {
      el.classList.toggle("hidden", name !== tab.dataset.tab);
    });
  });
});

cancelEditBtn.addEventListener("click", resetProductForm);

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.className = "status-msg";
  formStatus.textContent = "Saving…";
  submitBtn.disabled = true;

  try {
    const editingId = editingIdField.value;
    const name = nameField.value.trim();
    const price = Number(priceField.value);
    const category = categoryField.value;
    const file = imageField.files[0];

    // Image is optional — if none is chosen, new products save with no
    // image (the public site shows a plain placeholder), and edits keep
    // whatever photo the product already had.
    let imageUrl = null;
    if (file) {
      imageUrl = await uploadImageToCloudinary(file);
    }

    if (editingId) {
      const updates = { name, price, category };
      if (imageUrl) updates.image = imageUrl;
      await updateDoc(doc(db, "products", editingId), updates);
      formStatus.textContent = "Product updated.";
    } else {
      await addDoc(collection(db, "products"), {
        name,
        price,
        category,
        image: imageUrl || "",
        createdAt: serverTimestamp()
      });
      formStatus.textContent = "Product added.";
    }

    formStatus.className = "status-msg success";
    resetProductForm();
  } catch (err) {
    formStatus.className = "status-msg error";
    formStatus.textContent = "Something went wrong: " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

seedBtn.addEventListener("click", async () => {
  if (
    !confirm(
      "Add the 6 starter products shown on your site into the database? Skip this if you've already added them, since it doesn't check for duplicates."
    )
  ) {
    return;
  }
  seedBtn.disabled = true;
  seedBtn.textContent = "Adding…";
  try {
    for (const product of STARTER_PRODUCTS) {
      await addDoc(collection(db, "products"), { ...product, createdAt: serverTimestamp() });
    }
    seedBtn.textContent = "Added!";
  } catch (err) {
    alert("Something went wrong adding starter products: " + err.message);
    seedBtn.textContent = "Add Starter Products";
    seedBtn.disabled = false;
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginStatus.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginStatus.textContent = "Login failed — check your email and password.";
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

// =====================================================================
// AUTH — registered last, after every function/element it might call exists
// =====================================================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");
    startListeningToProducts();
    startListeningToOrders();
    startListeningToMessages();
  } else {
    adminView.classList.add("hidden");
    loginView.classList.remove("hidden");
    [unsubscribeProducts, unsubscribeOrders, unsubscribeMessages].forEach((fn) => fn && fn());
    unsubscribeProducts = unsubscribeOrders = unsubscribeMessages = null;
  }
});
