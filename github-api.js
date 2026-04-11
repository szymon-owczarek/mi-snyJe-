// DEDYKOWANA KLASA GITHUB API DLA SZYMON-OWCZAREK

class GitHubProjectsFetcher {
    constructor(username = 'szymon-owczarek') {
        this.username = username;
        this.baseURL = 'https://api.github.com';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minut cache
    }

    // Główna funkcja pobierająca projekty
    async fetchProjects() {
        // Sprawdź cache
        const cachedData = this.getFromCache();
        if (cachedData) {
            return cachedData;
        }

        try {
            // Sprawdź czy użytkownik istnieje
            await this.verifyUser();

            // Pobierz projekty
            const projects = await this.getRepositories();

            // Przefiltruj i posortuj
            const processedProjects = this.processProjects(projects);

            // Zapisz do cache
            this.saveToCache(processedProjects);

            return processedProjects;

        } catch (error) {
            throw error;
        }
    }

    // Weryfikuj czy użytkownik istnieje
    async verifyUser() {
        const response = await fetch(`${this.baseURL}/users/${this.username}`, {
            headers: this.getHeaders()
        });

        if (response.status === 404) {
            throw new Error(`User ${this.username} was not found on GitHub`);
        }

        if (response.status === 403) {
            this.handleRateLimit(response);
            throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }

        if (!response.ok) {
            throw new Error(`github api errror: ${response.status} ${response.statusText}`);
        }

        const userData = await response.json();
        return userData;
    }

