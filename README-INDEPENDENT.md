# Platinum Graphic Design — Static / WordPress-independent build

This copy is designed to run from GitHub + Vercel without a live WordPress server.

## Replacements made
- Contact page: FormSubmit -> ABC@hotmail.com
- Homepage popup enquiry form: FormSubmit -> ABC@hotmail.com
- WP Simple Pay / WordPress checkout forms: replaced with WhatsApp order buttons for the same service names and prices.
- WordPress comments/blog demo/author/category pages: removed and redirected.
- WordPress REST/AJAX discovery endpoints (`/wp-admin`, `/wp-json`, `xmlrpc.php`) removed from active page configuration and redirected.
- WPForms and WP Simple Pay runtime assets removed.
- Old email references changed to ABC@hotmail.com.
- Sitemap/robots regenerated for the intended custom domain.

## Important
Folders named `wp-content` and `wp-includes` remain because they contain static CSS, JavaScript, fonts, and images copied with the site. They are served directly by Vercel and do NOT require WordPress or PHP. Renaming them is unnecessary and risks breaking thousands of asset URLs.

## Payment replacement
The previous card checkout depended on the WP Simple Pay WordPress plugin. This build replaces its two `Order Now` actions with WhatsApp ordering so the site remains fully independent. If you want direct card payment again, create Stripe Payment Links and replace the WhatsApp URLs with those links; no WordPress is required.

## FormSubmit first-time activation
The first submission to ABC@hotmail.com may require activation/confirmation from FormSubmit. Confirm that email once, then test again.

## When the custom domain is moved to Vercel
The `_next` redirect fields currently return to the Vercel test domain. After `www.platinumgraphicdesign.com` is live on Vercel, you may optionally change them to the custom domain. The forms will still work without that change.
