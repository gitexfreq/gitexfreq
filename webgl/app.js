(() => {
    'use strict';

    const canvas = document.getElementById('gl-canvas');
    const status = document.getElementById('status');
    const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance'
    });

    if (!gl) {
        status.textContent = 'WebGL is unavailable; showing the static color field.';
        canvas.hidden = true;
        return;
    }

    const vertexSource = `
        attribute vec2 a_position;

        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentSource = `
        precision highp float;

        uniform vec2 u_resolution;
        uniform float u_time;

        const float PI = 3.141592653589793;

        vec3 palette(float t) {
            vec3 base = vec3(0.58, 0.38, 0.30);
            vec3 amplitude = vec3(0.48, 0.58, 0.54);
            vec3 phase = vec3(0.02, 0.20, 0.46);
            return clamp(base + amplitude * cos(6.28318 * (t + phase)), 0.0, 1.0);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec2 p = uv * 2.0 - 1.0;

            float time = u_time * 0.32;
            float breath = 1.0 + 0.045 * sin(time);
            p /= breath;

            float angle = atan(p.y, p.x);
            float radius = length(p);
            float organicWarp =
                0.018 * sin(angle * 3.0 + time * 0.7) +
                0.012 * sin(angle * 7.0 - time * 0.45);

            float wave = (radius + organicWarp) * 4.25;
            float bands = wave - time * 0.11;
            float glow = 0.11 * sin(wave * PI * 2.0 - time);
            vec3 color = palette(bands * 0.165 + glow);

            float centerGlow = exp(-radius * radius * 7.0);
            color = mix(color, vec3(1.0, 0.84, 0.05), centerGlow * 0.58);

            float ringLight = pow(0.5 + 0.5 * cos(wave * PI * 2.0 - time), 7.0);
            color += vec3(1.0, 0.56, 0.02) * ringLight * 0.42;

            float vignette = smoothstep(1.55, 0.28, radius);
            color *= 0.78 + 0.22 * vignette;

            gl_FragColor = vec4(pow(clamp(color, 0.0, 1.0), vec3(0.92)), 1.0);
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

    function createProgram() {
        const program = gl.createProgram();
        const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);

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
        const program = createProgram();
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
        const timeLocation = gl.getUniformLocation(program, 'u_time');
        const buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        );

        gl.useProgram(program);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        let animationFrame = 0;

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

        function render(milliseconds) {
            resize();
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, milliseconds * 0.001);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            animationFrame = requestAnimationFrame(render);
        }

        function start() {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(render);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationFrame);
            } else {
                start();
            }
        });

        window.addEventListener('resize', resize, { passive: true });
        window.visualViewport?.addEventListener('resize', resize, { passive: true });
        canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            cancelAnimationFrame(animationFrame);
            status.textContent = 'The WebGL display paused.';
        });

        resize();
        start();
    } catch (error) {
        console.error('Unable to start WebGL:', error);
        status.textContent = 'WebGL could not start; showing the static color field.';
        canvas.hidden = true;
    }
})();
