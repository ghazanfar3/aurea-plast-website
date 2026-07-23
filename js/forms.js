/* ==========================================================================
   AUREA PLAST — forms.js
   Handles appointment form submission, newsletter, and EmailJS integration.
   Email provider: EmailJS (free, works from static sites)
   ========================================================================== */

/* ------------------------------------------------------------------
   EmailJS Configuration
   Service:  Gmail → info@aureaplastclinic.com
   To use EmailJS:
     1. Sign up at https://www.emailjs.com (free plan: 200 emails/month)
     2. Connect your Gmail account as a "Service"
     3. Create two email templates (IDs below) with the variables listed
     4. Replace EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID with your values
   ------------------------------------------------------------------ */
const EMAILJS_PUBLIC_KEY   = 'YOUR_EMAILJS_PUBLIC_KEY';   // Replace after EmailJS signup
const EMAILJS_SERVICE_ID   = 'YOUR_SERVICE_ID';           // Replace after EmailJS signup
const EMAILJS_APPT_TMPL    = 'template_appointment';      // Template for appointment emails
const EMAILJS_NEWS_TMPL    = 'template_newsletter';       // Template for newsletter emails

/* ------------------------------------------------------------------
   Generate 15-minute time slots between 2:00 PM and 10:00 PM
   Returns array of strings like ["2:00 PM", "2:15 PM", …, "10:00 PM"]
   ------------------------------------------------------------------ */
