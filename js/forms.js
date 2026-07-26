/* ==========================================================================
   AUREA PLAST — forms.js
   Handles:
     1. Appointment wizard time slots & submission
     2. Contact form time select & submission
     3. Newsletter subscription
   Email delivery:
     - Contact & Appointment forms → EmailJS (client-side, no server
       required). Credentials live in js/emailjs-config.js. The UI only
       shows a success state after EmailJS confirms the message was queued
       for delivery.
     - Newsletter subscription → existing lightweight backend endpoint.
   ========================================================================== */

const API_NEWSLETTER_ENDPOINT = 'api/newsletter.php';

/* Basic RFC-5322-ish email check — good enough for client-side UX gating;
   the real guarantee of deliverability still comes from EmailJS itself. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || '').trim());
}

/* ------------------------------------------------------------------
   Mirror name/email (and optionally a message-like field) into the hidden
   from_name / from_email / reply_to alias inputs present on both forms, so
   the EmailJS template can be authored with either naming convention
   ({{name}}/{{email}} or {{from_name}}/{{from_email}}/{{reply_to}}).
   ------------------------------------------------------------------ */
function syncEmailAliasFields(form, messageSourceSelector) {
  const nameVal  = form.querySelector('[name="name"]')?.value.trim()  || '';
  const emailVal = form.querySelector('[name="email"]')?.value.trim() || '';
  const fromName  = form.querySelector('[name="from_name"]');
  const fromEmail = form.querySelector('[name="from_email"]');
  const replyTo   = form.querySelector('[name="reply_to"]');
  if (fromName)  fromName.value  = nameVal;
  if (fromEmail) fromEmail.value = emailVal;
  if (replyTo)   replyTo.value   = emailVal;
  if (messageSourceSelector) {
    const messageField = form.querySelector('[name="message"]');
    const source = form.querySelector(messageSourceSelector);
    if (messageField && source) messageField.value = source.value;
  }
}

/* ------------------------------------------------------------------
   Guard against the EmailJS SDK or credentials not being ready yet.
   Returns a human-readable error string, or null if everything looks OK.
   ------------------------------------------------------------------ */
function emailjsReadinessError() {
  if (typeof emailjs === 'undefined') {
    return 'The messaging service could not load. Please check your connection and try again.';
  }
  if (typeof EMAILJS_PUBLIC_KEY === 'undefined' || !EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY.indexOf('YOUR_') === 0) {
    return 'Online booking is being finalised. Please contact us directly on WhatsApp or by phone for now.';
  }
  return null;
}

/* ------------------------------------------------------------------
   Show / clear an inline error banner next to a form's submit area.
   Creates the element on first use if it isn't already in the markup.
   ------------------------------------------------------------------ */
