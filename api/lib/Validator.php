<?php
/**
 * Input sanitization / validation helpers shared by every form endpoint.
 * Every value that ends up in an email HEADER (name, email, subject) is
 * stripped of line breaks to prevent header injection / email spoofing.
 */
class Validator
{
    /** Remove control characters and CR/LF (header-injection guard). */
    public static function singleLine($value, $maxLength = 200)
    {
        $value = (string) $value;
        $value = preg_replace('/[\r\n\x00-\x1F\x7F]+/', ' ', $value);
        $value = trim($value);
        if (function_exists('mb_substr')) {
            $value = mb_substr($value, 0, $maxLength);
        } else {
            $value = substr($value, 0, $maxLength);
        }
        return $value;
    }

    /** Multi-line free text (message / notes) — strips tags, keeps line breaks. */
    public static function multiLine($value, $maxLength = 3000)
    {
        $value = (string) $value;
        $value = str_replace(array("\r\n", "\r"), "\n", $value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/', '', $value);
        $value = trim($value);
        if (function_exists('mb_substr')) {
            $value = mb_substr($value, 0, $maxLength);
        } else {
            $value = substr($value, 0, $maxLength);
        }
        return $value;
    }

    public static function isValidEmail($email)
    {
        if (preg_match('/[\r\n]/', $email)) {
            return false;
        }
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    /** Loose phone validation — digits, spaces, +, -, (), 6-20 chars. */
    public static function isValidPhone($phone)
    {
        return (bool) preg_match('/^[0-9+\-\s()]{6,20}$/', $phone);
    }

    /** Escape a value for safe insertion into the HTML email body. */
    public static function escapeHtml($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }

    public static function clientIp()
    {
        $keys = array('HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR');
        foreach ($keys as $key) {
            if (!empty($_SERVER[$key])) {
                $parts = explode(',', $_SERVER[$key]);
                $ip = trim($parts[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }
}
