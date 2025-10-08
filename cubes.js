// Cubes 3D Animation
class CubesAnimation {
    constructor(options = {}) {
        this.gridSize = options.gridSize || 12;
        this.maxAngle = options.maxAngle || 35;
        this.radius = options.radius || 3;
        this.duration = options.duration || { enter: 0.3, leave: 0.6 };
        this.autoAnimate = options.autoAnimate !== false;
        this.rippleOnClick = options.rippleOnClick !== false;
        this.rippleColor = options.rippleColor || 'rgba(163, 255, 18, 0.3)';
        this.rippleSpeed = options.rippleSpeed || 2;
        
        this.rafId = null;
        this.idleTimer = null;
        this.userActive = false;
        this.simPos = { x: 0, y: 0 };
        this.simTarget = { x: 0, y: 0 };
        this.simRAF = null;
        
        this.init();
    }
    
    init() {
        this.createWrapper();
        this.createCubes();
        this.bindEvents();
        if (this.autoAnimate) {
            this.startAutoAnimation();
        }
    }
    
    createWrapper() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'cubes-wrapper';
        this.wrapper.style.setProperty('--cube-face-bg', '#060010');
        this.wrapper.style.setProperty('--cube-face-border', '1px solid rgba(163, 255, 18, 0.15)');
        this.wrapper.style.setProperty('--cube-depth', '20px');
        
        this.scene = document.createElement('div');
        this.scene.className = 'cubes-scene';
        this.scene.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.scene.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        this.scene.style.gap = '8px';
        
