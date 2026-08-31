import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Called by script.js's checkout form handler on the cart page.
window.submitOrder = async function (orderData) {
  await addDoc(collection(db, "orders"), {
    ...orderData,
    status: "new",
    createdAt: serverTimestamp()
  });
};
