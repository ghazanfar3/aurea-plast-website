/* ==========================================================================
   AUREA PLAST — EmailJS configuration
   --------------------------------------------------------------------------
   This file holds ONLY public, non-secret identifiers. The EmailJS "Public
   Key" is designed to be exposed in client-side code (it identifies your
   EmailJS account, it is not a password) — see https://www.emailjs.com/docs/

   Service: Hostinger Email (info@aureaplastclinic.com) → aureaplast@gmail.com
   Templates reference the form field names directly (see js/forms.js), e.g.
   {{name}} {{email}} {{phone}} {{procedure}} {{doctor}} {{date}} {{time}}
   {{message}} / {{notes}} {{attachments_note}} — plus the common aliases
   {{from_name}} {{from_email}} {{reply_to}} {{to_name}} which are mirrored
   automatically by every form so either naming convention works in the
   EmailJS template editor.
   ========================================================================== */

const EMAILJS_PUBLIC_KEY              = '1dv597DqK41xQBDRh';
const EMAILJS_SERVICE_ID              = 'service_yrp1c4e';
const EMAILJS_TEMPLATE_ID_CONTACT     = 'template_q9a26je';
const EMAILJS_TEMPLATE_ID_APPOINTMENT = 'template_g40sm8j';

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