        this.wrapper.appendChild(this.scene);
        document.body.insertBefore(this.wrapper, document.body.firstChild);
    }
    
    createCubes() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cube = document.createElement('div');
                cube.className = 'cube';
                cube.dataset.row = r;
                cube.dataset.col = c;
                
                ['front', 'back', 'top', 'bottom', 'left', 'right'].forEach(face => {
                    const faceDiv = document.createElement('div');
                    faceDiv.className = `cube-face cube-face--${face}`;
                    cube.appendChild(faceDiv);
                });
                
                this.scene.appendChild(cube);
            }
        }
    }
    
    tiltAt(rowCenter, colCenter) {
        const cubes = this.scene.querySelectorAll('.cube');
        cubes.forEach(cube => {
            const r = parseFloat(cube.dataset.row);
            const c = parseFloat(cube.dataset.col);
            const dist = Math.hypot(r - rowCenter, c - colCenter);
            
            if (dist <= this.radius) {
                const pct = 1 - dist / this.radius;
                const angle = pct * this.maxAngle;
                this.animateCube(cube, -angle, angle, this.duration.enter);
            } else {
                this.animateCube(cube, 0, 0, this.duration.leave);
            }
        });
    }
    
    animateCube(cube, rotateX, rotateY, duration) {
        const start = performance.now();
        const initialTransform = this.getCurrentRotation(cube);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = this.easeOutCubic(progress);
            
            const currentX = initialTransform.x + (rotateX - initialTransform.x) * eased;
            const currentY = initialTransform.y + (rotateY - initialTransform.y) * eased;
            
            cube.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    getCurrentRotation(cube) {
        const style = window.getComputedStyle(cube);
        const transform = style.transform;
        
        if (transform === 'none') return { x: 0, y: 0 };
        
        const matrix = transform.match(/matrix3d\((.+)\)/);
        if (matrix) {
            const values = matrix[1].split(', ').map(parseFloat);
            const rotateX = Math.asin(-values[9]) * (180 / Math.PI);
            const rotateY = Math.atan2(values[8], values[10]) * (180 / Math.PI);
            return { x: rotateX, y: rotateY };
        }
        
        return { x: 0, y: 0 };
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    resetAll() {
        const cubes = this.scene.querySelectorAll('.cube');
        cubes.forEach(cube => {
            this.animateCube(cube, 0, 0, this.duration.leave);
        });
    }
    
    onPointerMove = (e) => {
        this.userActive = true;
        if (this.idleTimer) clearTimeout(this.idleTimer);
        
        const rect = this.scene.getBoundingClientRect();
        const cellW = rect.width / this.gridSize;
        const cellH = rect.height / this.gridSize;
        const colCenter = (e.clientX - rect.left) / cellW;
        const rowCenter = (e.clientY - rect.top) / cellH;
        
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => this.tiltAt(rowCenter, colCenter));
        
        this.idleTimer = setTimeout(() => {
            this.userActive = false;
        }, 2000);
    };
    
    onClick = (e) => {
        if (!this.rippleOnClick) return;
        
        const rect = this.scene.getBoundingClientRect();
        const cellW = rect.width / this.gridSize;
        const cellH = rect.height / this.gridSize;
        
        const colHit = Math.floor((e.clientX - rect.left) / cellW);
        const rowHit = Math.floor((e.clientY - rect.top) / cellH);
        
        const baseRingDelay = 0.08;
        const baseAnimDur = 0.25;
        const baseHold = 0.4;
        
        const spreadDelay = baseRingDelay / this.rippleSpeed;
        const animDuration = baseAnimDur / this.rippleSpeed;
        const holdTime = baseHold / this.rippleSpeed;
        
        const rings = {};
        this.scene.querySelectorAll('.cube').forEach(cube => {
            const r = parseFloat(cube.dataset.row);
            const c = parseFloat(cube.dataset.col);
            const dist = Math.hypot(r - rowHit, c - colHit);
            const ring = Math.round(dist);
            if (!rings[ring]) rings[ring] = [];
            rings[ring].push(cube);
        });
        
        Object.keys(rings)
            .map(Number)
            .sort((a, b) => a - b)
            .forEach(ring => {
                const delay = ring * spreadDelay * 1000;
                rings[ring].forEach(cube => {
                    const faces = cube.querySelectorAll('.cube-face');
                    setTimeout(() => {
                        faces.forEach(face => {
                            face.style.transition = `background-color ${animDuration}s ease-out`;
                            face.style.backgroundColor = this.rippleColor;
                        });
                        setTimeout(() => {
                            faces.forEach(face => {
                                face.style.backgroundColor = '#060010';
                            });
                        }, (animDuration + holdTime) * 1000);
                    }, delay);
                });
            });
    };
    
    startAutoAnimation() {
        this.simPos = {
            x: Math.random() * this.gridSize,
            y: Math.random() * this.gridSize
        };
        this.simTarget = {
            x: Math.random() * this.gridSize,
            y: Math.random() * this.gridSize
        };
        
        const speed = 0.015;
        const loop = () => {
            if (!this.userActive) {
                const pos = this.simPos;
                const tgt = this.simTarget;
                pos.x += (tgt.x - pos.x) * speed;
                pos.y += (tgt.y - pos.y) * speed;
                this.tiltAt(pos.y, pos.x);
                
                if (Math.hypot(pos.x - tgt.x, pos.y - tgt.y) < 0.2) {
                    this.simTarget = {
                        x: Math.random() * this.gridSize,
                        y: Math.random() * this.gridSize
                    };
                }
            }
            this.simRAF = requestAnimationFrame(loop);
        };
        this.simRAF = requestAnimationFrame(loop);
    }
    
    bindEvents() {
        this.scene.addEventListener('pointermove', this.onPointerMove);
        this.scene.addEventListener('pointerleave', () => this.resetAll());
        this.scene.addEventListener('click', this.onClick);
    }
    
    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.simRAF) cancelAnimationFrame(this.simRAF);
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.wrapper.remove();
    }
}

// Initialize cubes animation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cubesAnimation = new CubesAnimation({
            gridSize: 12,
            maxAngle: 35,
            radius: 3,
            autoAnimate: true,
            rippleOnClick: true,
            rippleColor: 'rgba(163, 255, 18, 0.4)',
            rippleSpeed: 2.5
        });
    });
} else {
    window.cubesAnimation = new CubesAnimation({
        gridSize: 12,
        maxAngle: 35,
        radius: 3,
        autoAnimate: true,
        rippleOnClick: true,
        rippleColor: 'rgba(163, 255, 18, 0.4)',
        rippleSpeed: 2.5
    });
}
