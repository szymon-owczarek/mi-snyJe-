async function fetchGitHubData() {
    const username = 'szymon-owczarek';

    // Pobranie danych użytkownika
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    const userData = await userResponse.json();

    // Pobranie informacji o repozytoriach
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=5&sort=updated`);
    const reposData = await reposResponse.json();

    // Wyświetlenie danych użytkownika
    document.getElementById('profile-image').src = userData.avatar_url;
    document.getElementById('username').textContent = userData.login;
    document.getElementById('github-link').href = userData.html_url;

    // Wyświetlenie ostatnich projektów
    const projectsList = document.getElementById('projects-list');
    reposData.forEach(repo => {
        const projectItem = document.createElement('li');
        projectItem.className = 'project';
        projectItem.innerHTML = `<a href="${repo.html_url}" target="_blank">${repo.name}</a>
                                 <p>${repo.description || 'Brak opisu'}</p>`;
        projectsList.appendChild(projectItem);
    });
}

// Wywołanie funkcji po załadowaniu strony
fetchGitHubData();