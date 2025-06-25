
document.addEventListener('DOMContentLoaded', function() {
    // Initialize smooth generate animations
    initScrollAnimations();

    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        const scrollIndicator = document.querySelector('.scroll-indicator');

        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            scrollIndicator.classList.add('hidden');
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.9)';
            scrollIndicator.classList.remove('hidden');
        }
    });

    // Smooth scroll for navigation links
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

    // Pobieranie projektów z GitHub - natychmiastowe wywołanie
    loadGitHubProjects();

    // Active navigation link
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
});

// Główna funkcja ładująca projekty GitHub
async function loadGitHubProjects() {
    const projectsList = document.getElementById('projectsList');

    if (!projectsList) {
        console.error('❌ Element #projectsList nie został znaleziony');
        return;
    }

    // Pokaż stan ładowania
    showProjectsLoading(projectsList);

    try {
        console.log('🚀 Rozpoczynam ładowanie projektów...');

        // Użyj dedykowanej funkcji dla konta szymon-owczarek
        const projects = await fetchSzymonOwczarekProjects();

        if (projects && projects.length > 0) {
            console.log(`✅ Załadowano ${projects.length} projektów`);
            displayGitHubProjects(projects, projectsList);
        } else {
            console.warn('⚠️ Brak projektów do wyświetlenia');
            showNoProjects(projectsList);
        }

    } catch (error) {
        console.error('❌ Błąd podczas ładowania projektów:', error);
        showProjectsError(projectsList, error.message);
    }
}

// Pokaż stan ładowania projektów
function showProjectsLoading(container) {
    container.innerHTML = `
        <div class="projects-loading" style="grid-column: 1 / -1;">
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <h3>Ładowanie projektów GitHub...</h3>
                <p>Pobieram najnowsze projekty z konta <strong>szymon-owczarek</strong></p>
            </div>
        </div>
    `;
}

// Wyświetl projekty GitHub
function displayGitHubProjects(projects, container) {
    container.innerHTML = '';

    // Dodaj nagłówek z informacją o sukcesie
    const successHeader = document.createElement('div');
    successHeader.className = 'projects-success-header';
    successHeader.style.cssText = `
        grid-column: 1 / -1;
        background: rgba(40, 167, 69, 0.1);
        border-radius: 12px;
        padding: 15px 20px;
        margin-bottom: 24px;
        text-align: center;
        border: 1px solid rgba(40, 167, 69, 0.2);
    `;
    successHeader.innerHTML = `
        <p style="color: #28a745; font-weight: 600; margin: 0;">
            ✅ Pomyślnie załadowano ${projects.length} projektów z GitHub
        </p>
    `;
    container.appendChild(successHeader);

    // Wyświetl projekty z animacją
    projects.forEach((project, index) => {
        setTimeout(() => {
            const projectCard = createAdvancedProjectCard(project, index);
            container.appendChild(projectCard);
        }, index * 150);
    });
}

// Stwórz zaawansowaną kartę projektu
function createAdvancedProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'project-item enhanced-project-card animate-on-scroll animate-scale visible';
    card.style.animationDelay = `${index * 0.1}s`;

    // Dodaj event listener dla kliknięcia
    card.addEventListener('click', () => {
        window.open(project.html_url, '_blank');

        // Analytics tracking (optional)
        console.log(`🔗 Otwarto projekt: ${project.name}`);
    });

    // Stwórz zawartość karty
    card.innerHTML = `
        <div class="project-header">
            <div class="project-title-section">
                <h3 class="project-name">${project.displayName || project.name}</h3>
                <div class="project-badges">
                    ${project.isRecent ? '<span class="badge recent-badge">🔥 Nowy</span>' : ''}
                    ${project.stargazers_count > 10 ? '<span class="badge popular-badge">⭐ Popularny</span>' : ''}
                </div>
            </div>
            <div class="project-language-indicator" style="background-color: ${project.languageColor}"></div>
        </div>
        
        <div class="project-description">
            ${project.description || 'Projekt bez opisu - sprawdź kod aby dowiedzieć się więcej!'}
        </div>
        
        <div class="project-stats-grid">
            <div class="stat-item">
                <span class="stat-icon">⭐</span>
                <span class="stat-value">${project.stargazers_count}</span>
                <span class="stat-label">Stars</span>
            </div>
            <div class="stat-item">
                <span class="stat-icon">🍴</span>
                <span class="stat-value">${project.forks_count}</span>
                <span class="stat-label">Forks</span>
            </div>
            <div class="stat-item">
                <span class="stat-icon">📊</span>
                <span class="stat-value">${project.sizeFormatted}</span>
                <span class="stat-label">Size</span>
            </div>
        </div>
        
        <div class="project-footer">
            <div class="project-tech">
                ${project.language ? `<span class="tech-tag" style="border-color: ${project.languageColor}">${project.language}</span>` : ''}
            </div>
            <div class="project-updated">
                <span class="update-icon">🕒</span>
                <span class="update-text">${project.relativeTime}</span>
            </div>
        </div>
        
        <div class="project-hover-overlay">
            <div class="hover-content">
                <span class="hover-text">Kliknij aby zobaczyć na GitHub</span>
                <span class="hover-icon">🔗</span>
            </div>
        </div>
    `;

    return card;
}

