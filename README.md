# Portfolio - Szymon Owczarek

A portfolio website built with plain HTML, CSS, and JavaScript. The site presents a landing page, skills and interests sections, and a GitHub projects panel that loads public repositories from the GitHub API.

## Features

- Responsive single-page layout with smooth scroll and additional animations triggered by scrolling
- Light and dark theme toggle with preference
- Skills, learning, interests, and about sections
- GitHub projects section that fetches public repositories from my account
- Loading, empty state, and error state handling for the repository list

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub REST API

## Project Structure

- `index.html` - main page markup
- `style.css` - site styling and animations
- `script.js` - UI interactions and scroll behavior
- `github-api.js` - GitHub repository fetching, caching, and rendering helpers
- image assets - profile and interest images used by the page

### Install

```bash
npm install
```

### Run Locally

Start a local server:

```bash
npm run start
```

Or launch the project with live reload:

```bash
npm run dev
```

Then open the site in your browser, usually at `http://localhost:3000` when using the start script.

## GitHub Projects Section

The projects panel fetches repositories from GitHub from my account and displays the six most relevant public repositories.

If you hit GitHub API rate limits, you can provide a personal access token to increase the limit

You can also store it in `localStorage` under the key `github-token`.

## Notes

- The site uses a single-page layout, so most navigation is handled through anchor links.
- Repository cards are cached for a short time to reduce API calls and improve load speed.
- If GitHub data is unavailable, the projects section will show an error message instead of silently hiding the issue.