function generateTimeSlots() {
  const slots = [];
  // Start: 14:00 (2 PM), End: 22:00 (10 PM), step: 15 min
  for (let totalMin = 14 * 60; totalMin <= 22 * 60; totalMin += 15) {
    const h24 = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12  = h24 > 12 ? h24 - 12 : (h24 === 0 ? 12 : h24);
    const label = `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
    slots.push(label);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

/* ------------------------------------------------------------------
   Validate a time string is within the allowed range
   ------------------------------------------------------------------ */
function isValidClinicTime(timeStr) {
  if (!timeStr) return false;
  // Accept "H:MM AM/PM" or "HH:MM AM/PM"
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const totalMin = h * 60 + m;
  return totalMin >= 14 * 60 && totalMin <= 22 * 60;
}

/* ------------------------------------------------------------------
   Build time-chip grid for wizard Step 4
   ------------------------------------------------------------------ */
function buildWizardTimeGrid() {
  const grid = document.querySelector('.time-grid');
  if (!grid) return;
  grid.innerHTML = TIME_SLOTS.map(t =>
    `<div class="time-chip" data-time="${t}">${t}</div>`
  ).join('');
}

/* ------------------------------------------------------------------
   Build time select dropdown for contact form
   ------------------------------------------------------------------ */
function buildTimeSelect(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML =
    '<option value="">Select a time…</option>' +
    TIME_SLOTS.map(t => `<option value="${t}">${t}</option>`).join('');
}

/* ------------------------------------------------------------------
   Format date for email (YYYY-MM-DD → readable)
   ------------------------------------------------------------------ */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y) return dateStr;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m,10)-1]} ${y}`;
}

/* ------------------------------------------------------------------
   Send email via EmailJS
   Returns a Promise resolving to {ok: true} or {ok: false, error}
   ------------------------------------------------------------------ */
function sendEmail(templateId, templateParams) {
  // Check if EmailJS is configured
  if (EMAILJS_PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
    // Development fallback: log to console and pretend success
    console.info('[EmailJS] Not configured yet. Would send:', templateId, templateParams);
    return Promise.resolve({ ok: true, simulated: true });
  }

  return emailjs.send(EMAILJS_SERVICE_ID, templateId, templateParams)
    .then(() => ({ ok: true }))
    .catch(err => {
      console.error('[EmailJS] Error:', err);
      return { ok: false, error: err };
    });
}

/* ------------------------------------------------------------------
   Appointment email sender
   ------------------------------------------------------------------ */
function sendAppointmentEmail(data) {
  const params = {
    to_email:   'info@aureaplastclinic.com',
    subject:    `New Appointment Request – ${data.name}`,
    patient_name:   data.name    || '—',
    patient_phone:  data.phone   || '—',
    patient_email:  data.email   || '—',
    procedure:      data.procedure || '—',
    doctor:         data.doctor  || '—',
    preferred_date: data.date    || '—',
    preferred_time: data.time    || '—',
    message:        data.message || '—',
  };
  return sendEmail(EMAILJS_APPT_TMPL, params);
}

/* ------------------------------------------------------------------
   Newsletter email sender
   ------------------------------------------------------------------ */
function sendNewsletterEmail(subscriberEmail) {
  const now = new Date();
  const params = {
    to_email:         'info@aureaplastclinic.com',
    subject:          `New Newsletter Subscriber – ${subscriberEmail}`,
    subscriber_email: subscriberEmail,
    subscribed_at:    now.toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
  };
  return sendEmail(EMAILJS_NEWS_TMPL, params);
}

/* ==========================================================================
   APPOINTMENT WIZARD — enhanced logic
   ========================================================================== */
function initAppointmentWizard() {
  const wizard = document.querySelector('#appointmentWizard');
  if (!wizard) return;

  // Build dynamic time grid
  buildWizardTimeGrid();

  const steps = Array.from(wizard.querySelectorAll('.wizard-panel'));
  const dots  = Array.from(wizard.querySelectorAll('.wizard-step'));
  let current = 0;
  const state = { doctor: '', procedure: '', date: '', time: '' };

  // Time validation error element — inject below time grid
  const timeGrid = wizard.querySelector('.time-grid');
  let timeError = wizard.querySelector('#wizardTimeError');
  if (!timeError && timeGrid) {
    timeError = document.createElement('p');
    timeError.id = 'wizardTimeError';
    timeError.style.cssText = 'color:#c0503f; font-size:.82rem; margin-top:8px; display:none;';
    timeError.textContent = 'Please select an appointment time between 2:00 PM and 10:00 PM.';
    timeGrid.after(timeError);
  }

  function showStep(i) {
    steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    dots.forEach((d, idx) => {
      d.classList.toggle('is-active', idx === i);
      d.classList.toggle('is-done', idx < i);
    });
    if (i === steps.length - 1) fillReview();
    wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  wizard.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', () => {
    // On Step 4 (Date & Time panel, index 3), enforce time selection
    if (current === 3) {
      if (!state.time || !isValidClinicTime(state.time)) {
        if (timeError) { timeError.style.display = 'block'; }
        return;
      } else {
        if (timeError) { timeError.style.display = 'none'; }
      }
    }
    if (current < steps.length - 1) { current++; showStep(current); }
  }));

  wizard.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', () => {
    if (current > 0) { current--; showStep(current); }
  }));

  wizard.querySelectorAll('[data-doctor]').forEach(card => card.addEventListener('click', () => {
    wizard.querySelectorAll('[data-doctor]').forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    state.doctor = card.dataset.doctor;
  }));

  wizard.querySelectorAll('[data-procedure]').forEach(card => card.addEventListener('click', () => {
    wizard.querySelectorAll('[data-procedure]').forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    state.procedure = card.dataset.procedure;
  }));

  // Time chip selection (re-bind after dynamic build)
  wizard.querySelector('.time-grid')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.time-chip');
    if (!chip) return;
    wizard.querySelectorAll('.time-chip').forEach(c => c.classList.remove('is-selected'));
    chip.classList.add('is-selected');
    state.time = chip.dataset.time;
    if (timeError) timeError.style.display = 'none';
  });

  const dateInput = wizard.querySelector('#apptDate');
  dateInput && dateInput.addEventListener('change', () => state.date = dateInput.value);

  function fillReview() {
    const nameVal  = wizard.querySelector('#apptName')?.value  || '—';
    const phoneVal = wizard.querySelector('#apptPhone')?.value || '—';
    const emailVal = wizard.querySelector('#apptEmail')?.value || '—';
    const rows = {
      reviewName: nameVal, reviewPhone: phoneVal, reviewEmail: emailVal,
      reviewDoctor: state.doctor || '—', reviewProcedure: state.procedure || '—',
      reviewDate: formatDate(state.date) || '—', reviewTime: state.time || '—'
    };
    Object.entries(rows).forEach(([id, val]) => {
      const el = wizard.querySelector('#' + id);
      if (el) el.textContent = val;
    });
  }

  // File upload drag-drop
  const uploadDrop = wizard.querySelector('.upload-drop');
  const fileInput  = wizard.querySelector('#apptFiles');
  const fileList   = wizard.querySelector('.file-list');
  if (uploadDrop && fileInput) {
    uploadDrop.addEventListener('click', () => fileInput.click());
    ['dragenter', 'dragover'].forEach(evt => uploadDrop.addEventListener(evt, (e) => { e.preventDefault(); uploadDrop.classList.add('is-drag'); }));
    ['dragleave', 'drop'].forEach(evt => uploadDrop.addEventListener(evt, (e) => { e.preventDefault(); uploadDrop.classList.remove('is-drag'); }));
    uploadDrop.addEventListener('drop', (e) => { fileInput.files = e.dataTransfer.files; listFiles(); });
    fileInput.addEventListener('change', listFiles);
    function listFiles() {
      fileList.innerHTML = Array.from(fileInput.files).map(f => `<span><i class="fa-solid fa-paperclip"></i> ${f.name}</span>`).join('');
    }
  }

  // Form submit → send email
  const finalForm = wizard.querySelector('#appointmentForm');
  const submitBtn = finalForm?.querySelector('[type="submit"]');
  finalForm && finalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Final guard: ensure a valid time was selected
    if (!state.time || !isValidClinicTime(state.time)) {
      showStep(3);
      if (timeError) timeError.style.display = 'block';
      return;
    }

    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    }

    const data = {
      name:      wizard.querySelector('#apptName')?.value  || '',
      phone:     wizard.querySelector('#apptPhone')?.value || '',
      email:     wizard.querySelector('#apptEmail')?.value || '',
      doctor:    state.doctor,
      procedure: state.procedure,
      date:      formatDate(state.date),
      time:      state.time,
      message:   wizard.querySelector('textarea')?.value || '',
    };

    const result = await sendAppointmentEmail(data);

    if (result.ok) {
      wizard.querySelector('.wizard-progress').style.display = 'none';
      steps.forEach(s => s.style.display = 'none');
      wizard.querySelector('.appt-success').classList.add('is-visible');
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Confirm Booking <i class="fa-solid fa-check"></i>';
      }
      // Show user-friendly error
      let errEl = wizard.querySelector('#wizardSubmitError');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.id = 'wizardSubmitError';
        errEl.style.cssText = 'color:#c0503f; font-size:.85rem; margin-top:12px; text-align:center;';
        finalForm.querySelector('.wizard-actions').after(errEl);
      }
      errEl.textContent = 'Something went wrong. Please try again or contact us directly at info@aureaplastclinic.com.';
    }
  });

  showStep(0);
}