// Pokaż brak projektów
function showNoProjects(container) {
    container.innerHTML = `
        <div class="no-projects-message" style="grid-column: 1 / -1;">
            <div class="no-projects-content">
                <div class="no-projects-icon">📁</div>
                <h3>Brak dostępnych projektów</h3>
                <p>Nie znaleziono publicznych repozytoriów dla użytkownika <strong>szymon-owczarek</strong></p>
                <button onclick="retryLoadProjects()" class="retry-button">
                    🔄 Spróbuj ponownie
                </button>
            </div>
        </div>
    `;
}

// Pokaż błąd projektów
function showProjectsError(container, errorMessage) {
    container.innerHTML = `
        <div class="projects-error-message" style="grid-column: 1 / -1;">
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h3>Błąd podczas ładowania projektów</h3>
                <p class="error-details">${errorMessage}</p>
                <div class="error-suggestions">
                    <p><strong>Możliwe przyczyny:</strong></p>
                    <ul>
                        <li>Problemy z połączeniem internetowym</li>
                        <li>Przekroczenie limitu API GitHub</li>
                        <li>Repozytoria są prywatne</li>
                        <li>Nazwa użytkownika została zmieniona</li>
                    </ul>
                </div>
                <button onclick="retryLoadProjects()" class="retry-button">
                    🔄 Spróbuj ponownie
                </button>
            </div>
        </div>
    `;
}

// Funkcja retry
function retryLoadProjects() {
    console.log('🔄 Ponawiam ładowanie projektów...');
    loadGitHubProjects();
}

// Reszta funkcji pozostaje bez zmian...
// [Wszystkie pozostałe funkcje z poprzedniego kodu]

// Smooth Generate Animation System
function initScrollAnimations() {
    addAnimationClasses();

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                if (entry.target.classList.contains('skills-section')) {
                    animateSkillBars(entry.target);
                }

                if (entry.target.classList.contains('interests-section')) {
                    animateInterests(entry.target);
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

function addAnimationClasses() {
    const skillsSection = document.querySelector('.skills-section');
    if (skillsSection) {
        skillsSection.classList.add('animate-on-scroll', 'animate-fade');

        const skillsTitle = skillsSection.querySelector('h2');
        if (skillsTitle) {
            skillsTitle.classList.add('animate-on-scroll', 'animate-scale');
        }

        const skillItems = skillsSection.querySelectorAll('.skill-item');
        skillItems.forEach((item, index) => {
            item.classList.add('animate-on-scroll');
            if (index % 2 === 0) {
                item.classList.add('animate-from-left');
            } else {
                item.classList.add('animate-from-right');
            }
            item.classList.add(`delay-${Math.min(index + 1, 6)}`);
        });
    }

    const projectsSection = document.querySelector('.projects-section');
    if (projectsSection) {
        projectsSection.classList.add('animate-on-scroll', 'animate-fade');

        const projectsTitle = projectsSection.querySelector('h2');
        if (projectsTitle) {
            projectsTitle.classList.add('animate-on-scroll', 'animate-scale');
        }
    }

    const interestsSection = document.querySelector('.interests-section');
    if (interestsSection) {
        interestsSection.classList.add('animate-on-scroll', 'animate-fade');

        const interestsTitle = interestsSection.querySelector('h2');
        const interestsSubtitle = interestsSection.querySelector('.interests-subtitle');
        if (interestsTitle) {
            interestsTitle.classList.add('animate-on-scroll', 'animate-scale');
        }
        if (interestsSubtitle) {
            interestsSubtitle.classList.add('animate-on-scroll', 'animate-fade', 'delay-1');
        }
    }
}

function animateSkillBars(skillsSection) {
    const skillBars = skillsSection.querySelectorAll('.skill-progress');
    skillBars.forEach((bar, index) => {
        setTimeout(() => {
            const width = bar.getAttribute('data-width');
            bar.style.width = width;

            bar.style.boxShadow = '0 0 20px rgba(130, 187, 234, 0.4)';
            setTimeout(() => {
                bar.style.boxShadow = '0 0 10px rgba(130, 187, 234, 0.2)';
            }, 1500);
        }, index * 200);
    });
}

function animateInterests(interestsSection) {
    const interestItems = interestsSection.querySelectorAll('.interest-item');
    interestItems.forEach((item, index) => {
        item.classList.add('animate-on-scroll', 'animate-scale');
        item.classList.add(`delay-${Math.min(index + 1, 6)}`);

        setTimeout(() => {
            item.classList.add('visible');
        }, index * 150);
    });
}

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax-element');

    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.2);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
});

document.querySelectorAll('.glass-effect').forEach(element => {
    element.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });

    element.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

function addFloatingElements() {
    const heroSection = document.querySelector('.hero-section');

    for (let i = 0; i < 3; i++) {
        const element = document.createElement('div');
        element.className = 'parallax-element';
        heroSection.appendChild(element);
    }
}

setTimeout(addFloatingElements, 1000);