<?php
/**
 * Minimal file-based logger used to debug SMTP / validation failures
 * without exposing internal errors to the client response.
 */
class Logger
{
    private static function ensureDir($path)
    {
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }

    private static function write($level, $message, array $context = array())
    {
        $file = defined('MAIL_LOG_FILE') ? MAIL_LOG_FILE : __DIR__ . '/../logs/mail.log';
        self::ensureDir($file);

        $line = sprintf(
            '[%s] [%s] %s',
            gmdate('Y-m-d H:i:s') . ' UTC',
            $level,
            $message
        );

        if (!empty($context)) {
            $line .= ' ' . json_encode($context, JSON_UNESCAPED_SLASHES);
        }

        @file_put_contents($file, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
    }

    public static function info($message, array $context = array())
    {
        self::write('INFO', $message, $context);
    }

    public static function warning($message, array $context = array())
    {
        self::write('WARNING', $message, $context);
    }

    public static function error($message, array $context = array())
    {
        self::write('ERROR', $message, $context);
    }
}
