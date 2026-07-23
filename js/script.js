/* ==========================================================================
   AUREA PLAST — script.js
   Shared interactivity across all pages.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------- Preloader ---------------------------- */
  const loader = document.querySelector('.loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader && loader.classList.add('is-hidden'), 400);
  });
  // Fallback in case load already fired
  setTimeout(() => loader && loader.classList.add('is-hidden'), 2500);

  /* ---------------------------- Navbar ---------------------------- */
  const navbar = document.querySelector('.navbar');
  const onScrollNav = () => {
    if (!navbar) return;
    if (window.scrollY > 40) navbar.classList.add('is-scrolled');
    else navbar.classList.remove('is-scrolled');
  };
  document.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ========================== Search Overlay ========================== */
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput   = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchEmpty   = document.getElementById('searchEmpty');
  const searchClose   = document.getElementById('searchClose');

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput && searchInput.focus(), 80);
  }

  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (searchInput) { searchInput.value = ''; }
    if (searchResults) searchResults.innerHTML = '';
    if (searchEmpty)   searchEmpty.classList.remove('is-visible');
  }

  // Open on navbar search button click
  document.querySelectorAll('.icon-btn[aria-label="Search"]').forEach(btn => {
    btn.addEventListener('click', openSearch);
  });

  // Close button
  searchClose && searchClose.addEventListener('click', closeSearch);

  // Close on backdrop click
  searchOverlay && searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearch();
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay && searchOverlay.classList.contains('is-open')) {
      closeSearch();
    }
  });

  // Live search logic
  function runSearch(query) {
    if (!searchResults || !searchEmpty) return;
    query = query.trim().toLowerCase();
    if (!query) {
      searchResults.innerHTML = '';
      searchEmpty.classList.remove('is-visible');
      return;
    }

    // Build combined pool from data.js globals
    const allItems = [];
    if (typeof PLASTIC_SURGERY_PROCEDURES !== 'undefined') {
      PLASTIC_SURGERY_PROCEDURES.forEach(p => allItems.push({ ...p, page: 'plastic-surgery.html' }));
    }
    if (typeof AESTHETIC_PROCEDURES !== 'undefined') {
      AESTHETIC_PROCEDURES.forEach(p => allItems.push({ ...p, page: 'aesthetic-procedures.html' }));
    }

    const hits = allItems.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.cat.toLowerCase().includes(query) ||
      (p.overview && p.overview.toLowerCase().includes(query))
    ).slice(0, 10);

    if (hits.length === 0) {
      searchResults.innerHTML = '';
      searchEmpty.classList.add('is-visible');
      return;
    }

    searchEmpty.classList.remove('is-visible');
    searchResults.innerHTML = hits.map(p => `
      <a class="search-result-item" href="${p.page}" tabindex="0">
        <div class="search-result-item__icon"><i class="${p.icon}"></i></div>
        <div class="search-result-item__body">
          <div class="search-result-item__name">${p.name}</div>
          <div class="search-result-item__cat">${p.cat}</div>
        </div>
        <i class="fa-solid fa-arrow-right search-result-item__arrow"></i>
      </a>`).join('');
  }

  searchInput && searchInput.addEventListener('input', () => runSearch(searchInput.value));


  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeMobile = document.querySelector('.close-mobile');

  /* ====================== Mega Menu — robust hover + delay =====================
     Root cause of the bug was `top: calc(100% + 26px)` in CSS, creating a 26px
     invisible gap between the nav <li> and the dropdown. Moving the cursor into
     that gap fired mouseleave on .has-mega and hid the menu immediately.

     Fix strategy:
       1. CSS: menu now starts at top:100% (no gap). Visual spacing is padding-top.
       2. CSS: ::after bridge covers any residual gap while open.
       3. JS: .is-mega-open class drives visibility; 250ms close-delay timer
          prevents flickering on accidental cursor movement.
  ============================================================================ */
  document.querySelectorAll('.has-mega').forEach(li => {
    const menu = li.querySelector('.mega-menu');
    if (!menu) return;

    let closeTimer = null;

    function openMega() {
      clearTimeout(closeTimer);
      li.classList.add('is-mega-open');
      li.setAttribute('aria-expanded', 'true');
    }

    function scheduledClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        li.classList.remove('is-mega-open');
        li.setAttribute('aria-expanded', 'false');
      }, 250);
    }

    // Mouse events — covers the <li> and the menu (both are inside .has-mega)
    li.addEventListener('mouseenter', openMega);
    li.addEventListener('mouseleave', scheduledClose);

    // If cursor re-enters during the delay window, cancel the close
    menu.addEventListener('mouseenter', openMega);
    menu.addEventListener('mouseleave', scheduledClose);

    // Keyboard: Escape closes immediately
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearTimeout(closeTimer);
        li.classList.remove('is-mega-open');
        li.setAttribute('aria-expanded', 'false');
        li.querySelector('.nav-link')?.focus();
      }
    });

    // Touch: toggle on tap (mobile)
    li.querySelector('.nav-link')?.addEventListener('click', (e) => {
      // Only intercept if the mega menu is the destination (not a direct page link)
      if (window.innerWidth < 900) return; // mobile uses the mobile drawer instead
      if (!li.classList.contains('is-mega-open')) {
        e.preventDefault();
        openMega();
      }
    });
  });

  // Click outside closes all open mega menus immediately
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-mega')) {
      document.querySelectorAll('.has-mega.is-mega-open').forEach(li => {
        li.classList.remove('is-mega-open');
        li.setAttribute('aria-expanded', 'false');
      });
    }
  });

  menuToggle && menuToggle.addEventListener('click', () => mobileMenu.classList.add('is-open'));
  closeMobile && closeMobile.addEventListener('click', () => mobileMenu.classList.remove('is-open'));
  mobileMenu && mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('is-open')));

  /* ------------------------ Scroll progress bar ------------------------ */
  const progressBar = document.querySelector('.scroll-progress__bar');
  const updateProgress = () => {
    if (!progressBar) return;
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / ((h.scrollHeight - h.clientHeight) || 1) * 100;
    progressBar.style.width = scrolled + '%';
  };
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* -------------------------- Back to top -------------------------- */
  const fabTop = document.querySelector('.fab-top');
  document.addEventListener('scroll', () => {
    if (!fabTop) return;
    fabTop.classList.toggle('is-visible', window.scrollY > 700);
  }, { passive: true });
  fabTop && fabTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ----------------------------- Ripple ----------------------------- */
  document.querySelectorAll('.ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const dot = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      dot.className = 'ripple-dot';
      dot.style.width = dot.style.height = size + 'px';
      dot.style.left = (e.clientX - rect.left - size / 2) + 'px';
      dot.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(dot);
      setTimeout(() => dot.remove(), 650);
    });
  });

  /* ---------------------------- Accordion ---------------------------- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // close siblings within the same accordion group
      const group = item.closest('[data-accordion-group]');
      if (group) {
        group.querySelectorAll('.accordion-item.is-open').forEach(sib => {
          if (sib !== item) {
            sib.classList.remove('is-open');
            sib.querySelector('.accordion-panel').style.maxHeight = null;
          }
        });
      }
      item.classList.toggle('is-open', !isOpen);
      panel.style.maxHeight = !isOpen ? panel.scrollHeight + 'px' : null;
    });
  });

  /* ---------------------------- Counters ---------------------------- */
  const counters = document.querySelectorAll('[data-counter]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.counter);
      const decimals = (el.dataset.counter.split('.')[1] || '').length;
      const suffix = el.dataset.suffix || '';
      let start = 0;
      const duration = 1600;
      const startTime = performance.now();
      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = start + (target - start) * eased;
        el.textContent = value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

  /* ------------------------- Before/After slider ------------------------- */
  document.querySelectorAll('.ba-media').forEach(media => {
    const after = media.querySelector('.after');
    const handle = media.querySelector('.ba-handle');
    const range = media.querySelector('.ba-slider');
    const set = (pct) => {
      pct = Math.max(0, Math.min(100, pct));
      after.style.width = pct + '%';
      handle.style.left = pct + '%';
    };
    if (range) {
      range.addEventListener('input', () => set(range.value));
    }
    media.addEventListener('mousemove', (e) => {
      const rect = media.getBoundingClientRect();
      set(((e.clientX - rect.left) / rect.width) * 100);
    });
  });

  /* ------------------------------ Newsletter ------------------------------ */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      form.querySelector('input').value = '';
      setTimeout(() => btn.innerHTML = original, 1800);
    });
  });

  /* ------------------------------ Testimonials Swiper ------------------------------ */
  if (window.Swiper && document.querySelector('.testi-swiper')) {
    new Swiper('.testi-swiper', {
      slidesPerView: 1.05,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      breakpoints: {
        720: { slidesPerView: 2, spaceBetween: 24 },
        1080: { slidesPerView: 3, spaceBetween: 28 }
      },
      pagination: { el: '.testi-pagination', clickable: true },
    });
  }

  /* ------------------------------ Contact / generic form validation ------------------------------ */
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
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
      form.style.display = 'none';
      const success = form.parentElement.querySelector('.form-success');
      success && success.classList.add('is-visible');
    });
  });

  /* ============================ Procedure Grids ============================ */
  const iconWrap = (icon) => `<i class="${icon}"></i>`;

  function renderProcGrid({ gridSel, data, categories, filterSel, searchSel, noResultsSel }) {
    const grid = document.querySelector(gridSel);
    if (!grid) return;
    let activeCat = 'All';
    let query = '';

    function card(item, index) {
      const meta = item.duration
        ? `<span><i class="fa-regular fa-clock"></i> ${item.duration}</span><span><i class="fa-regular fa-calendar"></i> ${item.recovery || item.downtime}</span>`
        : '';
      return `<div class="card proc-card reveal" data-index="${index}" data-cat="${item.cat}" data-name="${item.name.toLowerCase()}">
        <div class="proc-card__media">${iconWrap(item.icon)}</div>
        <div class="proc-card__body">
          <span class="proc-card__cat">${item.cat}</span>
          <h4>${item.name}</h4>
          <div class="proc-card__meta">${meta}</div>
          <div class="proc-card__more">View Details <i class="fa-solid fa-arrow-right"></i></div>
        </div>
      </div>`;
    }

    function paint() {
      const filtered = data.map((d, i) => ({ ...d, _i: i })).filter(d => {
        const catOk = activeCat === 'All' || d.cat === activeCat;
        const qOk = !query || d.name.toLowerCase().includes(query);
        return catOk && qOk;
      });
      grid.innerHTML = filtered.map(d => card(d, d._i)).join('');
      const noRes = document.querySelector(noResultsSel);
      if (noRes) noRes.classList.toggle('is-visible', filtered.length === 0);
      grid.querySelectorAll('.proc-card').forEach(el => {
        el.addEventListener('click', () => openProcModal(data[parseInt(el.dataset.index)]));
        requestAnimationFrame(() => el.classList.add('in'));
      });
    }

    const filterBar = document.querySelector(filterSel);
    if (filterBar) {
      filterBar.innerHTML = ['All', ...categories].map(c =>
        `<button class="filter-chip ${c === 'All' ? 'is-active' : ''}" data-cat="${c}">${c}</button>`).join('');
      filterBar.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');
          activeCat = chip.dataset.cat;
          paint();
        });
      });
    }

    const searchInput = document.querySelector(searchSel);
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        query = searchInput.value.trim().toLowerCase();
        paint();
      });
    }

    paint();
  }

  let modalOverlay;
  function ensureModal() {
    if (modalOverlay) return modalOverlay;
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `<div class="modal-panel" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      <div class="modal-body"></div>
    </div>`;
    document.body.appendChild(modalOverlay);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    modalOverlay.querySelector('.modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    return modalOverlay;
  }
  function closeModal() { modalOverlay && modalOverlay.classList.remove('is-open'); document.body.style.overflow = ''; }

  function openProcModal(item) {
    const overlay = ensureModal();
    const body = overlay.querySelector('.modal-body');
    const isAesthetic = !!item.downtime;
    body.innerHTML = `
      <span class="eyebrow modal-cat">${item.cat}</span>
      <h3>${item.name}</h3>
      <div class="modal-quickfacts">
        <div class="qf-item"><div class="qf-label">Duration</div><div class="qf-value">${item.duration}</div></div>
        <div class="qf-item"><div class="qf-label">${isAesthetic ? 'Downtime' : 'Recovery'}</div><div class="qf-value">${isAesthetic ? item.downtime : item.recovery}</div></div>
        <div class="qf-item"><div class="qf-label">Ideal For</div><div class="qf-value">Consultation-based</div></div>
      </div>
      <div class="modal-section"><h5>Overview</h5><p>${item.overview}</p></div>
      <div class="modal-section"><h5>Benefits</h5><ul>${item.benefits.map(b => `<li><i class="fa-solid fa-circle"></i>${b}</li>`).join('')}</ul></div>
      <div class="modal-section"><h5>Ideal Candidate</h5><p>${item.candidate}</p></div>
      <div class="modal-section"><h5>${isAesthetic ? 'Expected Results' : 'Risks & Considerations'}</h5><p>${isAesthetic ? item.results : item.risks}</p></div>
      <div class="modal-section"><h5>FAQs</h5>${item.faqs.map(f => `<p><strong>${f.q}</strong><br>${f.a}</p>`).join('')}</div>
      <div class="modal-cta">
        <a href="appointment.html" class="btn btn-primary ripple">Book Consultation</a>
        <a href="contact.html" class="btn btn-outline">Ask a Question</a>
      </div>`;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  renderProcGrid({
    gridSel: '#plasticGrid', data: PLASTIC_SURGERY_PROCEDURES, categories: PLASTIC_SURGERY_CATEGORIES,
    filterSel: '#plasticFilters', searchSel: '#plasticSearch', noResultsSel: '#plasticNoResults'
  });
  renderProcGrid({
    gridSel: '#aestheticGrid', data: AESTHETIC_PROCEDURES, categories: AESTHETIC_CATEGORIES,
    filterSel: '#aestheticFilters', searchSel: '#aestheticSearch', noResultsSel: '#aestheticNoResults'
  });

  /* Home page: featured previews (first 4 of each) */
  const featPlastic = document.querySelector('#featPlasticGrid');
  if (featPlastic) {
    featPlastic.innerHTML = PLASTIC_SURGERY_PROCEDURES.slice(0, 4).map(item => `
      <div class="card feat-card reveal">
        <div class="icon-tile">${iconWrap(item.icon)}</div>
        <h4>${item.name}</h4>
        <p>${item.overview.slice(0, 86)}…</p>
        <a class="btn-ghost" href="plastic-surgery.html">Learn More <i class="fa-solid fa-arrow-right"></i></a>
      </div>`).join('');
  }
  const featAesthetic = document.querySelector('#featAestheticGrid');
  if (featAesthetic) {
    featAesthetic.innerHTML = AESTHETIC_PROCEDURES.slice(0, 4).map(item => `
      <div class="card feat-card reveal">
        <div class="icon-tile">${iconWrap(item.icon)}</div>
        <h4>${item.name}</h4>
        <p>${item.overview.slice(0, 86)}…</p>
        <a class="btn-ghost" href="aesthetic-procedures.html">Learn More <i class="fa-solid fa-arrow-right"></i></a>
      </div>`).join('');
  }

  /* ============================ Success Stories ============================ */
  const storyGrid = document.querySelector('#storyGrid');
  if (storyGrid) {
    let activeStoryCat = 'All';
    const storyFilters = document.querySelector('#storyFilters');
    const cats = ['All', 'Plastic Surgery', 'Aesthetic'];

    function storyCard(s) {
      return `<div class="card ba-card reveal">
        <div class="ba-media">
          <div class="before side"><span>Before</span></div>
          <div class="after"><span>After</span></div>
          <div class="ba-handle"><i class="fa-solid fa-arrows-left-right"></i></div>
          <input type="range" class="ba-slider" min="0" max="100" value="50" aria-label="Drag to compare before and after">
        </div>
        <div class="ba-body">
          <span class="ba-tag">${s.cat}</span>
          <h4>${s.proc}</h4>
          <div class="stars">${'★'.repeat(s.rating)}${'☆'.repeat(5 - s.rating)}</div>
          <p>“${s.review}”</p>
          <div class="ba-meta">
            <span><i class="fa-solid fa-bullseye"></i> ${s.goal}</span>
            <span><i class="fa-regular fa-clock"></i> Recovery: ${s.recovery}</span>
          </div>
        </div>
      </div>`;
    }
    function paintStories() {
      const filtered = SUCCESS_STORIES.filter(s => activeStoryCat === 'All' || s.cat === activeStoryCat);
      storyGrid.innerHTML = filtered.map(storyCard).join('');
      storyGrid.querySelectorAll('.ba-media').forEach(media => {
        const after = media.querySelector('.after');
        const handle = media.querySelector('.ba-handle');
        const range = media.querySelector('.ba-slider');
        const set = (pct) => { pct = Math.max(0, Math.min(100, pct)); after.style.width = pct + '%'; handle.style.left = pct + '%'; };
        range.addEventListener('input', () => set(range.value));
        media.addEventListener('mousemove', (e) => {
          const rect = media.getBoundingClientRect();
          set(((e.clientX - rect.left) / rect.width) * 100);
        });
      });
      storyGrid.querySelectorAll('.reveal').forEach(el => requestAnimationFrame(() => el.classList.add('in')));
    }
    if (storyFilters) {
      storyFilters.innerHTML = cats.map(c => `<button class="filter-chip ${c === 'All' ? 'is-active' : ''}" data-cat="${c}">${c}</button>`).join('');
      storyFilters.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          storyFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');
          activeStoryCat = chip.dataset.cat;
          paintStories();
        });
      });
    }
    paintStories();
  }

  /* ============================ Appointment Wizard ============================ */
  const wizard = document.querySelector('#appointmentWizard');
  if (wizard) {
    const steps = Array.from(wizard.querySelectorAll('.wizard-panel'));
    const dots = Array.from(wizard.querySelectorAll('.wizard-step'));
    let current = 0;
    const state = { doctor: '', procedure: '', date: '', time: '' };

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
    wizard.querySelectorAll('[data-time]').forEach(chip => chip.addEventListener('click', () => {
      wizard.querySelectorAll('[data-time]').forEach(c => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      state.time = chip.dataset.time;
    }));
    const dateInput = wizard.querySelector('#apptDate');
    dateInput && dateInput.addEventListener('change', () => state.date = dateInput.value);

    function fillReview() {
      const nameVal = wizard.querySelector('#apptName')?.value || '—';
      const phoneVal = wizard.querySelector('#apptPhone')?.value || '—';
      const emailVal = wizard.querySelector('#apptEmail')?.value || '—';
      const rows = {
        reviewName: nameVal, reviewPhone: phoneVal, reviewEmail: emailVal,
        reviewDoctor: state.doctor || '—', reviewProcedure: state.procedure || '—',
        reviewDate: state.date || '—', reviewTime: state.time || '—'
      };
      Object.entries(rows).forEach(([id, val]) => {
        const el = wizard.querySelector('#' + id);
        if (el) el.textContent = val;
      });
    }

    const uploadDrop = wizard.querySelector('.upload-drop');
    const fileInput = wizard.querySelector('#apptFiles');
    const fileList = wizard.querySelector('.file-list');
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

    const finalForm = wizard.querySelector('#appointmentForm');
    finalForm && finalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      wizard.querySelector('.wizard-progress').style.display = 'none';
      steps.forEach(s => s.style.display = 'none');
      wizard.querySelector('.appt-success').classList.add('is-visible');
    });

    showStep(0);
  }

});
