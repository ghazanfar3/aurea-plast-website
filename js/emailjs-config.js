/* ==========================================================================
   AUREA PLAST — EmailJS configuration
   --------------------------------------------------------------------------
   This file holds ONLY public, non-secret identifiers. The EmailJS "Public
   Key" is designed to be exposed in client-side code (it identifies your
   EmailJS account, it is not a password) — see https://www.emailjs.com/docs/

   REQUIRED SETUP — do this once in the EmailJS dashboard (emailjs.com):

   1. Create/sign in to an EmailJS account.

   2. Email Services → "Add New Service" → choose "Custom SMTP Server" and
      connect the clinic's real mailbox so mail is sent FROM
      info@aureaplastclinic.com. This domain's mail is now hosted on
      Hostinger's own native "Hostinger Email" service (confirmed via its
      MX records: mx1.hostinger.com / mx2.hostinger.com) — it is NOT Titan
      Mail, so do NOT use smtp.titan.email (that will fail auth):
        SMTP Server : smtp.hostinger.com
        Port        : 465 (SSL)   — or 587 (STARTTLS) if 465 is blocked
        Username    : info@aureaplastclinic.com   (the full mailbox address)
        Password    : (that Hostinger Email mailbox's current password —
                       reset it via hPanel → Emails → Manage → Security if
                       it's not known; the old Titan password no longer
                       works here)
      Copy the generated "Service ID" into EMAILJS_SERVICE_ID below.

   3. Email Templates → "Create New Template" — create ONE template for the
      Contact form and ONE for the Appointment form.

      a) Contact template — reference these variables in the template body:
         {{name}} {{phone}} {{email}} {{procedure}} {{doctor}} {{date}}
         {{time}} {{message}}
         Set "To Email"   : aureaplast@gmail.com
         Set "Reply To"   : {{email}}
         Copy its Template ID into EMAILJS_TEMPLATE_ID_CONTACT below.

      b) Appointment template — reference these variables:
         {{name}} {{phone}} {{email}} {{notes}} {{doctor}} {{procedure}}
         {{date}} {{time}} {{attachments_note}}
         Set "To Email"   : aureaplast@gmail.com
         Set "Reply To"   : {{email}}
         Copy its Template ID into EMAILJS_TEMPLATE_ID_APPOINTMENT below.

      (Setting "To Email" as a fixed address inside the template — instead of
      trusting a value from the browser — is EmailJS's recommended practice
      and prevents the form being abused to email third parties.)

   4. Account → General → copy your "Public Key" into EMAILJS_PUBLIC_KEY.

   5. Replace the four placeholder strings below with the real values.
      Never commit real SMTP passwords here — only the Service/Template IDs
      and Public Key belong in this file.
   ========================================================================== */

const EMAILJS_PUBLIC_KEY              = 'YOUR_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID              = 'YOUR_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID_CONTACT     = 'YOUR_EMAILJS_CONTACT_TEMPLATE_ID';
const EMAILJS_TEMPLATE_ID_APPOINTMENT = 'YOUR_EMAILJS_APPOINTMENT_TEMPLATE_ID';

/* Initialise the SDK once, as soon as this file loads. Guarded so a missing
   / not-yet-loaded SDK never throws and breaks the rest of the page. */
(function initEmailJs() {
  if (typeof emailjs === 'undefined') {
    console.warn('[Aurea Plast] EmailJS SDK not loaded — forms will not be able to send email.');
    return;
  }
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY.indexOf('YOUR_') === 0) {
    console.warn('[Aurea Plast] EmailJS is using placeholder credentials — replace the values in js/emailjs-config.js with your real EmailJS Public Key, Service ID and Template IDs.');
  }
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
})();
