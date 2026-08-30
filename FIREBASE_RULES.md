# Firebase Security Rules — Resham & Roots

Paste this into the Firebase Console once the admin page is working, so
your shop data is actually protected (right now, in "test mode," anyone
could write to your database if they found the project ID).

Note: product images are hosted on Cloudinary, not Firebase Storage (which
now requires a paid Blaze plan) — so only Firestore rules are needed here.

## Firestore Rules
Go to: Firebase Console → Build → Firestore Database → Rules tab → paste this → Publish

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This means: anyone can view products (needed for your public site to work),
but only someone logged in (you, via the admin page) can add, edit, or
delete a product.

## When to do this
Do this AFTER you've confirmed the admin page itself works (logging in,
adding a product, seeing it appear on the live site). Test mode rules
expire automatically after 30 days anyway, so don't leave it too long
after that — Firebase will start blocking all reads/writes once test mode
expires, and your site will look broken until these real rules are in place.

