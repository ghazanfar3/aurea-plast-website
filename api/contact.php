<?php
/**
 * Contact / enquiry form endpoint.
 * Receives JSON POST from js/forms.js, validates + sanitizes every field,
 * sends a real email via Hostinger SMTP (Mailer -> PHPMailer), and
 * returns a JSON response the frontend uses to decide success/error UI.
 */

require_once __DIR__ . '/lib/bootstrap.php';

require_post_method();
enforce_rate_limit('contact');

$fields = read_request_fields();

/* --- Honeypot: silently pretend success, send nothing --- */
if (is_honeypot_triggered(isset($fields['website']) ? $fields['website'] : '')) {
    Logger::warning('Honeypot triggered on contact form', array('ip' => Validator::clientIp()));
    Response::success('Your enquiry has been received — our team will be in touch shortly.');
}

/* --- Sanitize --- */
$name      = Validator::singleLine(isset($fields['name']) ? $fields['name'] : '', 120);
$phone     = Validator::singleLine(isset($fields['phone']) ? $fields['phone'] : '', 30);
$email     = Validator::singleLine(isset($fields['email']) ? $fields['email'] : '', 160);
$procedure = Validator::singleLine(isset($fields['procedure']) ? $fields['procedure'] : '', 120);
$doctor    = Validator::singleLine(isset($fields['doctor']) ? $fields['doctor'] : '', 120);
$date      = Validator::singleLine(isset($fields['date']) ? $fields['date'] : '', 40);
$time      = Validator::singleLine(isset($fields['time']) ? $fields['time'] : '', 40);
$message   = Validator::multiLine(isset($fields['message']) ? $fields['message'] : '', 3000);

/* --- Validate --- */
$errors = array();
if ($name === '')                       $errors['name']  = 'Full name is required.';
if ($phone === '' || !Validator::isValidPhone($phone)) $errors['phone'] = 'A valid phone number is required.';
if ($email === '' || !Validator::isValidEmail($email)) $errors['email'] = 'A valid email address is required.';

if (!empty($errors)) {
    Response::error('Please check the highlighted fields and try again.', 422, array('errors' => $errors));
}

/* --- Build email --- */
$subject = 'New Enquiry from Website – ' . $name;

$rows = array(
    'Full Name'        => $name,
    'Phone'            => $phone,
    'Email'            => $email,
    'Procedure of Interest' => $procedure !== '' ? $procedure : 'Not specified',
    'Preferred Doctor' => $doctor !== '' ? $doctor : 'No preference',
    'Preferred Date'   => $date !== '' ? $date : 'Not specified',
    'Preferred Time'   => $time !== '' ? $time : 'Not specified',
);

$htmlRows = '';
foreach ($rows as $label => $value) {
    $htmlRows .= '<tr><td style="padding:8px 14px;border-bottom:1px solid #e7e3da;color:#8a877f;font-size:13px;white-space:nowrap;">' . Validator::escapeHtml($label) . '</td>'
               . '<td style="padding:8px 14px;border-bottom:1px solid #e7e3da;color:#2b2925;font-size:14px;">' . Validator::escapeHtml($value) . '</td></tr>';
}

$messageHtml = $message !== ''
    ? '<p style="margin:18px 0 0;padding:14px 16px;background:#f7f5f0;border-radius:8px;color:#2b2925;font-size:14px;line-height:1.6;white-space:pre-wrap;">' . nl2br(Validator::escapeHtml($message)) . '</p>'
    : '';

$htmlBody = '
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
  <h2 style="color:#0a2842;margin-bottom:4px;">New Website Enquiry</h2>
  <p style="color:#8a877f;margin-top:0;">Submitted via the Contact form on aureaplastclinic.com</p>
  <table style="width:100%;border-collapse:collapse;margin-top:12px;">' . $htmlRows . '</table>
  ' . $messageHtml . '
</div>';

$plainBody = "New Website Enquiry\n\n";
foreach ($rows as $label => $value) {
    $plainBody .= $label . ': ' . $value . "\n";
}
if ($message !== '') {
    $plainBody .= "\nMessage:\n" . $message . "\n";
}

$result = Mailer::sendNotification($subject, $htmlBody, $plainBody, $email, $name);

if (!$result['success']) {
    Response::error('We could not send your enquiry right now. Please try again shortly or reach us on WhatsApp.', 502);
}

Logger::info('Contact form email sent', array('email' => $email));
Response::success('Your enquiry has been received — our team will be in touch shortly.');