    // Pobierz repozytoria
    async getRepositories() {
        const endpoints = [
            `/users/${this.username}/repos?sort=updated&direction=desc&per_page=30`,
            `/users/${this.username}/repos?sort=pushed&direction=desc&per_page=30`,
            `/users/${this.username}/repos?sort=created&direction=desc&per_page=30`
        ];

        const uniqueProjects = new Map();

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${this.baseURL}${endpoint}`, {
                    headers: this.getHeaders()
                });

                if (response.status === 403) {
                    this.handleRateLimit(response);
                    continue;
                }

                if (!response.ok) {
                    continue;
                }

                const projects = await response.json();

                if (Array.isArray(projects) && projects.length > 0) {
                    projects.forEach(project => {
                        if (project && project.id) {
                            uniqueProjects.set(project.id, project);
                        }
                    });
                }

            } catch (error) {
                continue;
            }
        }

        if (uniqueProjects.size > 0) {
            return Array.from(uniqueProjects.values());
        }

        throw new Error('Unable to fetch repositories for user: ' + this.username);
    }

    // Przetwórz i posortuj projekty
    processProjects(projects) {
        // Filtruj tylko publiczne i nie-zforkowane repozytoria
        const publicProjects = projects.filter(project => !project.private && !project.fork);

        // Sortuj tak, aby nowe projekty były na górze
        const sortedProjects = publicProjects.sort((a, b) => {
            const createdDiff = new Date(b.created_at) - new Date(a.created_at);
            if (createdDiff !== 0) {
                return createdDiff;
            }
            return new Date(b.updated_at) - new Date(a.updated_at);
        });

        // Zwróć top 6 projektów
        const topProjects = sortedProjects.slice(0, 6);

        return topProjects.map(project => this.enrichProjectData(project));
    }

    // Oblicz punktację projektu - DODANA BRAKUJĄCA FUNKCJA
    calculateProjectScore(project) {
        let score = 0;
        
        // Punkty za gwiazdki
        score += project.stargazers_count * 10;
        
        // Punkty za forki
        score += project.forks_count * 5;
        
        // Punkty za rozmiar repozytorium
        score += Math.min(project.size / 100, 20);
        
        // Punkty za aktualność (ostatnia aktualizacja)
        const daysSinceUpdate = (new Date() - new Date(project.updated_at)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) score += 15;
        else if (daysSinceUpdate < 90) score += 10;
        else if (daysSinceUpdate < 365) score += 5;
        
        // Punkty za język programowania
        const languageBonus = {
            'JavaScript': 8,
            'TypeScript': 8,
            'HTML': 6,
            'CSS': 6,
            'PHP': 7,
            'Python': 8,
            'Java': 7,
            'C++': 7
        };
        score += languageBonus[project.language] || 3;
        
        // Punkty za opis
        if (project.description && project.description.length > 20) {
            score += 5;
        }
        
        // Punkty za homepage/demo
        if (project.homepage) {
            score += 8;
        }
        
        return Math.round(score);
    }

    enrichProjectData(project) {
        return {
            ...project,
            displayName: this.formatProjectName(project.name),
            relativeTime: this.getRelativeTime(project.created_at),
            languageColor: this.getLanguageColor(project.language),
            isRecent: this.isRecentProject(project.created_at),
            importance: this.calculateProjectScore(project)
        };
    }

    // Formatuj nazwę projektu
    formatProjectName(name) {
        return name
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Pobierz względny czas
    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       
        if (diffDays === 1) return 'Today';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
    }

    // Pobierz kolor języka
    getLanguageColor(language) {
        const colors = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#2b7489',
            'Python': '#3572A5',
            'Java': '#b07219',
            'C++': '#f34b7d',
            'PHP': '#4F5D95',
            'CSS': '#563d7c',
            'HTML': '#e34c26',
            'Vue': '#2c3e50',
            'React': '#61dafb',
            'Node.js': '#68a063'
        };
        return colors[language] || '#6c757d';
    }

    // Sprawdź czy projekt jest niedawny
    isRecentProject(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = (now - date) / (1000 * 60 * 60 * 24);
        return diffDays < 30;
    }

    // Pobierz nagłówki dla API
    getHeaders() {
        return {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Portfolio-Website-szymon-owczarek',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }

    // Obsługuj limit API
    handleRateLimit(response) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const remaining = response.headers.get('X-RateLimit-Remaining');
    }

    // Cache management
    getFromCache() {
        const cached = this.cache.get(this.username);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    saveToCache(data) {
        this.cache.set(this.username, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Wyczyść cache
    clearCache() {
        this.cache.clear();
    }
}
async function fetchSzymonOwczarekProjects() {
    const fetcher = new GitHubProjectsFetcher('szymon-owczarek');

    try {
        return await fetcher.fetchProjects();
    } catch (error) {
        return getFallbackProjects();
    }
}
// Fallback projekty w przypadku błędu API
function getFallbackProjects() {
    return [
        {
            name: 'portfolio-website',
            displayName: 'Portfolio Website',
            description: 'Responsive portfolio website built with HTML, CSS and JavaScript',
            html_url: 'https://github.com/szymon-owczarek/portfolio',
            language: 'JavaScript',
            languageColor: '#f1e05a',
            stargazers_count: 0,
            forks_count: 0,
            updated_at: new Date().toISOString(),
            relativeTime: 'new',
            isRecent: true,
            importance: 25
        },
    ];
}

// Funkcje pomocnicze dla wyświetlania błędów
function showNoProjects(container) {
    container.innerHTML = `
        <div class="no-projects" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <h3>No available projects/h3>
            <p>Projects coming sooon</p>
        </div>
    `;
}

function showProjectsError(container, errorMessage) {
    container.innerHTML = `
        <div class="projects-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <h3>Project loading error</h3>
            <p>Unable to load projects from github</p>
            <button onclick="retryLoadProjects()" class="btn-primary" style="margin-top: 20px;">
                Try again
            </button>
        </div>
    `;
}

// Funkcja retry
function retryLoadProjects() {
    loadGitHubProjects();
}

// ============================================
// GŁÓWNY KOD APLIKACJI
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize smooth animations with fade from below
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
            navbar.style.background = getNavbarBackgroundForTheme(true);
            if (scrollIndicator) scrollIndicator.classList.add('hidden');
        } else {
            navbar.style.background = getNavbarBackgroundForTheme(false);
            if (scrollIndicator) scrollIndicator.classList.remove('hidden');
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

function getNavbarBackgroundForTheme(isScrolled) {
    const isDark = document.body.classList.contains('theme-dark');
    if (isDark) {
        return isScrolled ? 'rgba(13, 17, 23, 0.95)' : 'rgba(22, 27, 34, 0.9)';
    }
    return isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)';
}

// ============================================
// GITHUB PROJECTS LOADING
// ============================================

async function loadGitHubProjects() {
    const projectsList = document.getElementById('projectsList');

    if (!projectsList) {
        return;
    }

    // Pokaż stan ładowania
    showProjectsLoading(projectsList);

    try {
        // Użyj dedykowanej funkcji dla konta szymon-owczarek
        const projects = await fetchSzymonOwczarekProjects();

        if (projects && projects.length > 0) {
            displayGitHubProjects(projects, projectsList);
        } else {
            showNoProjects(projectsList);
        }

    } catch (error) {
        showProjectsError(projectsList, error.message);
    }
}

// Pokaż stan ładowania projektów
function showProjectsLoading(container) {
    container.innerHTML = `
        <div class="projects-loading fade-in-up" style="grid-column: 1 / -1;">
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <h3>Ładowanie projektów...</h3>
            </div>
        </div>
    `;
}

// Wyświetl projekty GitHub
function displayGitHubProjects(projects, container) {
    container.innerHTML = '';

    // Wyświetl projekty z staggered fade-in animation
    projects.forEach((project, index) => {
        setTimeout(() => {
            const projectCard = createAdvancedProjectCard(project, index);
            projectCard.classList.add('fade-in-up');
            projectCard.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(projectCard);
        }, index * 150);
    });
}

// Stwórz zaawansowaną kartę projektu
function createAdvancedProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'project-item enhanced-project-card animate-on-scroll animate-fade-up visible';
    card.style.animationDelay = `${index * 0.1}s`;

    // Dodaj event listener dla kliknięcia
    card.addEventListener('click', () => {
        window.open(project.html_url, '_blank');
    });

    // Stwórz zawartość karty
    card.innerHTML = `
        <div class="project-header">
            <div class="project-title-section">
                <h3 class="project-name">${project.displayName || project.name}</h3>
                <div class="project-badges">
                    ${project.isRecent ? '<span class="badge recent-badge">🔥 Nowy</span>' : ''}
                </div>
            </div>
            <div class="project-language-indicator" style="background-color: ${project.languageColor || '#6c757d'}"></div>
        </div>
        
        <div class="project-description">
            ${project.description || 'Project without description. Check it out on GitHub!'}
        </div>
        
        <div class="project-footer">
            <div class="project-tech">
                ${project.language ? `<span class="tech-tag" style="border-color: ${project.languageColor}">${project.language}</span>` : ''}
            </div>
            <div class="project-updated">
                <span class="update-icon">🕒</span>
                <span class="update-text">Dodano: ${project.relativeTime || 'nieznana data'}</span>
            </div>
        </div>
        
        <div class="project-hover-overlay">
            <div class="hover-content">
                <span class="hover-text">Click to check it out on github</span>
                <span class="hover-icon">🔗</span>
            </div>
        </div>
    `;

    return card;
}

// Funkcja retry
function retryLoadProjects() {
    loadGitHubProjects();
}

// ============================================
// ENHANCED SCROLL ANIMATIONS
// ============================================

function initScrollAnimations() {
    // Dodaj klasy animacji do elementów
    addAnimationClasses();

    // Stwórz intersection observer dla animacji scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px', // Trigger earlier for better effect
        threshold: [0.1, 0.3, 0.5] // Multiple thresholds for smoother animations
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add staggered animation for multiple elements
                if (entry.target.classList.contains('animate-stagger')) {
                    animateStaggeredElements(entry.target);
                } else {
                    entry.target.classList.add('visible');
                }

                // Special handling for skills section
                if (entry.target.classList.contains('skills-section')) {
                    animateSkillBars(entry.target);
                }

                // Special handling for interests section
                if (entry.target.classList.contains('interests-section')) {
                    animateInterests(entry.target);
                }

                // Special handling for projects section
                if (entry.target.classList.contains('projects-section')) {
                    animateProjectsSection(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

function addAnimationClasses() {
    // Skills section animations
    const skillsSection = document.querySelector('.skills-section');
    if (skillsSection) {
        skillsSection.classList.add('animate-on-scroll', 'animate-fade-up');

        // Animate skills title
        const skillsTitle = skillsSection.querySelector('h2');
        if (skillsTitle) {
            skillsTitle.classList.add('animate-on-scroll', 'animate-scale');
        }

        // Animate individual skill items with stagger
        const skillItems = skillsSection.querySelectorAll('.skill-item');
        skillItems.forEach((item, index) => {
            item.classList.add('animate-on-scroll', 'animate-fade-up');
            item.classList.add(`delay-${Math.min(index + 1, 6)}`);
        });
    }

    // Projects section animations
    const projectsSection = document.querySelector('.projects-section');
    if (projectsSection) {
        projectsSection.classList.add('animate-on-scroll', 'animate-fade-up');

        // Animate projects title
        const projectsTitle = projectsSection.querySelector('h2');
        if (projectsTitle) {
            projectsTitle.classList.add('animate-on-scroll', 'animate-scale');
        }
    }

    // Interests section animations
    const interestsSection = document.querySelector('.interests-section');
    if (interestsSection) {
        interestsSection.classList.add('animate-on-scroll', 'animate-fade-up');

        // Animate interests title and subtitle
        const interestsTitle = interestsSection.querySelector('h2');
        if (interestsTitle) {
            interestsTitle.classList.add('animate-on-scroll', 'animate-scale');
        }

        // Animate interest items
        const interestItems = interestsSection.querySelectorAll('.interest-item');
        interestItems.forEach((item, index) => {
            item.classList.add('animate-on-scroll', 'animate-fade-up');
            item.classList.add(`delay-${Math.min(index + 1, 6)}`);
        });
    }

    // Hero section special animations
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        const profileCard = heroSection.querySelector('.profile-card');
        if (profileCard) {
            profileCard.classList.add('animate-hero-fade-up');
        }
    }
}

function animateStaggeredElements(container) {
    const children = container.querySelectorAll('.animate-on-scroll');
    children.forEach((child, index) => {
        setTimeout(() => {
            child.classList.add('visible');
        }, index * 100); // 100ms stagger
    });
}

function animateSkillBars(skillsSection) {
    const skillBars = skillsSection.querySelectorAll('.skill-progress');
    skillBars.forEach((bar, index) => {
        setTimeout(() => {
            const width = bar.getAttribute('data-width');
            bar.style.width = width;

            // Add glow effect during animation
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
        setTimeout(() => {
            item.classList.add('visible');
        }, index * 150);
    });
}

function animateProjectsSection(projectsSection) {
    // Already handled by displayGitHubProjects function
}

// ============================================
// ADDITIONAL EFFECTS
// ============================================

// Parallax effect for scroll
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax-element');

    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.2);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
});

// Enhanced hover effects for glass elements
document.querySelectorAll('.glass-effect').forEach(element => {
    element.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });

    element.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add floating background elements
function addFloatingElements() {
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        for (let i = 0; i < 3; i++) {
            const element = document.createElement('div');
            element.className = 'parallax-element';
            element.style.cssText = `
                position: absolute;
                width: 100px;
                height: 100px;
                background: radial-gradient(circle, rgba(130, 187, 234, 0.1) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                z-index: -1;
            `;

            // Random positioning
            element.style.left = `${Math.random() * 100}%`;
            element.style.top = `${Math.random() * 100}%`;

            heroSection.appendChild(element);
        }
    }
}

// Initialize floating elements when page loads
setTimeout(addFloatingElements, 1000);

// ============================================
// CSS ANIMATIONS VIA JAVASCRIPT
// ============================================

// Add CSS for fade-in-up animation
const fadeInUpCSS = `
    .fade-in-up {
        opacity: 0;
        transform: translateY(50px);
        animation: fadeInUp 0.8s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-fade-up {
        opacity: 0;
        transform: translateY(60px);
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .animate-fade-up.visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .animate-hero-fade-up {
        animation: heroFadeInUp 1.2s ease-out;
    }
    
    @keyframes heroFadeInUp {
        0% {
            opacity: 0;
            transform: translateY(60px) scale(0.95);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    /* Enhanced project card styles */
    .enhanced-project-card {
        position: relative;
        overflow: hidden;
    }
    
    .project-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
    }
    
    .project-title-section {
        flex: 1;
    }
    
    .project-badges {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        flex-wrap: wrap;
    }
    
    .badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .recent-badge {
        background: rgba(255, 99, 71, 0.15);
        color: #ff6347;
        border: 1px solid rgba(255, 99, 71, 0.3);
    }
    
    .project-language-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 4px;
    }
    
    .project-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid rgba(26, 34, 50, 0.1);
    }
    
    .tech-tag {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid;
    }
    
    .project-updated {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        opacity: 0.7;
    }
    
    .project-hover-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(130, 187, 234, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 16px;
    }
    
    .enhanced-project-card:hover .project-hover-overlay {
        opacity: 1;
    }
    
    .hover-content {
        text-align: center;
        color: white;
        font-weight: 600;
    }
    
    .hover-icon {
        display: block;
        font-size: 2rem;
        margin-top: 8px;
    }
    
    /* Loading states */
    .loading-spinner-container {
        text-align: center;
        padding: 40px 20px;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(130, 187, 234, 0.2);
        border-top: 4px solid #82bbea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .retry-button {
        background: linear-gradient(45deg, #82bbea, #1a2232);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 16px;
    }
    
    .retry-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(130, 187, 234, 0.3);
    }
`;

// Inject CSS styles
const styleSheet = document.createElement('style');
styleSheet.textContent = fadeInUpCSS;
document.head.appendChild(styleSheet);