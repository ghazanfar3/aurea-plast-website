<?php
/**
 * Shared bootstrap included by every /api/*.php endpoint.
 * Sets safe production error handling, loads config + libraries,
 * and provides small guards reused by both forms.
 */

// Never leak PHP errors/warnings into the JSON response body.
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/RateLimiter.php';
require_once __DIR__ . '/Mailer.php';

/** Convert any uncaught fatal error into a clean JSON response instead of an HTML error page. */
set_exception_handler(function ($e) {
    Logger::error('Uncaught exception', array('error' => $e->getMessage()));
    Response::error('Something went wrong while processing your request. Please try again shortly or contact us directly.', 500);
});

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR), true)) {
        Logger::error('Fatal error', array('message' => $error['message'], 'file' => $error['file'], 'line' => $error['line']));
        if (!headers_sent()) {
            Response::error('Something went wrong while processing your request. Please try again shortly or contact us directly.', 500);
        }
    }
});

/** Require POST — reject everything else immediately. */
function require_post_method()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed.', 405);
    }
}

/**
 * Honeypot check — the hidden field must always arrive empty.
 * Bots that auto-fill every input will trip this and get a generic
 * success response so they don't learn to avoid the trap, while no
 * email is actually sent.
 */
function is_honeypot_triggered($value)
{
    return trim((string) $value) !== '';
}

/** Apply the shared rate limiter for a given form + the caller's IP. */
function enforce_rate_limit($formName)
{
    $ip = Validator::clientIp();
    if (!RateLimiter::allow($formName . '_' . $ip)) {
        Logger::warning('Rate limit exceeded', array('form' => $formName, 'ip' => $ip));
        Response::error('Too many submissions from your connection. Please wait a few minutes and try again.', 429);
    }
}

/** Read JSON or form-encoded POST body into an associative array. */
function read_request_fields()
{
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : array();
    }
    return $_POST;
}
