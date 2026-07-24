<?php
/**
 * Newsletter subscription endpoint — same Mailer/validation stack as the
 * contact/appointment forms, kept lightweight since it only has one field.
 */

require_once __DIR__ . '/lib/bootstrap.php';

require_post_method();
enforce_rate_limit('newsletter');

$fields = read_request_fields();
$email  = Validator::singleLine(isset($fields['email']) ? $fields['email'] : '', 160);

if ($email === '' || !Validator::isValidEmail($email)) {
    Response::error('Please enter a valid email address.', 422, array('errors' => array('email' => 'A valid email address is required.')));
}

$subject   = 'New Newsletter Subscriber';
$htmlBody  = '<div style="font-family:Arial,Helvetica,sans-serif;"><h2 style="color:#0a2842;">New Newsletter Subscriber</h2><p><strong>Email:</strong> ' . Validator::escapeHtml($email) . '</p></div>';
$plainBody = "New Newsletter Subscriber\nEmail: " . $email;

$result = Mailer::sendNotification($subject, $htmlBody, $plainBody, $email, null);

if (!$result['success']) {
    Response::error('Subscription failed. Please try again shortly.', 502);
}

Logger::info('Newsletter subscription email sent', array('email' => $email));
Response::success('Subscribed! Thank you for joining our newsletter.');
