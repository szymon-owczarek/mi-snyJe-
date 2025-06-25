// ============================================
// GŁÓWNY SKRYPT APLIKACJI
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicjalizacja animacji scroll
    initScrollAnimations();

    // Inicjalizacja efektu zmniejszania hero
    initHeroScrollEffect();

    // Menu hamburger
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Zamknij menu po kliknięciu w link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Efekt navbar przy przewijaniu
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        const scrollIndicator = document.querySelector('.scroll-indicator');

        if (window.scrollY > 50) {
            if (navbar) navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            if (scrollIndicator) scrollIndicator.classList.add('hidden');
        } else {
            if (navbar) navbar.style.background = 'rgba(255, 255, 255, 0.9)';
            if (scrollIndicator) scrollIndicator.classList.remove('hidden');
        }
    });

    // Smooth scroll dla linków nawigacji
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Aktywny link nawigacji
    updateActiveNavigation();
});

// Funkcja efektu zmniejszania zawartości hero przy scrollowaniu
function initHeroScrollEffect() {
    const heroSection = document.querySelector('.hero-section');
    const heroContent = document.querySelector('.hero-content');

    if (!heroSection || !heroContent) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const heroHeight = heroSection.offsetHeight;

        // Oblicz stopień przewinięcia (0-1)
        const scrollPercent = Math.min(scrolled / heroHeight, 1);

        // Oblicz skalę (od 1 do 0.3)
        const scale = 1 - (scrollPercent * 0.7);

        // Oblicz przezroczystość (od 1 do 0.1)
        const opacity = 1 - (scrollPercent * 0.9);

        // Zastosuj transformacje
        heroContent.style.transform = `scale(${scale})`;
        heroContent.style.opacity = opacity;

        // Dodatkowy efekt - zmniejsz również scroll indicator
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            scrollIndicator.style.opacity = 1 - (scrollPercent * 2);
        }
    });
}

// Funkcja aktualizacji aktywnej nawigacji
function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY <= sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Inicjalizacja animacji scroll
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Animacja pasków umiejętności
                if (entry.target.classList.contains('skills-section')) {
                    animateSkillBars();
                }
            }
        });
    }, observerOptions);

    // Obserwuj elementy z animacjami
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Dodaj klasy animacji
    addAnimationClasses();
}

// Dodaj klasy animacji do elementów
function addAnimationClasses() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('animate-on-scroll');
    });

    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach((item, index) => {
        item.classList.add('animate-on-scroll');
        item.style.transitionDelay = `${index * 0.1}s`;
    });
}

// Animacja pasków umiejętności
function animateSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach(bar => {
        const width = bar.getAttribute('data-width');
        if (width) {
            setTimeout(() => {
                bar.style.width = width;
            }, 500);
        }
    });
}