/* ==========================================================================
   CONTACT FORM — enhanced with time select + email
   ========================================================================== */
function initContactForm() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  // Replace time input with a select
  const timeField = form.querySelector('input[name="time"]');
  if (timeField) {
    const select = document.createElement('select');
    select.name = 'time';
    select.id   = 'contactTime';
    // Copy classes/styles if any
    buildTimeSelect(select);
    timeField.replaceWith(select);
  }

  // Inject validation error message element
  const timeSelect = form.querySelector('select[name="time"], #contactTime');
  let timeError = document.createElement('p');
  timeError.id = 'contactTimeError';
  timeError.style.cssText = 'color:#c0503f; font-size:.82rem; margin-top:4px; display:none;';
  timeError.textContent = 'Please select an appointment time between 2:00 PM and 10:00 PM.';
  timeSelect && timeSelect.parentElement.appendChild(timeError);

  // Validate on change
  timeSelect && timeSelect.addEventListener('change', () => {
    const val = timeSelect.value;
    if (val && !isValidClinicTime(val)) {
      timeError.style.display = 'block';
    } else {
      timeError.style.display = 'none';
    }
  });

  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Required field validation
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#c0503f';
      } else {
        field.style.borderColor = '';
      }
    });
    if (!valid) return;

    // Time validation
    const selectedTime = form.querySelector('select[name="time"]')?.value || '';
    if (selectedTime && !isValidClinicTime(selectedTime)) {
      timeError.style.display = 'block';
      return;
    }

    // Loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    }

    const data = {
      name:      form.querySelector('[name="name"]')?.value      || '',
      phone:     form.querySelector('[name="phone"]')?.value     || '',
      email:     form.querySelector('[name="email"]')?.value     || '',
      procedure: form.querySelector('[name="procedure"]')?.value || '',
      doctor:    form.querySelector('[name="doctor"]')?.value    || '',
      date:      form.querySelector('[name="date"]')?.value      || '',
      time:      selectedTime,
      message:   form.querySelector('[name="message"]')?.value   || '',
    };

    const result = await sendAppointmentEmail(data);

    if (result.ok) {
      form.style.display = 'none';
      const success = form.parentElement.querySelector('.form-success');
      success && success.classList.add('is-visible');
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Enquiry';
      }
      let errEl = form.querySelector('#contactSubmitError');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.id = 'contactSubmitError';
        errEl.style.cssText = 'color:#c0503f; font-size:.85rem; margin-top:12px; text-align:center;';
        submitBtn.after(errEl);
      }
      errEl.textContent = 'Something went wrong. Please try again or email us at info@aureaplastclinic.com.';
    }
  });
}

/* ==========================================================================
   NEWSLETTER FORM — send notification email on subscription
   ========================================================================== */
function initNewsletterForms() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button');
      const subscriberEmail = emailInput?.value?.trim() || '';

      if (!subscriberEmail) return;

      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

      const result = await sendNewsletterEmail(subscriberEmail);

      if (result.ok) {
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        if (emailInput) emailInput.value = '';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.disabled  = false;
        }, 2500);
      } else {
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        btn.disabled  = false;
        setTimeout(() => { btn.innerHTML = originalHTML; }, 2500);
        console.error('[Newsletter] Failed to send email:', result.error);
      }
    });
  });
}

/* ==========================================================================
   INIT — run when DOM is ready
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Initialise EmailJS if loaded
  if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  initAppointmentWizard();
  initContactForm();
  initNewsletterForms();
});
