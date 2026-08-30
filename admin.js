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
  serverTimestamp
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

const loginView = document.getElementById("login-view");
const adminView = document.getElementById("admin-view");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const logoutBtn = document.getElementById("logout-btn");

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
const tableBody = document.getElementById("products-table-body");

let currentProducts = [];
let unsubscribeProducts = null;

// ---------- Auth ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");
    startListeningToProducts();
  } else {
    adminView.classList.add("hidden");
    loginView.classList.remove("hidden");
    if (unsubscribeProducts) {
      unsubscribeProducts();
      unsubscribeProducts = null;
    }
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

// ---------- Live product list ----------
function startListeningToProducts() {
  unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
    currentProducts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderTable();
  });
}

function renderTable() {
  if (currentProducts.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5" style="padding:20px 8px; color:rgba(43,38,34,0.5);">No products yet — add your first one above.</td></tr>';
    return;
  }
  tableBody.innerHTML = currentProducts
    .map(
      (p) => `
    <tr>
      <td><img class="admin-thumb" src="${p.image}" alt="${p.name}" /></td>
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

  tableBody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.edit));
  });
  tableBody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.delete));
  });
}

// ---------- Add / Edit ----------
function startEdit(id) {
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

function resetForm() {
  productForm.reset();
  editingIdField.value = "";
  formTitle.textContent = "Add a Product";
  submitBtn.textContent = "Add Product";
  cancelEditBtn.classList.add("hidden");
}

cancelEditBtn.addEventListener("click", resetForm);

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
      if (!imageUrl) {
        formStatus.className = "status-msg error";
        formStatus.textContent = "Please choose an image for a new product.";
        submitBtn.disabled = false;
        return;
      }
      await addDoc(collection(db, "products"), {
        name,
        price,
        category,
        image: imageUrl,
        createdAt: serverTimestamp()
      });
      formStatus.textContent = "Product added.";
    }

    formStatus.className = "status-msg success";
    resetForm();
  } catch (err) {
    formStatus.className = "status-msg error";
    formStatus.textContent = "Something went wrong: " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- Delete ----------
async function handleDelete(id) {
  const product = currentProducts.find((p) => p.id === id);
  if (!product) return;
  if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;

  try {
    await deleteDoc(doc(db, "products", id));
    // Note: the image stays in Cloudinary (deleting it requires a signed
    // request, which needs a backend to keep the API secret safe). Free
    // Cloudinary storage is generous, so this is fine for a small shop —
    // you can clean up unused images manually from the Cloudinary Media
    // Library if you ever want to.
  } catch (err) {
    alert("Couldn't delete product: " + err.message);
  }
}
