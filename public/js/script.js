const THEME_STORAGE_KEY = 'cse-motors-theme';

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initUpgradeCarousel();
});

function initThemeToggle() {
  const toggleButton = document.querySelector('.theme-toggle');
  if (!toggleButton) return;

  const body = document.body;
  const icon = toggleButton.querySelector('.theme-toggle__icon');
  const label = toggleButton.querySelector('.theme-toggle__label');
  const heroImage = document.querySelector('[data-hero-image]');
  const heroImageConfig = heroImage
    ? {
        lightSrc:
          heroImage.getAttribute('data-light-src') || heroImage.getAttribute('src'),
        darkSrc:
          heroImage.getAttribute('data-dark-src') ||
          heroImage.getAttribute('data-light-src') ||
          heroImage.getAttribute('src'),
        lightAlt: heroImage.getAttribute('data-light-alt') || heroImage.getAttribute('alt'),
        darkAlt:
          heroImage.getAttribute('data-dark-alt') || heroImage.getAttribute('alt'),
      }
    : null;

  const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialIsDark = storedPreference ? storedPreference === 'dark' : prefersDark;

  applyTheme(initialIsDark, { persist: Boolean(storedPreference) });

  toggleButton.addEventListener('click', () => {
    const isDark = body.classList.contains('dark-mode');
    applyTheme(!isDark, { persist: true });
  });

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (event) => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) return;
      applyTheme(event.matches, { persist: false });
    });
  }

  function applyTheme(useDark, { persist } = { persist: true }) {
    body.classList.toggle('dark-mode', useDark);
    updateHeroImage(useDark);
    toggleButton.setAttribute('aria-pressed', String(useDark));
    if (icon) {
      icon.textContent = useDark ? '☀️' : '🌙';
    }
    if (label) {
      label.textContent = useDark ? 'Light mode' : 'Dark mode';
    }
    toggleButton.setAttribute('aria-label', useDark ? 'Activate light mode' : 'Activate dark mode');
    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, useDark ? 'dark' : 'light');
    } else {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }
  }

   function updateHeroImage(useDark) {
    if (!heroImage || !heroImageConfig) return;

    const targetSrc = useDark ? heroImageConfig.darkSrc : heroImageConfig.lightSrc;
    if (targetSrc && heroImage.getAttribute('src') !== targetSrc) {
      heroImage.setAttribute('src', targetSrc);
    }

    const targetAlt = useDark ? heroImageConfig.darkAlt : heroImageConfig.lightAlt;
    if (targetAlt && heroImage.getAttribute('alt') !== targetAlt) {
      heroImage.setAttribute('alt', targetAlt);
    }
  }
}

function initUpgradeCarousel() {
  const carousel = document.querySelector('.upgrade-carousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.upgrade-slide'));
  const prevButton = document.querySelector('.carousel-control--prev');
  const nextButton = document.querySelector('.carousel-control--next');

  if (!slides.length || !prevButton || !nextButton) return;

  let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
  if (activeIndex === -1) activeIndex = 0;

  slides.forEach((slide, index) => {
    slide.setAttribute('aria-hidden', index === activeIndex ? 'false' : 'true');
  });

  const autoplayDelay = 6000;
  let autoplayId = null;

  const showSlide = (index) => {
    slides[activeIndex].classList.remove('is-active');
    slides[activeIndex].setAttribute('aria-hidden', 'true');
    activeIndex = (index + slides.length) % slides.length;
    slides[activeIndex].classList.add('is-active');
    slides[activeIndex].setAttribute('aria-hidden', 'false');
  };

  const nextSlide = () => showSlide(activeIndex + 1);
  const previousSlide = () => showSlide(activeIndex - 1);

  const startAutoplay = () => {
    stopAutoplay();
    autoplayId = window.setInterval(nextSlide, autoplayDelay);
  };

  const stopAutoplay = () => {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  };

  nextButton.addEventListener('click', () => {
    nextSlide();
    startAutoplay();
  });

  prevButton.addEventListener('click', () => {
    previousSlide();
    startAutoplay();
  });

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextButton.click();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prevButton.click();
    }
  });

  carousel.setAttribute('tabindex', '0');

  startAutoplay();
}