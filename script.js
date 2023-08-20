const background = document.getElementById('background');

function animateBackground() {
    const gradient = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
            <defs>
                <radialGradient id="psychedelic-gradient" cx="50%" cy="50%" r="${50 + 10 * Math.sin(Date.now() / 2000)}%">
                    <stop offset="0%" style="stop-color:gold;" />
                    <stop offset="10%" style="stop-color:silver;" />
                    <stop offset="20%" style="stop-color:orange;" />
                    <stop offset="30%" style="stop-color:red;" />
                    <stop offset="40%" style="stop-color:purple;" />
                    <stop offset="50%" style="stop-color:yellow;" />
                    <stop offset="60%" style="stop-color:purple;" />
                    <stop offset="70%" style="stop-color:red;" />
                    <stop offset="80%" style="stop-color:orange;" />
                    <stop offset="90%" style="stop-color:silver;" />
                    <stop offset="100%" style="stop-color:gold;" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="800" height="600" fill="url(#psychedelic-gradient)" />
        </svg>`;

    background.style.backgroundImage = `url('data:image/svg+xml;utf8,${gradient}')`;

    requestAnimationFrame(animateBackground);
}

animateBackground();
