import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Called by script.js's contact form handler on the contact page.
window.submitContactMessage = async function (data) {
  await addDoc(collection(db, "messages"), {
    ...data,
    createdAt: serverTimestamp()
  });
};
