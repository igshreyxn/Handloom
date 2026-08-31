# Saree Shop — Flat-File Version

Same setup as Notun Bazaar: plain HTML, CSS, and JavaScript files, no folders,
no build step. Upload these exactly the way you uploaded Notun Bazaar's files.

## Files
- `index.html` — homepage (hero, categories, bestsellers, craftsmanship story, gifting, reviews)
- `sarees.html`, `womens-clothing.html`, `handicrafts.html`, `gifting.html` — category pages
- `about.html`, `contact.html`, `cart.html`
- `admin.html` + `admin.js` — password-protected page to manage Products, Orders, and Messages
- `firebase-init.js` — shared Firebase setup (your project's config)
- `firebase-sync.js` — streams live product data from Firestore into the public pages
- `orders.js` — saves checkout orders from the cart page to Firestore
- `messages.js` — saves contact form submissions to Firestore
- `styles.css` — all colors, type, layout, animations
- `script.js` — cart (saved in the browser via localStorage), checkout form, contact form, fallback sample products, scroll animations
- `FIREBASE_RULES.md` — security rules to paste into Firebase Console once admin is confirmed working

## How the admin page works
Go to `yoursite.vercel.app/admin.html` and log in with the email/password you
created in Firebase Authentication. Three tabs:

**Products** — add/edit/delete products. A photo is optional: products
without one show a plain "No Image" placeholder until you add one later.
There's also an "Add Starter Products" button that loads the 6 sample
products already visible on your site into the real database, so you can
edit or remove them properly instead of leaving them as hardcoded fallback
data.

**Orders** — every order placed through the cart's checkout form (customer
name, phone, address, and their cart contents) appears here automatically,
newest first. Change the status dropdown (New / Confirmed / Delivered) to
track progress — there's no payment gateway yet, so this is a "we'll
contact you to confirm" flow, not online payment.

**Messages** — every contact form submission appears here, newest first.

Changes to products reflect on your live site automatically within a
second or two — no redeploy needed.

**Important:** `admin.html` is a real page anyone could technically navigate
to, but they can't do anything without your login — the Add/Edit/Delete
actions are blocked by Firebase until you've applied the rules in
`FIREBASE_RULES.md`. Do that as soon as the admin page is confirmed working.

## Upload to GitHub (same process as Notun Bazaar)
1. Create a new repository on github.com (Public, no README)
2. On the repo page, use "Add file" → "Upload files"
3. Drag in ALL 10 files at once — they all go into the root of the repo, no subfolder
4. Scroll down, write a commit message, click "Commit changes"

## Connect to Vercel (same as before)
1. Sign into vercel.com with "Continue with GitHub"
2. Click "Add New" → "Project," select this repo, click "Deploy"
3. Vercel detects it as a static site — no build step needed, just like Notun Bazaar

After that, any time you update a file, re-upload and commit it on GitHub the
same way — Vercel redeploys automatically.

## Before going live — search each file for "TODO"
1. **Brand name** — appears in the header/footer of every page (search-and-replace "Your Brand Name")
2. **WhatsApp number** — in `script.js` (search "911234567890") and in every page's WhatsApp link
3. **Phone & email** — in the footer of every page and in `contact.html`
4. **Real products** — edit the `PRODUCTS` array at the top of `script.js` with your real names, prices, images, and categories (`sarees`, `womens-clothing`, `handicrafts`, `gifting`)
5. **Real testimonials** — in `index.html`, the three placeholder review cards
6. **About page story** — in `about.html`

## What's not wired up yet
- **Checkout payment** — the cart totals correctly but "Proceed to Checkout" just shows a placeholder alert. Wiring up Razorpay/Stripe is the natural next step once you're ready to accept real payments.
- **Contact form delivery** — the form shows a success message but doesn't actually send anywhere yet. A service like Formspree can connect it to your email with minimal setup.
- **Firestore/Storage security rules** — see `FIREBASE_RULES.md`. Test mode works for now but expires after 30 days.
