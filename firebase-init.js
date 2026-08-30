// Shared Firebase setup. Loaded as a module by both the public site
// (firebase-sync.js) and the admin page (admin.js).
// Note: images are hosted on Cloudinary, not Firebase Storage (which now
// requires a paid Blaze plan) — see admin.js for the Cloudinary upload code.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCes9qDvQaEKEby1e6AH8L7vFBgfO82ATE",
  authDomain: "resham-roots.firebaseapp.com",
  projectId: "resham-roots",
  storageBucket: "resham-roots.firebasestorage.app",
  messagingSenderId: "704042423388",
  appId: "1:704042423388:web:f8a756a1f33bfe0297c299"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
