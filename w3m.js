const projects = [
    {
        id: 'media',
        name: 'media',
        description: 'a customizable social shelf and media hub to track, rate, and share what you read, play, watch, and listen to with your friends, featuring real-time integrations.',
        url: 'https://media.siqnole.dev/'
    },
    {
        id: 'nightiowl',
        name: 'nightIOwl',
        description: 'an open-source, self-hosted e-book and comic library server with automatic cover recovery and high-quality reading experience.',
        url: 'https://read.siqnole.dev/',
        codeUrl: 'https://codeberg.org/siq/nightIOwl'
    },
    {
        id: 'draw',
        name: 'draw',
        description: 'a high-performance, real-time collaborative layered drawing and sketching canvas, integrated with LaTeX and mathematical rendering.',
        url: 'https://draw.siqnole.dev/',
        codeUrl: 'https://codeberg.org/siq/draw'
    },
    {
        id: 'arcade',
        name: 'arcade',
        description: 'a collection of web-based retro arcade games, fully responsive and styled with custom modern, immersive visuals.',
        url: 'https://arcade.siqnole.dev/',
        codeUrl: 'https://codeberg.org/siq/arcade'
    },
    {
        id: 'music',
        name: 'music',
        description: 'a personal music history viewer and visualizer tracking current and past listening activity, powered by the Last.fm API.',
        url: 'https://music.siqnole.dev/'
    },
    {
        id: 'apollo',
        name: 'apollo',
        description: 'a matching platform designed to connect you with a human learning rival to study competitively, spinning up on-demand sandboxed containers inside the browser for a high-quality practice experience.',
        url: 'https://apollo.siqnole.dev/',
        codeUrl: 'https://github.com/siqnole/apollo'
    },
    {
        id: 'bronx',
        name: 'bronx',
        description: "an all-in-one discord bot made in C++ with D++ with over 160k+ concurrent users, meant to replace every bot you've ever paid for or been locked out of because of premium slop.",
        url: 'https://bronxbot.xyz',
        codeUrl: 'https://codeberg.org/siq/dpp'
    },
    {
        id: 'jellyfin',
        name: 'jellyfin',
        description: 'a secure, self-hosted media server serving movies, shows, and audio seamlessly with optimized cross-device transcoding.',
        url: 'https://jellyfin.siqnole.dev/'
    }
];

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function renderW3mPage(projectId) {
    const project = projects.find(({ id }) => id === projectId) || projects[0];
    const navigation = projects.map(({ id, name }) =>
        `<a href="/?project=${encodeURIComponent(id)}#project">${escapeHtml(name)}</a>`
    ).join(' | ');
    const sourceLink = project.codeUrl
        ? `<li><a href="${escapeHtml(project.codeUrl)}">Source code</a></li>`
        : '';

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>siqnole - text portfolio</title>
</head>
<body>
    <h1>hi, i'm william</h1>
    <p>i tinker with electronics and computers for fun.</p>
    <p>here are some of my things</p>
    <nav id="projects" aria-label="Projects">${navigation}</nav>
    <main>
        <h2 id="project">${escapeHtml(project.name)}</h2>
        <p>${escapeHtml(project.description)}</p>
        <ul>
            <li><a href="${escapeHtml(project.url)}">Open ${escapeHtml(project.name)}</a></li>
            ${sourceLink}
        </ul>
    </main>
</body>
</html>`;
}

module.exports = { renderW3mPage };
