/* ==========================================================================
   AUREA PLAST — animations.js
   GSAP orchestration. Kept deliberate: one strong hero sequence,
   quiet scroll reveals elsewhere, respects reduced-motion.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const isMobile = window.innerWidth <= 768;
  if (reduceMotion || !window.gsap || isMobile) return;

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ------------------------------ Hero sequence ------------------------------ */
  const heroTitleLines = document.querySelectorAll('.hero__title .line span, .page-hero h1');
  if (heroTitleLines.length) {
    gsap.fromTo(heroTitleLines,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.15 }
    );
  }
  gsap.from('.hero__eyebrow, .breadcrumb', { opacity: 0, y: 14, duration: 0.7, delay: 0.1 });
  gsap.from('.hero__lead, .page-hero p.lead', { opacity: 0, y: 16, duration: 0.8, delay: 0.35 });
  gsap.from('.hero__cta .btn', { opacity: 0, y: 16, duration: 0.7, delay: 0.5, stagger: 0.1 });
  gsap.from('.hero__side .hero__card', { opacity: 0, x: 24, duration: 0.8, delay: 0.4, stagger: 0.12 });
  gsap.from('.hero__frame', { opacity: 0, duration: 1.2, delay: 0.15 });

  const isDesktop = window.innerWidth > 768;

  /* Defer non-critical scroll triggers to unblock main thread */
  const initScrollAnimations = () => {
    const heroThreadPath = document.querySelector('.hero__thread path');
    if (heroThreadPath) {
      try {
        const len = heroThreadPath.getTotalLength();
        gsap.set(heroThreadPath, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(heroThreadPath, { strokeDashoffset: 0, duration: 1.2, delay: 0.4, ease: 'power2.out' });
      } catch(e) {}
    }

    if (isDesktop && window.ScrollTrigger) {
      /* Parallax hero bg (desktop only) */
      gsap.utils.toArray('.hero, .page-hero').forEach(hero => {
        const bg = hero.querySelector('.hero__bg');
        if (bg) {
          gsap.to(bg, {
            yPercent: 12, ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
          });
        }
        const mediaImg = hero.querySelector('.hero__media-img');
        if (mediaImg) {
          gsap.fromTo(mediaImg,
            { yPercent: -2, scale: 1.03 },
            {
              yPercent: 5, scale: 1.06, ease: 'none',
              scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
            }
          );
        }
      });
    }

    /* Suture dividers */
    document.querySelectorAll('.suture-divider path').forEach(path => {
      try {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        if (window.ScrollTrigger) {
          gsap.to(path, {
            strokeDashoffset: 0, duration: 1.1, ease: 'power2.out',
            scrollTrigger: { trigger: path, start: 'top 85%' }
          });
        }
      } catch(e) {}
    });

    /* Section fade/rise with ScrollTrigger.batch */
    if (window.ScrollTrigger) {
      ScrollTrigger.batch('.gsap-rise', {
        interval: 0.1,
        batchMax: 6,
        start: 'top 88%',
        once: true,
        onEnter: batch => gsap.fromTo(batch, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 })
      });

      ScrollTrigger.batch('.gsap-stagger', {
        interval: 0.1,
        batchMax: 4,
        start: 'top 85%',
        once: true,
        onEnter: batch => {
          batch.forEach(group => {
            gsap.fromTo(group.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 });
          });
        }
      });

      gsap.utils.toArray('.stat-band, .journey__track, .filter-bar').forEach(el => {
        gsap.from(el, { opacity: 0, y: 24, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
    } else {
      /* Fallback for when ScrollTrigger is not loaded */
      document.querySelectorAll('.gsap-rise, .gsap-stagger').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }

    /* Card image zoom on hover (desktop only) */
    if (isDesktop) {
      document.querySelectorAll('.proc-card').forEach(card => {
        const media = card.querySelector('[class*="media"]');
        if (!media) return;
        card.addEventListener('mouseenter', () => gsap.to(media, { scale: 1.06, duration: 0.6, ease: 'power2.out' }));
        card.addEventListener('mouseleave', () => gsap.to(media, { scale: 1, duration: 0.6, ease: 'power2.out' }));
        media.style.transformOrigin = 'center';
      });
    }

    /* Mouse follower (desktop only, using GPU transform) */
    if (window.matchMedia('(min-width: 992px) and (pointer: fine)').matches) {
      const follower = document.createElement('div');
      follower.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px;border-radius:50%;background:#C6A76A;pointer-events:none;z-index:9998;opacity:0;will-change:transform;transition:opacity .3s;mix-blend-mode:difference;';
      document.body.appendChild(follower);
      let mx = -100, my = -100, fx = -100, fy = -100;
      let active = false;
      const heroEl = document.querySelector('.hero, .page-hero');
      let heroBottom = heroEl ? heroEl.offsetHeight : 600;
      const updateHeroBottom = () => {
        if (heroEl) heroBottom = heroEl.getBoundingClientRect().bottom + window.scrollY;
      };
      window.addEventListener('resize', updateHeroBottom, { passive: true });
      window.addEventListener('scroll', updateHeroBottom, { passive: true });
      document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
        active = (window.scrollY + e.clientY) < heroBottom;
        follower.style.opacity = active ? '0.6' : '0';
      }, { passive: true });
      gsap.ticker.add(() => {
        if (active || follower.style.opacity !== '0') {
          fx += (mx - fx) * 0.16; fy += (my - fy) * 0.16;
          follower.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
        }
      });
    }
  };

  /* Schedule scroll animations after initial paint */
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initScrollAnimations, { timeout: 200 });
  } else {
    setTimeout(initScrollAnimations, 60);
  }
});
