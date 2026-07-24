/* ==========================================================================
   Clinic gallery lightbox + hero parallax helpers
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const galleryItems = Array.from(document.querySelectorAll('[data-lightbox]'));
  if (!galleryItems.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Clinic photo');
  lb.innerHTML = `
    <button type="button" class="lightbox__close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    <button type="button" class="lightbox__nav lightbox__prev" aria-label="Previous photo"><i class="fa-solid fa-chevron-left"></i></button>
    <button type="button" class="lightbox__nav lightbox__next" aria-label="Next photo"><i class="fa-solid fa-chevron-right"></i></button>
    <div class="lightbox__inner">
      <img src="" alt="">
      <div class="lightbox__caption"></div>
    </div>`;
  document.body.appendChild(lb);

  const imgEl = lb.querySelector('img');
  const captionEl = lb.querySelector('.lightbox__caption');
  let index = 0;

  const slides = galleryItems.map((el) => ({
    src: el.getAttribute('href') || el.dataset.full || '',
    alt: el.dataset.alt || el.querySelector('img')?.alt || 'Aurea Plast clinic',
    caption: el.dataset.caption || '',
  }));

  function show(i) {
    index = (i + slides.length) % slides.length;
    const s = slides[index];
    imgEl.src = s.src;
    imgEl.alt = s.alt;
    captionEl.textContent = s.caption;
  }

  function open(i) {
    show(i);
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  galleryItems.forEach((el, i) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      open(i);
    });
  });

  lb.querySelector('.lightbox__close').addEventListener('click', close);
  lb.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
  lb.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
});
