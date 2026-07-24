<?php
/**
 * Simple file-based rate limiter (no database required).
 * Tracks submission timestamps per (IP + form) in a small JSON file so
 * a single visitor/bot cannot flood the mailbox with requests.
 */
class RateLimiter
{
    /**
     * @return bool true when the request is allowed, false when the caller
     *              has exceeded RATE_LIMIT_MAX submissions within the window.
     */
    public static function allow($bucketKey)
    {
        $dir = defined('RATE_LIMIT_DIR') ? RATE_LIMIT_DIR : __DIR__ . '/../data';
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $max    = defined('RATE_LIMIT_MAX') ? RATE_LIMIT_MAX : 5;
        $window = defined('RATE_LIMIT_WINDOW_SECS') ? RATE_LIMIT_WINDOW_SECS : 600;

        $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $bucketKey);
        $file    = $dir . '/rl_' . $safeKey . '.json';

        $fp = @fopen($file, 'c+');
        if (!$fp) {
            // If we cannot open the tracking file, fail open rather than
            // blocking legitimate patients from submitting the form.
            return true;
        }

        flock($fp, LOCK_EX);

        $raw       = stream_get_contents($fp);
        $timestamps = array();
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $timestamps = $decoded;
            }
        }

        $now = time();
        // Discard timestamps outside the current window.
        $timestamps = array_values(array_filter($timestamps, function ($t) use ($now, $window) {
            return ($now - $t) < $window;
        }));

        $allowed = count($timestamps) < $max;

        if ($allowed) {
            $timestamps[] = $now;
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($timestamps));
            fflush($fp);
        }

        flock($fp, LOCK_UN);
        fclose($fp);

        return $allowed;
    }
}
