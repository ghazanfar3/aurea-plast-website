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
  if (window.innerWidth > 768) {
    gsap.from('.hero__frame', { opacity: 0, duration: 1.2, delay: 0.15 });
  }

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

    if (isDesktop) {
      /* Lightweight passive rAF parallax (desktop only, zero forced reflows) */
      const heroBg = document.querySelector('.hero .hero__bg, .page-hero .hero__bg');
      const heroMediaImg = document.querySelector('.hero .hero__media-img');
      if (heroBg || heroMediaImg) {
        let ticking = false;
        window.addEventListener('scroll', () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              const sy = window.scrollY;
              if (sy < 1000) {
                if (heroBg) heroBg.style.transform = `translate3d(0, ${sy * 0.12}px, 0)`;
                if (heroMediaImg) heroMediaImg.style.transform = `translate3d(0, ${sy * 0.06}px, 0) scale(1.03)`;
              }
              ticking = false;
            });
            ticking = true;
          }
        }, { passive: true });
      }
    }

    /* Suture dividers with IntersectionObserver (zero forced reflows) */
    const sutures = document.querySelectorAll('.suture-divider path');
    if (sutures.length && 'IntersectionObserver' in window) {
      const sutureObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out' });
            sutureObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      sutures.forEach(path => {
        try {
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          sutureObserver.observe(path);
        } catch(e) {}
      });
    }

    /* Section fade/rise with IntersectionObserver (zero forced reflows) */
    const riseItems = document.querySelectorAll('.gsap-rise, .gsap-stagger, .stat-band, .journey__track, .filter-bar');
    if (riseItems.length && 'IntersectionObserver' in window) {
      const riseObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.classList.contains('gsap-stagger')) {
              gsap.fromTo(el.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 });
            } else {
              gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' });
            }
            riseObserver.unobserve(el);
          }
        });
      }, { rootMargin: '0px 0px -40px 0px' });
      riseItems.forEach(el => riseObserver.observe(el));
    } else {
      riseItems.forEach(el => {
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

    /* Mouse follower (desktop only, using GPU transform and zero-reflow coordinate caching) */
    if (window.matchMedia('(min-width: 992px) and (pointer: fine)').matches) {
      const follower = document.createElement('div');
      follower.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px;border-radius:50%;background:#C6A76A;pointer-events:none;z-index:9998;opacity:0;will-change:transform;transition:opacity .3s;mix-blend-mode:difference;';
      document.body.appendChild(follower);
      let mx = -100, my = -100, fx = -100, fy = -100;
      let active = false, prevActive = false;
      const heroEl = document.querySelector('.hero, .page-hero');
      let heroBottom = 600;
      const updateHeroBottom = () => {
        if (heroEl) {
          heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
        }
      };
      updateHeroBottom();
      window.addEventListener('resize', updateHeroBottom, { passive: true });
      document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
        active = (window.scrollY + e.clientY) < heroBottom;
        if (active !== prevActive) {
          follower.style.opacity = active ? '0.6' : '0';
          prevActive = active;
        }
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
