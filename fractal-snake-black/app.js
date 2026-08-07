(() => {
    'use strict';

    const namespace = 'http://www.w3.org/2000/svg';
    const sparkleGroup = document.getElementById('sparkles');

    if (!sparkleGroup) {
        return;
    }

    function randomGenerator(seed) {
        let state = seed >>> 0;

        return () => {
            state += 0x6d2b79f5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }

    const random = randomGenerator(19771108);
    const silverTones = ['#ffffff', '#e4e5e6', '#b9bcc0', '#85898e'];

    for (let index = 0; index < 118; index += 1) {
        const sparkle = document.createElementNS(namespace, 'circle');
        const bright = index % 17 === 0;
        const radius = bright
            ? 1.15 + random() * 1.45
            : 0.28 + Math.pow(random(), 2.2) * 1.15;
        const duration = 8 + random() * 18;
        const delay = -random() * duration;

        sparkle.setAttribute('cx', (random() * 800).toFixed(2));
        sparkle.setAttribute('cy', (random() * 600).toFixed(2));
        sparkle.setAttribute('r', radius.toFixed(2));
        sparkle.setAttribute('fill', silverTones[Math.floor(random() * silverTones.length)]);
        sparkle.setAttribute(
            'class',
            bright ? 'sparkle sparkle--bright' : 'sparkle'
        );
        sparkle.style.setProperty('--duration', `${duration.toFixed(2)}s`);
        sparkle.style.setProperty('--delay', `${delay.toFixed(2)}s`);
        sparkle.style.setProperty('--peak', (0.32 + random() * 0.62).toFixed(2));

        sparkleGroup.appendChild(sparkle);
    }
})();
