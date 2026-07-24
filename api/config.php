<?php
/**
 * Aurea Plast — Mail configuration.
 *
 * This file is committed to Git with SAFE PLACEHOLDER VALUES ONLY.
 * Real SMTP credentials must NEVER be committed to a public/shared repo.
 *
 * On the live Hostinger server, create a sibling file named
 * "config.local.php" (see config.local.sample.php) containing the real
 * credentials — that file is listed in .gitignore and is never pushed
 * back to GitHub. It is loaded below and overrides these placeholders.
 *
 * Alternatively, values can be supplied via real environment variables
 * (e.g. set through Hostinger hPanel "Advanced > PHP Configuration" or an
 * .htaccess "SetEnv" directive) — those take priority over both files.
 */

if (!defined('AUREA_CONFIG_LOADED')) {
    define('AUREA_CONFIG_LOADED', true);

    /* ------------------------------------------------------------------
       Helper: read a value from a real environment variable first,
       falling back to the given default when it isn't set.
       ------------------------------------------------------------------ */
    if (!function_exists('aurea_env')) {
        function aurea_env($key, $default = null) {
            $value = getenv($key);
            return ($value === false || $value === '') ? $default : $value;
        }
    }

    /* --- Load server-only overrides (never committed to Git) --------- */
    $localConfig = __DIR__ . '/config.local.php';
    if (is_file($localConfig)) {
        require $localConfig;
    }

    /* ------------------------------------------------------------------
       SMTP transport (Hostinger Titan Mail / Hostinger SMTP)
       Typical Hostinger values:
         Host       : smtp.hostinger.com
         Port       : 465 (SSL)  or  587 (STARTTLS)
         Encryption : ssl        or  tls
       ------------------------------------------------------------------ */
    if (!defined('SMTP_HOST'))       define('SMTP_HOST', aurea_env('AUREA_SMTP_HOST', 'smtp.hostinger.com'));
    if (!defined('SMTP_PORT'))       define('SMTP_PORT', (int) aurea_env('AUREA_SMTP_PORT', 465));
    if (!defined('SMTP_ENCRYPTION')) define('SMTP_ENCRYPTION', aurea_env('AUREA_SMTP_ENCRYPTION', 'ssl')); // 'ssl' or 'tls'
    if (!defined('SMTP_USERNAME'))   define('SMTP_USERNAME', aurea_env('AUREA_SMTP_USERNAME', 'CHANGE_ME@yourdomain.com'));
    if (!defined('SMTP_PASSWORD'))   define('SMTP_PASSWORD', aurea_env('AUREA_SMTP_PASSWORD', 'CHANGE_ME'));

    /* ------------------------------------------------------------------
       Sender identity — Hostinger SMTP requires the "From" address to be
       a real mailbox on the same domain being sent through (SMTP_USERNAME
       is normally the correct value here).
       ------------------------------------------------------------------ */
    if (!defined('MAIL_FROM_EMAIL')) define('MAIL_FROM_EMAIL', aurea_env('AUREA_MAIL_FROM_EMAIL', SMTP_USERNAME));
    if (!defined('MAIL_FROM_NAME'))  define('MAIL_FROM_NAME', aurea_env('AUREA_MAIL_FROM_NAME', 'Aurea Plast Website'));

    /* --- Destination for every form submission ------------------------ */
    if (!defined('MAIL_TO_EMAIL')) define('MAIL_TO_EMAIL', aurea_env('AUREA_MAIL_TO_EMAIL', 'aureaplast@gmail.com'));
    if (!defined('MAIL_TO_NAME'))  define('MAIL_TO_NAME', 'Aurea Plast');

    /* --- Debugging / logging ------------------------------------------ */
    // 0 = off, 1 = client messages, 2 = client + server messages (verbose)
    if (!defined('SMTP_DEBUG_LEVEL')) define('SMTP_DEBUG_LEVEL', (int) aurea_env('AUREA_SMTP_DEBUG', 0));
    if (!defined('MAIL_LOG_FILE'))    define('MAIL_LOG_FILE', __DIR__ . '/logs/mail.log');

    /* --- Rate limiting (per IP, per endpoint) -------------------------- */
    if (!defined('RATE_LIMIT_MAX'))         define('RATE_LIMIT_MAX', 5);   // max submissions
    if (!defined('RATE_LIMIT_WINDOW_SECS')) define('RATE_LIMIT_WINDOW_SECS', 600); // per 10 minutes
    if (!defined('RATE_LIMIT_DIR'))         define('RATE_LIMIT_DIR', __DIR__ . '/data');

    /* --- Allowed origins for the fetch() calls (same site only) ------- */
    if (!defined('ALLOWED_ORIGINS')) {
        define('ALLOWED_ORIGINS', array(
            'https://www.aureaplastclinic.com',
            'https://aureaplastclinic.com',
            'https://www.aureaplast.com',
            'https://aureaplast.com',
        ));
    }
}
