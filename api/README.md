# Aurea Plast — Form Backend (PHPMailer + Hostinger SMTP)

Real email backend for the **Appointment** and **Contact** forms (plus the
footer **Newsletter** signup). Every form now performs a real server-side
send and only reports success to the visitor once Hostinger's SMTP server
has accepted the message.

## Files

| Path | Purpose |
|---|---|
| `contact.php` | Contact form endpoint |
| `appointment.php` | Appointment wizard endpoint (supports optional image attachments) |
| `newsletter.php` | Footer newsletter signup endpoint |
| `config.php` | Safe placeholder config, committed to Git |
| `config.local.sample.php` | Template — copy to `config.local.php` **on the server only** |
| `lib/Mailer.php` | PHPMailer wrapper (SMTP transport, attachments, error capture) |
| `lib/Validator.php` | Input sanitization, email/phone validation, header-injection guard |
| `lib/RateLimiter.php` | File-based per-IP rate limiting (no database needed) |
| `lib/Logger.php` | Writes failures to `logs/mail.log` |
| `lib/Response.php` | Consistent `{success, message}` JSON responses |
| `vendor/phpmailer/` | PHPMailer 6.12.0 source, vendored directly (no Composer needed on the server) |

## One-time setup on Hostinger

1. **Create a mailbox** in hPanel → Emails → e.g. `noreply@aureaplastclinic.com`
   (any domain/subdomain that already points at this Hostinger account).
   Set a strong password — this is what SMTP authenticates with.
2. **Deploy this repo** to the hosting document root as usual (Git deploy /
   File Manager upload). Make sure the `api/` folder — including the
   hidden `.htaccess` files — is uploaded.
3. On the server, create `api/config.local.php` (copy
   `config.local.sample.php`) and fill in:
   - `SMTP_HOST` → `smtp.hostinger.com`
   - `SMTP_PORT` → `465`
   - `SMTP_ENCRYPTION` → `ssl`
   - `SMTP_USERNAME` → the mailbox you created, e.g. `noreply@aureaplastclinic.com`
   - `SMTP_PASSWORD` → that mailbox's password
   - `MAIL_TO_EMAIL` → `aureaplast@gmail.com` (already the default)
4. **Never commit `config.local.php`** — it's already in `.gitignore`.
   It must be created directly on the server (File Manager or SFTP/SSH).
5. Confirm PHP ≥ 7.2 is selected for the domain (hPanel → Advanced → PHP
   Configuration). PHPMailer 6.x supports PHP 5.5+, but 7.4+/8.x is
   recommended.
6. Make sure `api/logs/` and `api/data/` are writable by PHP (default
   Hostinger permissions — 755 on folders — are sufficient).
7. Submit each form once to test. Then check:
   - Inbox at `aureaplast@gmail.com` (and Spam folder the first time).
   - `api/logs/mail.log` for any SMTP error if nothing arrives.

## Debugging delivery problems

Temporarily set in `config.local.php`:

```php
define('SMTP_DEBUG_LEVEL', 2);
```

Resubmit a form, then read `api/logs/mail.log` for the full SMTP
conversation (auth failure, TLS handshake, relay rejection, etc.). Set it
back to `0` once resolved — verbose logs can contain header details.

## Security measures included

- **Honeypot** hidden field (`website`) on both forms — bots that fill
  every input trip it and get a fake success with no email sent.
- **Server-side validation** for name/phone/email/time — the JSON error
  response is authoritative; client-side checks are UX only.
- **Header-injection protection** — every value that could reach an email
  header (name, email) has line breaks stripped before use, and only
  `PHPMailer`'s own header-safe setters (`setFrom`, `addAddress`,
  `addReplyTo`) are used — no raw header strings are ever built.
- **Rate limiting** — max 5 submissions per IP per form per 10 minutes,
  tracked in `api/data/*.json` (git-ignored, `.htaccess`-protected).
- **Attachment allow-list** — appointment reference images are restricted
  to JPEG/PNG/WEBP/GIF, 8MB per file, 20MB total, 5 files max.
- **`.htaccess` deny rules** on `lib/`, `vendor/`, `logs/`, `data/`, and the
  config files so none of them are ever served directly by the browser.
