(() => {
    'use strict';

    const canvas = document.getElementById('field');
    const status = document.getElementById('status');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function showFallback(message) {
        canvas.hidden = true;
        canvas.style.setProperty('display', 'none', 'important');
        document.documentElement.classList.add('webgl-fallback');
        status.textContent = message;
    }

    const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance'
    });

    if (!gl) {
        showFallback('WebGL is unavailable; showing the black and silver fallback.');
        return;
    }

    const vertexSource = `
        attribute vec2 a_position;

        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentSource = `
        precision mediump float;

        uniform vec2 u_resolution;
        uniform float u_time;

        #define TAU 6.283185307179586

        float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec2 p = uv * 2.0 - 1.0;
            float radius = length(p);
            float angle = atan(p.y, p.x);

            float pulse = 0.5 + 0.5 * sin(u_time * 0.15);
            float breathingRadius = radius / (1.0 + 0.055 * pulse);
            float drift =
                0.008 * sin(angle * 3.0 + u_time * 0.035) +
                0.005 * sin(angle * 7.0 - u_time * 0.022);

            float rings = 0.5 + 0.5 * cos((breathingRadius + drift) * TAU * 4.65);
            float silver = smoothstep(0.08, 0.94, rings);
            float hardGlint = pow(rings, 12.0);

            float luminance = mix(0.003, 0.68, pow(silver, 1.34));
            luminance += hardGlint * (0.10 + 0.08 * pulse);

            float centralMetal = exp(-radius * radius * 8.5);
            luminance = mix(luminance, 0.80 + 0.08 * pulse, centralMetal * 0.66);

            float vignette = smoothstep(1.52, 0.34, radius);
            luminance *= 0.62 + 0.38 * vignette;

            vec2 sparkleGrid = gl_FragCoord.xy / 18.0;
            vec2 cell = floor(sparkleGrid);
            vec2 point = fract(sparkleGrid) - 0.5;
            float seed = hash21(cell);
            float exists = step(0.997, seed);
            float phase = hash21(cell + 17.31) * TAU;
            float speed = 0.20 + hash21(cell + 4.73) * 0.30;
            float twinkle = pow(0.5 + 0.5 * sin(u_time * speed + phase), 10.0);

            float core = 1.0 - smoothstep(0.012, 0.105, length(point));
            float horizontal = exp(-95.0 * abs(point.y)) * exp(-15.0 * abs(point.x));
            float vertical = exp(-95.0 * abs(point.x)) * exp(-15.0 * abs(point.y));
            float sparkle = exists * twinkle * max(core, (horizontal + vertical) * 0.34);

            float grain = (hash21(gl_FragCoord.xy + floor(u_time * 8.0)) - 0.5) / 180.0;
            vec3 color = vec3(luminance + sparkle * 0.92 + grain);

            gl_FragColor = vec4(pow(clamp(color, 0.0, 1.0), vec3(0.94)), 1.0);
        }
    `;

    function compile(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const message = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(message);
        }

        return shader;
    }

    function makeProgram() {
        const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const message = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(message);
        }

        return program;
    }

    try {
        const program = makeProgram();
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
        const timeLocation = gl.getUniformLocation(program, 'u_time');
        const buffer = gl.createBuffer();
        let frame = 0;
        let outputVerified = false;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        );

        gl.useProgram(program);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
            const height = Math.max(1, Math.round(canvas.clientHeight * dpr));

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
            }
        }

        function draw(milliseconds) {
            resize();
            const time = reducedMotion.matches ? 0 : milliseconds * 0.001;
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, time);
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            if (!outputVerified) {
                const pixel = new Uint8Array(4);
                gl.readPixels(
                    Math.floor(canvas.width / 2),
                    Math.floor(canvas.height / 2),
                    1,
                    1,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    pixel
                );
                outputVerified = true;

                if (pixel[0] + pixel[1] + pixel[2] < 24) {
                    showFallback('WebGL returned an empty frame; showing the black and silver fallback.');
                    return;
                }
            }

            if (!reducedMotion.matches && !document.hidden) {
                frame = requestAnimationFrame(draw);
            }
        }

        function start() {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', resize, { passive: true });
        window.visualViewport?.addEventListener('resize', resize, { passive: true });
        reducedMotion.addEventListener('change', start);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(frame);
            } else {
                start();
            }
        });

        canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            cancelAnimationFrame(frame);
            showFallback('The WebGL field paused; showing the black and silver fallback.');
        });

        resize();
        start();
    } catch (error) {
        console.error('Unable to start the WebGL field:', error);
        showFallback('WebGL could not start; showing the black and silver fallback.');
    }
})();
