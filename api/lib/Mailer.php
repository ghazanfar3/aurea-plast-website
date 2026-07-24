<?php
require_once __DIR__ . '/../vendor/phpmailer/src/Exception.php';
require_once __DIR__ . '/../vendor/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/phpmailer/src/SMTP.php';
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/Validator.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/**
 * Thin wrapper around PHPMailer configured for Hostinger SMTP.
 * Every failure is logged to api/logs/mail.log; nothing sensitive
 * (passwords, stack traces) is ever echoed back to the browser.
 */
class Mailer
{
    /**
     * @param string $subject
     * @param string $htmlBody
     * @param string $plainBody
     * @param string|null $replyToEmail  visitor's email, set as Reply-To
     * @param string|null $replyToName   visitor's name, set as Reply-To display name
     * @param array $attachments  list of ['path' => string, 'name' => string] OR
     *                            ['content' => string, 'name' => string] for in-memory data
     * @return array ['success' => bool, 'error' => string|null]
     */
    public static function sendNotification($subject, $htmlBody, $plainBody, $replyToEmail = null, $replyToName = null, array $attachments = array())
    {
        $mail = new PHPMailer(true);
        $debugOutput = '';

        try {
            $mail->isSMTP();
            $mail->Host       = SMTP_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_USERNAME;
            $mail->Password   = SMTP_PASSWORD;
            $mail->Port       = SMTP_PORT;
            $mail->SMTPSecure = (SMTP_ENCRYPTION === 'tls') ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->CharSet    = 'UTF-8';

            $debugLevel = defined('SMTP_DEBUG_LEVEL') ? (int) SMTP_DEBUG_LEVEL : 0;
            if ($debugLevel > 0) {
                $mail->SMTPDebug = $debugLevel;
                $mail->Debugoutput = function ($str, $level) use (&$debugOutput) {
                    $debugOutput .= $str . "\n";
                };
            }

            $mail->setFrom(MAIL_FROM_EMAIL, MAIL_FROM_NAME);
            $mail->addAddress(MAIL_TO_EMAIL, MAIL_TO_NAME);

            if ($replyToEmail && Validator::isValidEmail($replyToEmail)) {
                $mail->addReplyTo($replyToEmail, $replyToName ?: $replyToEmail);
            }

            foreach ($attachments as $attachment) {
                if (!empty($attachment['path']) && is_file($attachment['path'])) {
                    $mail->addAttachment($attachment['path'], $attachment['name']);
                } elseif (isset($attachment['content'])) {
                    $mail->addStringAttachment($attachment['content'], $attachment['name']);
                }
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $plainBody;

            $mail->send();

            if ($debugLevel > 0 && $debugOutput) {
                Logger::info('SMTP debug trace', array('trace' => $debugOutput));
            }

            return array('success' => true, 'error' => null);
        } catch (PHPMailerException $e) {
            Logger::error('PHPMailer send failed', array(
                'error'      => $mail->ErrorInfo ?: $e->getMessage(),
                'smtp_debug' => $debugOutput,
            ));
            return array('success' => false, 'error' => $mail->ErrorInfo ?: $e->getMessage());
        } catch (\Throwable $e) {
            Logger::error('Unexpected mailer exception', array('error' => $e->getMessage()));
            return array('success' => false, 'error' => $e->getMessage());
        }
    }
}