function getOrCreateErrorBanner(container, id) {
  let el = container.querySelector('#' + id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = 'form-error';
    el.setAttribute('role', 'alert');
    container.appendChild(el);
  }
  return el;
}
function showFormError(container, id, message) {
  const el = getOrCreateErrorBanner(container, id);
  el.textContent = message;
  el.classList.add('is-visible');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function clearFormError(container, id) {
  const el = container.querySelector('#' + id);
  if (el) el.classList.remove('is-visible');
}

/* ------------------------------------------------------------------
   Submit a payload to a backend endpoint and normalize the result.
   Accepts either a FormData (multipart, for file uploads) or a plain
   object (sent as JSON).
   ------------------------------------------------------------------ */
function submitToBackend(endpoint, payload) {
  const isFormData = payload instanceof FormData;
  const options = {
    method: 'POST',
    headers: isFormData ? { 'Accept': 'application/json' } : { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: isFormData ? payload : JSON.stringify(payload)
  };
  return fetch(endpoint, options)
    .then(r => r.json().catch(() => ({})).then(data => ({ httpOk: r.ok, data })))
    .then(({ httpOk, data }) => {
      if (httpOk && data && data.success) {
        return { success: true, message: data.message || 'Submitted successfully.' };
      }
      return {
        success: false,
        message: (data && data.message) || 'Something went wrong. Please try again or contact us directly on WhatsApp.',
        errors: (data && data.errors) || null
      };
    })
    .catch(err => {
      console.error('[Aurea Plast] Network error submitting form:', err);
      return { success: false, message: 'We could not reach the server. Please check your connection and try again.' };
    });
}

/* ------------------------------------------------------------------
   Generate 15-minute time slots: 2:00 PM → 10:00 PM
   ------------------------------------------------------------------ */
function generateTimeSlots() {
  const slots = [];
  for (let totalMin = 14 * 60; totalMin <= 22 * 60; totalMin += 15) {
    const h24  = Math.floor(totalMin / 60);
    const min  = totalMin % 60;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12  = h24 > 12 ? h24 - 12 : (h24 === 0 ? 12 : h24);
    slots.push(`${h12}:${String(min).padStart(2, '0')} ${ampm}`);
  }
  return slots;
}
const TIME_SLOTS = generateTimeSlots();

/* ------------------------------------------------------------------
   Build wizard time-chip grid
   ------------------------------------------------------------------ */
function buildWizardTimeGrid() {
  const grid = document.querySelector('#appointmentWizard .time-grid');
  if (!grid) return;
  grid.innerHTML = TIME_SLOTS.map(t =>
    `<div class="time-chip" data-time="${t}">${t}</div>`
  ).join('');
}

/* ------------------------------------------------------------------
   Populate a <select> with time slots
   ------------------------------------------------------------------ */
function populateTimeSelect(sel) {
  if (!sel) return;
  const existing = sel.value;
  sel.innerHTML = '<option value="">Select a time…</option>' +
    TIME_SLOTS.map(t => `<option value="${t}"${t === existing ? ' selected' : ''}>${t}</option>`).join('');
}

/* ------------------------------------------------------------------
   Format YYYY-MM-DD → "9 Jul 2026"
   ------------------------------------------------------------------ */
function readableDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  if (!y) return d;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

/* ==========================================================================
   APPOINTMENT WIZARD
   ========================================================================== */
function initAppointmentWizard() {
  const wizard = document.querySelector('#appointmentWizard');
  if (!wizard) return;

  /* --- Build time chips --- */
  buildWizardTimeGrid();

  /* --- State --- */
  const steps = Array.from(wizard.querySelectorAll('.wizard-panel'));
  const dots  = Array.from(wizard.querySelectorAll('.wizard-step'));
  let current = 0;
  const wState = { doctor: '', procedure: '', date: '', time: '' };

  /* --- Validation message --- */
  let timeError = document.getElementById('wizardTimeError');
  if (!timeError) {
    timeError = document.createElement('p');
    timeError.id = 'wizardTimeError';
    timeError.style.cssText = 'color:#c0503f;font-size:.82rem;margin-top:8px;display:none;';
    timeError.textContent = 'Please select an appointment time between 2:00 PM and 10:00 PM.';
    const grid = wizard.querySelector('.time-grid');
    if (grid) grid.after(timeError);
  }

  /* --- Show step --- */
  function showStep(i) {
    steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    dots.forEach((d, idx) => {
      d.classList.toggle('is-active', idx === i);
      d.classList.toggle('is-done', idx < i);
    });
    if (i === steps.length - 1) fillReview();
    wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* --- Next / Back --- */
  wizard.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Validate Step 1 (Patient Details)
      if (current === 0) {
        let valid = true;
        /* Use steps[0] directly rather than a ":first-child" CSS selector —
           the honeypot field and hidden mirror inputs that precede the
           panels in the DOM mean ".wizard-panel:first-child" never
           actually matches the Step-1 panel. */
        steps[0].querySelectorAll('[required]').forEach(field => {
          if (!field.value.trim()) {
            valid = false;
            field.style.borderColor = '#c0503f';
          } else {
            field.style.borderColor = '';
          }
        });
        const emailField = wizard.querySelector('#apptEmail');
        if (emailField && emailField.value.trim() && !isValidEmail(emailField.value)) {
          valid = false;
          emailField.style.borderColor = '#c0503f';
        }
        if (!valid) return;
      }
      // Validate Step 4 (Time)
      if (current === 3) {
        if (!wState.time) {
          timeError.style.display = 'block';
          return;
        }
        timeError.style.display = 'none';
      }
      if (current < steps.length - 1) { current++; showStep(current); }
    });
  });

  wizard.querySelectorAll('[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (current > 0) { current--; showStep(current); }
    });
  });

  /* --- Hidden fields mirroring wizard state, so EmailJS's sendForm() can
     pick up selections that aren't native form inputs (cards / chips). --- */
  const doctorField      = wizard.querySelector('#apptDoctorField');
  const procedureField   = wizard.querySelector('#apptProcedureField');
  const dateField        = wizard.querySelector('#apptDateField');
  const timeField        = wizard.querySelector('#apptTimeField');
  const attachmentsField = wizard.querySelector('#apptAttachmentsField');

  /* --- Doctor & procedure cards --- */
  wizard.querySelectorAll('[data-doctor]').forEach(card => {
    card.addEventListener('click', () => {
      wizard.querySelectorAll('[data-doctor]').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      wState.doctor = card.dataset.doctor;
      if (doctorField) doctorField.value = wState.doctor || 'No preference';
    });
  });
  wizard.querySelectorAll('[data-procedure]').forEach(card => {
    card.addEventListener('click', () => {
      wizard.querySelectorAll('[data-procedure]').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      wState.procedure = card.dataset.procedure;
      if (procedureField) procedureField.value = wState.procedure || '—';
    });
  });

  /* --- Time chip clicks (event delegation on the grid) --- */
  const timeGrid = wizard.querySelector('.time-grid');
  if (timeGrid) {
    timeGrid.addEventListener('click', e => {
      const chip = e.target.closest('.time-chip');
      if (!chip) return;
      wizard.querySelectorAll('.time-chip').forEach(c => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      wState.time = chip.dataset.time;
      if (timeField) timeField.value = wState.time || '—';
      timeError.style.display = 'none';
    });
  }

  /* --- Date input --- */
  const dateInput = wizard.querySelector('#apptDate');
  if (dateInput) {
    ['change', 'input'].forEach(evt => dateInput.addEventListener(evt, () => {
      wState.date = dateInput.value;
      if (dateField) dateField.value = readableDate(wState.date);
    }));
  }

  /* --- Re-derive wState (and the hidden mirror fields) directly from the
     DOM's current "is-selected" cards / inputs. This is a defensive
     safety net — it guarantees the Review panel and the email that gets
     sent always reflect exactly what's on screen, even if a click/change
     event was ever missed (e.g. programmatic form fills, browser quirks). --- */
  function syncWizardStateFromDom() {
    const selectedDoctor    = wizard.querySelector('[data-doctor].is-selected');
    const selectedProcedure = wizard.querySelector('[data-procedure].is-selected');
    const selectedTime      = wizard.querySelector('.time-chip.is-selected');
    if (selectedDoctor)    wState.doctor    = selectedDoctor.dataset.doctor;
    if (selectedProcedure) wState.procedure = selectedProcedure.dataset.procedure;
    if (selectedTime)      wState.time      = selectedTime.dataset.time;
    if (dateInput && dateInput.value) wState.date = dateInput.value;

    if (doctorField)     doctorField.value     = wState.doctor    || 'No preference';
    if (procedureField)  procedureField.value  = wState.procedure || '—';
    if (dateField)        dateField.value        = readableDate(wState.date);
    if (timeField)         timeField.value         = wState.time      || '—';
  }

  /* --- Fill review panel --- */
  function fillReview() {
    syncWizardStateFromDom();
    const map = {
      reviewName:      wizard.querySelector('#apptName')?.value  || '—',
      reviewPhone:     wizard.querySelector('#apptPhone')?.value || '—',
      reviewEmail:     wizard.querySelector('#apptEmail')?.value || '—',
      reviewDoctor:    wState.doctor    || '—',
      reviewProcedure: wState.procedure || '—',
      reviewDate:      readableDate(wState.date),
      reviewTime:      wState.time      || '—',
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = wizard.querySelector('#' + id);
      if (el) el.textContent = val;
    });
  }

  /* --- File upload (drag & drop) --- */
  const uploadDrop = wizard.querySelector('.upload-drop');
  const fileInput  = wizard.querySelector('#apptFiles');
  const fileList   = wizard.querySelector('.file-list');
  if (uploadDrop && fileInput) {
    uploadDrop.addEventListener('click', () => fileInput.click());
    ['dragenter','dragover'].forEach(ev =>
      uploadDrop.addEventListener(ev, e => { e.preventDefault(); uploadDrop.classList.add('is-drag'); }));
    ['dragleave','drop'].forEach(ev =>
      uploadDrop.addEventListener(ev, e => { e.preventDefault(); uploadDrop.classList.remove('is-drag'); }));
    uploadDrop.addEventListener('drop', e => { fileInput.files = e.dataTransfer.files; showFiles(); });
    fileInput.addEventListener('change', showFiles);
    function showFiles() {
      const files = Array.from(fileInput.files);
      fileList.innerHTML = files
        .map(f => `<span><i class="fa-solid fa-paperclip"></i> ${f.name}</span>`).join('');
      /* Note: EmailJS (client-side) reliably attaches one file per template
         attachment slot — it isn't a good fit for an arbitrary number of
         reference images. Instead we tell the clinic team, by name, which
         files the patient selected so they can follow up (e.g. via
         WhatsApp) to actually receive them. */
      if (attachmentsField) {
        attachmentsField.value = files.length
          ? `${files.length} reference image(s) selected by patient (not emailed automatically): ${files.map(f => f.name).join(', ')}. Please request these via WhatsApp/email if needed.`
          : 'No reference images attached.';
      }
    }
  }

  /* --- FORM SUBMIT (Confirm Booking button) --- */
  const finalForm = wizard.querySelector('#appointmentForm');
  const ERROR_ID = 'apptFormError';
  if (finalForm) {
    finalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();

      /* Prevent duplicate submissions (double-click / double Enter) */
      if (finalForm.dataset.submitting === 'true') return false;

      /* Guard: time must be selected */
      if (!wState.time) {
        showStep(3);
        timeError.style.display = 'block';
        return false;
      }

      const reviewPanel = steps[steps.length - 1];
      clearFormError(reviewPanel, ERROR_ID);

      /* Re-validate patient details (in case the browser back-navigated here) */
      const nameField  = wizard.querySelector('#apptName');
      const phoneField = wizard.querySelector('#apptPhone');
      const emailField = wizard.querySelector('#apptEmail');
      let valid = true;
      [nameField, phoneField, emailField].forEach(field => {
        if (field && !field.value.trim()) { valid = false; field.style.borderColor = '#c0503f'; }
      });
      if (emailField && emailField.value.trim() && !isValidEmail(emailField.value)) {
        valid = false;
        emailField.style.borderColor = '#c0503f';
      }
      if (!valid) {
        showStep(0);
        showFormError(steps[0], 'apptStep1Error', 'Please double-check your name, phone and a valid email address.');
        return false;
      }

      /* Honeypot: bots that auto-fill hidden fields get a silent "success" */
      const honeypot = wizard.querySelector('#apptWebsite');
      if (honeypot && honeypot.value) {
        finalForm.reset();
        const progressEl = wizard.querySelector('.wizard-progress');
        const successEl  = wizard.querySelector('.appt-success');
        if (progressEl) progressEl.style.display = 'none';
        steps.forEach(s => { s.style.display = 'none'; });
        if (successEl) successEl.classList.add('is-visible');
        return false;
      }

      const readiness = emailjsReadinessError();
      if (readiness) {
        showFormError(reviewPanel, ERROR_ID, readiness);
        return false;
      }

      const submitBtn = finalForm.querySelector('[type="submit"]');
      const origLabel = submitBtn ? submitBtn.innerHTML : '';
      finalForm.dataset.submitting = 'true';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
      }

      /* Make sure every hidden mirror field reflects the latest wizard state
         (covers the case where a field was the default/untouched value). */
      syncWizardStateFromDom();
      syncEmailAliasFields(finalForm, '#apptNotes');

      emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_APPOINTMENT, finalForm)
        .then(() => {
          const progressEl = wizard.querySelector('.wizard-progress');
          const successEl  = wizard.querySelector('.appt-success');
          if (progressEl) progressEl.style.display = 'none';
          steps.forEach(s => { s.style.display = 'none'; });
          if (successEl) successEl.classList.add('is-visible');
          finalForm.reset();
        })
        .catch(err => {
          console.error('[Aurea Plast] EmailJS appointment submission failed:', err);
          showFormError(reviewPanel, ERROR_ID, 'We could not send your appointment request. Please try again or contact us directly on WhatsApp.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origLabel;
          }
        })
        .finally(() => { finalForm.dataset.submitting = 'false'; });

      return false;
    });
  }

  showStep(0);
}

