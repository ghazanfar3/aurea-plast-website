/* ==========================================================================
   AUREA PLAST — forms.js
   Handles:
     1. Appointment wizard time slots & submission
     2. Contact form time select & submission
     3. Newsletter subscription
   Email delivery: formsubmit.co (free, no signup required)
   On first submission, formsubmit.co sends an activation email to
   info@aureaplastclinic.com — click the link once to enable all future emails.
   ========================================================================== */

const CLINIC_EMAIL = 'aureaplast@gmail.com';

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

/* ------------------------------------------------------------------
   Send data to formsubmit.co (free static-site email service)
   ------------------------------------------------------------------ */
function sendToFormsubmit(payload) {
  return fetch(`https://formsubmit.co/ajax/${CLINIC_EMAIL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ _captcha: 'false', ...payload })
  })
  .then(r => r.json())
  .then(r => ({ ok: r.success === 'true' || r.success === true }))
  .catch(err => { console.warn('[Formsubmit] error:', err); return { ok: false }; });
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
        wizard.querySelectorAll('.wizard-panel:first-child [required]').forEach(field => {
          if (!field.value.trim()) {
            valid = false;
            field.style.borderColor = '#c0503f';
          } else {
            field.style.borderColor = '';
          }
        });
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

  /* --- Doctor & procedure cards --- */
  wizard.querySelectorAll('[data-doctor]').forEach(card => {
    card.addEventListener('click', () => {
      wizard.querySelectorAll('[data-doctor]').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      wState.doctor = card.dataset.doctor;
    });
  });
  wizard.querySelectorAll('[data-procedure]').forEach(card => {
    card.addEventListener('click', () => {
      wizard.querySelectorAll('[data-procedure]').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      wState.procedure = card.dataset.procedure;
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
      timeError.style.display = 'none';
    });
  }

  /* --- Date input --- */
  const dateInput = wizard.querySelector('#apptDate');
  if (dateInput) {
    dateInput.addEventListener('change', () => { wState.date = dateInput.value; });
  }

  /* --- Fill review panel --- */
  function fillReview() {
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
      fileList.innerHTML = Array.from(fileInput.files)
        .map(f => `<span><i class="fa-solid fa-paperclip"></i> ${f.name}</span>`).join('');
    }
  }

  /* --- FORM SUBMIT (Confirm Booking button) --- */
  const finalForm = wizard.querySelector('#appointmentForm');
  if (finalForm) {
    finalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();

      /* Guard: time must be selected */
      if (!wState.time) {
        showStep(3);
        timeError.style.display = 'block';
        return false;
      }

      /* Collect all data */
      const name      = wizard.querySelector('#apptName')?.value.trim()  || '';
      const phone     = wizard.querySelector('#apptPhone')?.value.trim() || '';
      const email     = wizard.querySelector('#apptEmail')?.value.trim() || '';
      const doctor    = wState.doctor    || 'No preference';
      const procedure = wState.procedure || '—';
      const date      = readableDate(wState.date);
      const time      = wState.time;
      const message   = wizard.querySelector('textarea')?.value.trim()  || '';

      /* Show success screen IMMEDIATELY */
      const progressEl = wizard.querySelector('.wizard-progress');
      const successEl  = wizard.querySelector('.appt-success');
      if (progressEl) progressEl.style.display = 'none';
      steps.forEach(s => { s.style.display = 'none'; });
      if (successEl) successEl.classList.add('is-visible');

      /* Send email in background — fire and forget */
      sendToFormsubmit({
        _subject: `New Appointment Request – ${name}`,
        'Full Name':          name,
        'Phone':              phone,
        'Email':              email,
        'Preferred Doctor':   doctor,
        'Procedure':          procedure,
        'Preferred Date':     date,
        'Preferred Time':     time,
        'Message':            message || '(none)',
      });

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

  /* Override the default data-validate handler — use our own */
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    /* Required field validation */
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const empty = !field.value.trim();
      field.style.borderColor = empty ? '#c0503f' : '';
      if (empty) valid = false;
    });
    if (!valid) return false;

    const submitBtn = form.querySelector('[type="submit"]');
    const origLabel = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    }

    const name      = form.querySelector('[name="name"]')?.value.trim()      || '';
    const phone     = form.querySelector('[name="phone"]')?.value.trim()     || '';
    const email     = form.querySelector('[name="email"]')?.value.trim()     || '';
    const procedure = form.querySelector('[name="procedure"]')?.value        || '';
    const doctor    = form.querySelector('[name="doctor"]')?.value           || '';
    const date      = form.querySelector('[name="date"]')?.value             || '';
    const time      = (form.querySelector('#contactTime, select[name="time"]'))?.value || '';
    const message   = form.querySelector('[name="message"]')?.value.trim()  || '';

    sendToFormsubmit({
      _subject: `New Appointment Request – ${name}`,
      'Full Name':          name,
      'Phone':              phone,
      'Email':              email,
      'Procedure':          procedure || '(not specified)',
      'Preferred Doctor':   doctor    || 'No preference',
      'Preferred Date':     date      || '(not specified)',
      'Preferred Time':     time      || '(not specified)',
      'Message':            message   || '(none)',
    })
    .then(result => {
      /* Show success screen regardless (email may need one-time activation) */
      form.style.display = 'none';
      const success = form.parentElement.querySelector('.form-success');
      if (success) success.classList.add('is-visible');
    })
    .catch(() => {
      /* Still show success — email activates after first click by clinic */
      form.style.display = 'none';
      const success = form.parentElement.querySelector('.form-success');
      if (success) success.classList.add('is-visible');
    });

    return false;
  }, true); /* capture phase to run before the data-validate handler */
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

      const now = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });

      sendToFormsubmit({
        _subject: `New Newsletter Subscriber – ${email}`,
        'Subscriber Email': email,
        'Subscribed At':    now,
      })
      .finally(() => {
        /* Always show confirmation tick */
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        if (input) input.value = '';
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
