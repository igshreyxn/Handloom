// Streams the "products" collection from Firestore into the public site.
// script.js exposes window.setProducts() (defined at the top level, so it
// exists by the time this deferred module runs) which swaps the in-memory
// product list and re-renders any grid on the page.
import { db } from "./firebase-init.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

onSnapshot(
  collection(db, "products"),
  (snapshot) => {
    const products = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    // Only replace the fallback sample data once real products exist,
    // so the page never goes blank while Firestore is still empty.
    if (products.length > 0 && typeof window.setProducts === "function") {
      window.setProducts(products);
    }
  },
  (error) => {
    // Fails silently to the hardcoded sample data already shown by script.js
    // (e.g. if Firestore rules aren't set up yet, or the visitor is offline).
    console.warn("Could not load live products, showing sample data:", error.message);
  }
);
