/* ==========================================================================
   AUREA PLAST — animations.js
   GSAP + AOS orchestration. Kept deliberate: one strong hero sequence,
   quiet scroll reveals elsewhere, respects reduced-motion.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------ AOS init ------------------------------ */
  if (window.AOS) {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      disable: reduceMotion,
    });
  }

  /* --------------------------- Fallback reveals -------------------------- */
  const revealItems = document.querySelectorAll('.reveal');
  if (revealItems.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(el => io.observe(el));
  }

  if (reduceMotion || !window.gsap) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------ Hero sequence ------------------------------ */
  const heroTitleLines = document.querySelectorAll('.hero__title .line span, .page-hero h1');
  if (heroTitleLines.length) {
    gsap.set(heroTitleLines, { yPercent: 110 });
    gsap.to(heroTitleLines, {
      yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.3
    });
  }
  gsap.from('.hero__eyebrow, .breadcrumb', { opacity: 0, y: 14, duration: 0.8, delay: 0.15 });
  gsap.from('.hero__lead, .page-hero p.lead', { opacity: 0, y: 18, duration: 0.9, delay: 0.55 });
  gsap.from('.hero__cta .btn', { opacity: 0, y: 18, duration: 0.8, delay: 0.75, stagger: 0.12 });
  gsap.from('.hero__side .hero__card', { opacity: 0, x: 26, duration: 0.9, delay: 0.5, stagger: 0.15 });
  gsap.from('.hero__frame', { opacity: 0, duration: 1.4, delay: 0.2 });

  const heroThreadPath = document.querySelector('.hero__thread path');
  if (heroThreadPath) {
    const len = heroThreadPath.getTotalLength();
    gsap.set(heroThreadPath, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(heroThreadPath, { strokeDashoffset: 0, duration: 1.2, delay: 0.9, ease: 'power2.out' });
  }

  /* --------------------------- Parallax hero bg --------------------------- */
  gsap.utils.toArray('.hero, .page-hero').forEach(hero => {
    const bg = hero.querySelector('.hero__bg');
    if (!bg) return;
    gsap.to(bg, {
      yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  });

  /* ------------------------------ Suture dividers ------------------------------ */
  document.querySelectorAll('.suture-divider path').forEach(path => {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0, duration: 1.1, ease: 'power2.out',
      scrollTrigger: { trigger: path, start: 'top 85%' }
    });
  });

  /* ------------------------------ Section fade/rise ------------------------------ */
  gsap.utils.toArray('.gsap-rise').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  gsap.utils.toArray('.gsap-stagger').forEach(group => {
    const kids = group.children;
    gsap.from(kids, {
      opacity: 0, y: 34, duration: 0.8, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: group, start: 'top 85%' }
    });
  });

  /* ------------------------------ Card image zoom on hover ------------------------------ */
  document.querySelectorAll('.proc-card').forEach(card => {
    const media = card.querySelector('[class*="media"]');
    if (!media) return;
    card.addEventListener('mouseenter', () => gsap.to(media, { scale: 1.06, duration: 0.6, ease: 'power2.out' }));
    card.addEventListener('mouseleave', () => gsap.to(media, { scale: 1, duration: 0.6, ease: 'power2.out' }));
    media.style.transformOrigin = 'center';
  });

  /* ------------------------------ Mouse follower (desktop, hero only) ------------------------------ */
  if (window.matchMedia('(pointer: fine)').matches) {
    const follower = document.createElement('div');
    follower.style.cssText = 'position:fixed;width:10px;height:10px;border-radius:50%;background:#C6A76A;pointer-events:none;z-index:9998;opacity:0;transform:translate(-50%,-50%);transition:opacity .3s;mix-blend-mode:difference;';
    document.body.appendChild(follower);
    let mx = 0, my = 0, fx = 0, fy = 0;
    const heroEl = document.querySelector('.hero, .page-hero');
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      const overHero = heroEl && e.clientY < heroEl.getBoundingClientRect().bottom;
      follower.style.opacity = overHero ? '0.6' : '0';
    });
    gsap.ticker.add(() => {
      fx += (mx - fx) * 0.16; fy += (my - fy) * 0.16;
      follower.style.left = fx + 'px'; follower.style.top = fy + 'px';
    });
  }

  /* ------------------------------ Stat band numbers subtle rise ------------------------------ */
  gsap.utils.toArray('.stat-band, .journey__track, .filter-bar').forEach(el => {
    gsap.from(el, { opacity: 0, y: 24, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

});