/* ==========================================================================
   CONTACT FORM
   ========================================================================== */
function initContactForm() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  /* Populate the time select (already in HTML as a <select id="contactTime">) */
  const timeSelect = form.querySelector('#contactTime, select[name="time"]');
  if (timeSelect && timeSelect.options.length <= 1) {
    populateTimeSelect(timeSelect);
  }

  const ERROR_ID = 'contactFormError';

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    /* Prevent duplicate submissions (double-click / double Enter) */
    if (form.dataset.submitting === 'true') return false;

    clearFormError(form, ERROR_ID);

    /* Required field validation */
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const empty = !field.value.trim();
      field.style.borderColor = empty ? '#c0503f' : '';
      if (empty) valid = false;
    });

    /* Email format validation */
    const emailField = form.querySelector('[name="email"]');
    if (emailField && emailField.value.trim() && !isValidEmail(emailField.value)) {
      emailField.style.borderColor = '#c0503f';
      valid = false;
    }

    if (!valid) {
      showFormError(form, ERROR_ID, 'Please fill in all required fields with a valid email address.');
      return false;
    }

    /* Honeypot: bots that auto-fill hidden fields get a silent "success" */
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) {
      form.reset();
      form.style.display = 'none';
      const success = form.parentElement.querySelector('.form-success');
      if (success) success.classList.add('is-visible');
      return false;
    }

    const readiness = emailjsReadinessError();
    if (readiness) {
      showFormError(form, ERROR_ID, readiness);
      return false;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    const origLabel = submitBtn ? submitBtn.innerHTML : '';
    form.dataset.submitting = 'true';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    }

    syncEmailAliasFields(form);

    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_CONTACT, form)
      .then(() => {
        form.style.display = 'none';
        const success = form.parentElement.querySelector('.form-success');
        if (success) success.classList.add('is-visible');
        form.reset();
      })
      .catch(err => {
        console.error('[Aurea Plast] EmailJS contact submission failed:', err);
        showFormError(form, ERROR_ID, 'We could not send your enquiry. Please try again or contact us directly on WhatsApp.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origLabel;
        }
      })
      .finally(() => { form.dataset.submitting = 'false'; });

    return false;
  }, true); /* capture phase */
}

/* ==========================================================================
   NEWSLETTER FORM
   ========================================================================== */
function initNewsletterForms() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button');
      const email = input?.value.trim() || '';
      if (!email) return;

      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

      submitToBackend(API_NEWSLETTER_ENDPOINT, { email }).then(result => {
        if (result.success) {
          btn.innerHTML = '<i class="fa-solid fa-check"></i>';
          if (input) input.value = '';
        } else {
          btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
          console.warn('[Aurea Plast] Newsletter subscription failed:', result.message);
        }
        setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 2500);
      });
    });
  });
}

/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function() {
  initAppointmentWizard();
  initContactForm();
  initNewsletterForms();
});
