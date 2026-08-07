(() => {
    'use strict';

    const canvas = document.getElementById('snake');
    const status = document.getElementById('status');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance'
    });

    if (!gl) {
        canvas.hidden = true;
        status.textContent = 'WebGL is unavailable; showing the atmospheric fallback.';
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
        uniform vec2 u_pointer;

        #define PI 3.141592653589793

        float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x),
                f.y
            );
        }

        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;

            for (int i = 0; i < 5; i++) {
                value += amplitude * noise(p);
                p = mat2(1.61, 1.12, -1.12, 1.61) * p + 0.17;
                amplitude *= 0.5;
            }

            return value;
        }

        float spine(float y, float time) {
            float sway = 0.34 * sin(time * 0.42);
            float coil =
                0.30 * sin(y * 4.25 - time * 1.15) +
                0.105 * sin(y * 10.8 + time * 0.72) +
                0.038 * sin(y * 25.0 - time * 1.37);
            float pointerPull = (u_pointer.x - 0.5) * 0.13;
            return sway + coil + pointerPull;
        }

        vec3 spectral(float t) {
            vec3 a = vec3(0.57, 0.48, 0.51);
            vec3 b = vec3(0.48, 0.47, 0.49);
            vec3 c = vec3(1.00, 1.00, 1.00);
            vec3 d = vec3(0.02, 0.20, 0.55);
            return clamp(a + b * cos(6.28318 * (c * t + d)), 0.0, 1.0);
        }

        float fractalScales(vec2 p) {
            float pattern = 0.0;
            float weight = 0.58;

            for (int i = 0; i < 4; i++) {
                p = abs(p);
                p = p * 1.72 - vec2(0.72, 0.57);
                float ridge = exp(-15.0 * abs(length(p) - 0.31));
                pattern += ridge * weight;
                weight *= 0.58;
            }

            return pattern;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec2 p = uv * 2.0 - 1.0;
            float time = u_time;
            float aspect = u_resolution.x / u_resolution.y;

            vec2 atmosphereUV = vec2(p.x * aspect, p.y);
            float haze = fbm(atmosphereUV * 2.15 + vec2(time * 0.018, -time * 0.026));
            float deepGlow = exp(-2.1 * length(atmosphereUV - vec2(0.0, 0.48)));
            vec3 color = mix(vec3(0.008, 0.005, 0.025), vec3(0.09, 0.018, 0.16), haze);
            color += vec3(0.14, 0.025, 0.22) * deepGlow;

            vec2 starCell = floor(gl_FragCoord.xy / 3.0);
            float star = step(0.996, hash21(starCell));
            color += star * vec3(0.52, 0.68, 1.0) * (0.45 + 0.55 * sin(time * 2.0 + hash21(starCell) * 12.0));

            float headY = 0.70 + 0.035 * sin(time * 0.85);
            float centerX = spine(p.y, time);
            float dx = p.x - centerX;
            float taper = smoothstep(-1.08, -0.68, p.y);
            float width = mix(0.018, 0.105, taper);
            width *= 0.93 + 0.07 * sin(p.y * 15.0 - time * 1.4);

            float body = 1.0 - smoothstep(width, width + 0.018, abs(dx));
            body *= 1.0 - smoothstep(headY - 0.025, headY + 0.055, p.y);
            body *= smoothstep(-1.18, -1.02, p.y);

            float edge = exp(-22.0 * abs(abs(dx) - width));
            float localX = dx / max(width, 0.001);
            vec2 scaleSpace = vec2(localX * 1.3, p.y * 8.5 - time * 0.42);
            scaleSpace.y += floor(scaleSpace.x * 2.0) * 0.24;
            float scales = fractalScales(scaleSpace);

            float flow = p.y * 1.34 - time * 0.075 + localX * 0.055;
            vec3 snakeColor = spectral(flow);
            snakeColor = mix(snakeColor, vec3(1.0, 0.18, 0.06), scales * 0.34);
            snakeColor += vec3(1.0, 0.72, 0.16) * edge * 0.60;
            snakeColor *= 0.72 + 0.28 * sqrt(max(0.0, 1.0 - localX * localX));
            color = mix(color, snakeColor, body);

            float aura = exp(-18.0 * max(abs(dx) - width, 0.0));
            aura *= 1.0 - smoothstep(headY, headY + 0.17, p.y);
            color += spectral(flow + 0.18) * aura * 0.20;

            float headX = spine(headY - 0.055, time);
            vec2 headP = vec2((p.x - headX) / 0.155, (p.y - headY) / 0.125);
            headP.x += 0.14 * headP.y;
            float headShape = 1.0 - smoothstep(0.89, 1.02, length(headP));
            vec3 headColor = spectral(time * 0.025 + headP.y * 0.13);
            headColor += vec3(0.72, 0.14, 0.02) * fractalScales(headP * 2.4) * 0.32;
            color = mix(color, headColor, headShape);

            float facing = sign(cos(time * 0.42));
            vec2 eyeBase = vec2(headX + facing * 0.062, headY + 0.025);
            float eyeTop = length(vec2((p.x - eyeBase.x) / 0.020, (p.y - eyeBase.y - 0.038) / 0.026));
            float eyeBottom = length(vec2((p.x - eyeBase.x) / 0.020, (p.y - eyeBase.y + 0.038) / 0.026));
            float eyes = (1.0 - smoothstep(0.72, 1.0, min(eyeTop, eyeBottom))) * headShape;
            color = mix(color, vec3(0.04, 0.01, 0.02), eyes);
            float pupils = (1.0 - smoothstep(0.16, 0.34, min(eyeTop, eyeBottom))) * headShape;
            color = mix(color, vec3(1.0, 0.91, 0.26), pupils);

            float vignette = smoothstep(1.45, 0.28, length(atmosphereUV));
            color *= 0.70 + 0.30 * vignette;
            color += (hash21(gl_FragCoord.xy + time) - 0.5) / 255.0;

            gl_FragColor = vec4(pow(clamp(color, 0.0, 1.0), vec3(0.91)), 1.0);
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
        const pointerLocation = gl.getUniformLocation(program, 'u_pointer');
        const buffer = gl.createBuffer();
        const pointer = { x: 0.5, y: 0.5 };
        let frame = 0;
        let startTime = performance.now();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
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

        function draw(now) {
            resize();
            const elapsed = reducedMotion.matches ? 0.0 : (now - startTime) * 0.001;
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, elapsed);
            gl.uniform2f(pointerLocation, pointer.x, pointer.y);
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            if (!reducedMotion.matches) {
                frame = requestAnimationFrame(draw);
            }
        }

        function start() {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(draw);
        }

        function updatePointer(event) {
            const point = event.touches ? event.touches[0] : event;
            pointer.x = point.clientX / Math.max(window.innerWidth, 1);
            pointer.y = 1.0 - point.clientY / Math.max(window.innerHeight, 1);
        }

        window.addEventListener('pointermove', updatePointer, { passive: true });
        window.addEventListener('touchmove', updatePointer, { passive: true });
        window.addEventListener('resize', resize, { passive: true });
        window.visualViewport?.addEventListener('resize', resize, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(frame);
            } else {
                startTime = performance.now();
                start();
            }
        });

        reducedMotion.addEventListener('change', start);
        canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            cancelAnimationFrame(frame);
            status.textContent = 'The fractal snake paused.';
        });

        resize();
        start();
    } catch (error) {
        console.error('Unable to start Fractal Snake:', error);
        canvas.hidden = true;
        status.textContent = 'WebGL could not start; showing the atmospheric fallback.';
    }
})();
