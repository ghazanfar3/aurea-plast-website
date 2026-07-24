<?php
/**
 * COPY THIS FILE on the live server only:
 *   cp api/config.local.sample.php api/config.local.php
 * then fill in the real Hostinger mailbox credentials below.
 *
 * "api/config.local.php" is listed in .gitignore — it will never be
 * committed or pushed to GitHub, so your real password stays private.
 * Create it directly on the server (Hostinger File Manager or SSH),
 * NOT in your local Git working copy that gets pushed.
 */

define('SMTP_HOST', 'smtp.hostinger.com');   // Hostinger SMTP hostname
define('SMTP_PORT', 465);                    // 465 for SSL, 587 for TLS
define('SMTP_ENCRYPTION', 'ssl');            // 'ssl' or 'tls'
define('SMTP_USERNAME', 'noreply@aureaplastclinic.com'); // full mailbox address created in hPanel
define('SMTP_PASSWORD', 'REPLACE_WITH_REAL_MAILBOX_PASSWORD');

define('MAIL_FROM_EMAIL', SMTP_USERNAME);
define('MAIL_FROM_NAME', 'Aurea Plast Website');

define('MAIL_TO_EMAIL', 'aureaplast@gmail.com');

// Set to 2 temporarily while diagnosing delivery problems, then back to 0.
define('SMTP_DEBUG_LEVEL', 0);
