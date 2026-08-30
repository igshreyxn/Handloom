# Saree Shop — Flat-File Version

Same setup as Notun Bazaar: plain HTML, CSS, and JavaScript files, no folders,
no build step. Upload these exactly the way you uploaded Notun Bazaar's files.

## Files
- `index.html` — homepage (hero, categories, bestsellers, craftsmanship story, gifting, reviews)
- `sarees.html`, `womens-clothing.html`, `handicrafts.html`, `gifting.html` — category pages
- `about.html`, `contact.html`, `cart.html`
- `styles.css` — all colors, type, layout, animations
- `script.js` — cart (saved in the browser via localStorage), product data, scroll animations

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
- **Product data persistence** — products live directly in `script.js` for now. If you want to update stock/prices without editing code each time, that's what the Firebase step in our earlier plan was for.
