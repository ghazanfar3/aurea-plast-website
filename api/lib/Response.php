<?php
/**
 * Consistent JSON response helper — every endpoint returns exactly this
 * shape so the frontend can rely on `success` before showing any message.
 */
class Response
{
    public static function json($success, $message, array $extra = array(), $httpCode = null)
    {
        if ($httpCode === null) {
            $httpCode = $success ? 200 : 400;
        }
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=UTF-8');

        $payload = array_merge(array(
            'success' => (bool) $success,
            'message' => (string) $message,
        ), $extra);

        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success($message, array $extra = array())
    {
        self::json(true, $message, $extra, 200);
    }

    public static function error($message, $httpCode = 400, array $extra = array())
    {
        self::json(false, $message, $extra, $httpCode);
    }
}
