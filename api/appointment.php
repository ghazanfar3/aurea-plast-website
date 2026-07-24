<?php
/**
 * Appointment booking endpoint.
 * Receives multipart/form-data POST from js/forms.js (so optional
 * reference-image uploads can be attached to the notification email),
 * validates + sanitizes every field, sends a real email via Hostinger
 * SMTP, and returns a JSON response the frontend uses to decide the
 * success/error UI.
 */

require_once __DIR__ . '/lib/bootstrap.php';

require_post_method();
enforce_rate_limit('appointment');

$fields = read_request_fields();

/* --- Honeypot: silently pretend success, send nothing --- */
if (is_honeypot_triggered(isset($fields['website']) ? $fields['website'] : '')) {
    Logger::warning('Honeypot triggered on appointment form', array('ip' => Validator::clientIp()));
    Response::success('Appointment request received.');
}

/* --- Sanitize --- */
$name      = Validator::singleLine(isset($fields['name']) ? $fields['name'] : '', 120);
$phone     = Validator::singleLine(isset($fields['phone']) ? $fields['phone'] : '', 30);
$email     = Validator::singleLine(isset($fields['email']) ? $fields['email'] : '', 160);
$doctor    = Validator::singleLine(isset($fields['doctor']) ? $fields['doctor'] : '', 120);
$procedure = Validator::singleLine(isset($fields['procedure']) ? $fields['procedure'] : '', 120);
$date      = Validator::singleLine(isset($fields['date']) ? $fields['date'] : '', 60);
$time      = Validator::singleLine(isset($fields['time']) ? $fields['time'] : '', 40);
$notes     = Validator::multiLine(isset($fields['notes']) ? $fields['notes'] : '', 3000);

/* --- Validate --- */
$errors = array();
if ($name === '')                       $errors['name']  = 'Full name is required.';
if ($phone === '' || !Validator::isValidPhone($phone)) $errors['phone'] = 'A valid phone number is required.';
if ($email === '' || !Validator::isValidEmail($email)) $errors['email'] = 'A valid email address is required.';
if ($time === '')                       $errors['time']  = 'Please select a preferred appointment time.';

if (!empty($errors)) {
    Response::error('Please check the highlighted fields and try again.', 422, array('errors' => $errors));
}

/* ------------------------------------------------------------------
   Optional reference-image attachments — validated strictly:
   images only, capped size/count, so the mailbox can never be used
   to relay arbitrary or oversized files.
   ------------------------------------------------------------------ */
$attachments   = array();
$allowedMime   = array('image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif');
$maxFileBytes  = 8 * 1024 * 1024;   // 8MB per file
$maxTotalBytes = 20 * 1024 * 1024;  // 20MB combined
$maxFileCount  = 5;
$totalBytes    = 0;

if (!empty($_FILES['files']['name'][0])) {
    $count = count($_FILES['files']['name']);
    for ($i = 0; $i < $count && $i < $maxFileCount; $i++) {
        if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) {
            continue;
        }
        $tmpPath = $_FILES['files']['tmp_name'][$i];
        $size    = (int) $_FILES['files']['size'][$i];
        if ($size <= 0 || $size > $maxFileBytes) {
            continue;
        }
        $mime = function_exists('mime_content_type') ? mime_content_type($tmpPath) : null;
        if (!$mime || !isset($allowedMime[$mime])) {
            continue;
        }
        $totalBytes += $size;
        if ($totalBytes > $maxTotalBytes) {
            break;
        }
        $safeName = 'reference-' . ($i + 1) . '.' . $allowedMime[$mime];
        $attachments[] = array('path' => $tmpPath, 'name' => $safeName);
    }
}

/* --- Build email --- */
$subject = 'New Appointment Request – ' . $name;

$rows = array(
    'Full Name'        => $name,
    'Phone'            => $phone,
    'Email'            => $email,
    'Preferred Doctor' => $doctor !== '' ? $doctor : 'No preference',
    'Procedure'        => $procedure !== '' ? $procedure : 'Not specified',
    'Preferred Date'   => $date !== '' ? $date : 'Not specified',
    'Preferred Time'   => $time,
);

$htmlRows = '';
foreach ($rows as $label => $value) {
    $htmlRows .= '<tr><td style="padding:8px 14px;border-bottom:1px solid #e7e3da;color:#8a877f;font-size:13px;white-space:nowrap;">' . Validator::escapeHtml($label) . '</td>'
               . '<td style="padding:8px 14px;border-bottom:1px solid #e7e3da;color:#2b2925;font-size:14px;">' . Validator::escapeHtml($value) . '</td></tr>';
}

$notesHtml = $notes !== ''
    ? '<p style="margin:18px 0 0;padding:14px 16px;background:#f7f5f0;border-radius:8px;color:#2b2925;font-size:14px;line-height:1.6;white-space:pre-wrap;">' . nl2br(Validator::escapeHtml($notes)) . '</p>'
    : '';

$attachmentNote = !empty($attachments)
    ? '<p style="margin-top:14px;color:#8a877f;font-size:13px;">' . count($attachments) . ' reference image(s) attached.</p>'
    : '';

$htmlBody = '
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
  <h2 style="color:#0a2842;margin-bottom:4px;">New Appointment Request</h2>
  <p style="color:#8a877f;margin-top:0;">Submitted via the Book Appointment wizard on aureaplastclinic.com</p>
  <table style="width:100%;border-collapse:collapse;margin-top:12px;">' . $htmlRows . '</table>
  ' . $notesHtml . $attachmentNote . '
</div>';

$plainBody = "New Appointment Request\n\n";
foreach ($rows as $label => $value) {
    $plainBody .= $label . ': ' . $value . "\n";
}
if ($notes !== '') {
    $plainBody .= "\nMedical Notes:\n" . $notes . "\n";
}

$result = Mailer::sendNotification($subject, $htmlBody, $plainBody, $email, $name, $attachments);

if (!$result['success']) {
    Response::error('We could not send your appointment request right now. Please try again shortly or reach us on WhatsApp.', 502);
}

Logger::info('Appointment form email sent', array('email' => $email));
Response::success('Thank you — our patient coordination team will confirm your appointment shortly by phone or email.');
