/**
 * nexus-particles.js
 * 3D CSS particles for all screen sizes.
 * 2D canvas fallback for mobile with 3D feel.
 */
(function () {
    'use strict';

    // Part 1 — CSS floating particle dots with 3D depth
    var field = document.getElementById('particle-field');
    if (field) {
        var isMobile = window.innerWidth < 768;
        var COUNT = isMobile ? 6 : 12;
        var COLORS = ['#00f2ff', '#bc13fe', '#ffffff'];

        for (var i = 0; i < COUNT; i++) {
            var dot = document.createElement('div');
            dot.className = 'p-dot';
            var size = Math.random() * 3 + 2;
            var color = COLORS[Math.floor(Math.random() * COLORS.length)];
            var duration = Math.random() * 15 + 12;
            var delay = Math.random() * 8;
            var left = Math.random() * 100;
            var depth = Math.random() * 200 - 100; // 3D depth

            dot.style.cssText = [
                'width:' + size + 'px',
                'height:' + size + 'px',
                'background:' + color,
                'left:' + left + '%',
                'bottom:-10px',
                'animation-duration:' + duration + 's',
                'animation-delay:' + delay + 's',
                'box-shadow:0 0 ' + (size * 3) + 'px ' + color,
                '--depth:' + depth + 'px'
            ].join(';');

            field.appendChild(dot);
        }
    }

    // Part 2 — Mobile 2D canvas with 3D perspective simulation
    if (window.innerWidth >= 768) return;

    var canvas = document.getElementById('nexus-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();

    var NODE_COUNT_2D = 25;
    var nodes2d = [];
    for (var n = 0; n < NODE_COUNT_2D; n++) {
        nodes2d.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * 100, // Simulated depth
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            r: Math.random() * 1.5 + 0.5,
            cyan: Math.random() > 0.3
        });
    }

    var MAX_DIST_2D = 80;
    var frameCount = 0;
    var isVisible = true;

    document.addEventListener('visibilitychange', function() {
        isVisible = document.visibilityState === 'visible';
    });

    function draw2d() {
        requestAnimationFrame(draw2d);
        
        if (!isVisible) return;
        
        frameCount++;
        if (frameCount % 2 !== 0) return; // 30fps for smoothness

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update positions
        nodes2d.forEach(function (nd) {
            nd.x += nd.vx;
            nd.y += nd.vy;
            nd.z += Math.sin(frameCount * 0.02) * 0.5; // Depth oscillation

            if (nd.x < 0 || nd.x > canvas.width) nd.vx *= -1;
            if (nd.y < 0 || nd.y > canvas.height) nd.vy *= -1;
        });

        // Draw connections with depth
        ctx.lineWidth = 0.5;
        for (var a = 0; a < nodes2d.length; a++) {
            for (var b = a + 1; b < nodes2d.length; b++) {
                var dx = nodes2d[a].x - nodes2d[b].x;
                var dy = nodes2d[a].y - nodes2d[b].y;
                var distSq = dx * dx + dy * dy;

                if (distSq < MAX_DIST_2D * MAX_DIST_2D) {
                    var dist = Math.sqrt(distSq);
                    var avgZ = (nodes2d[a].z + nodes2d[b].z) / 2;
                    var depthFactor = Math.max(0.1, 1 - (avgZ + 50) / 150);
                    
                    var alpha = 0.12 * (1 - dist / MAX_DIST_2D) * depthFactor;
                    
                    ctx.beginPath();
                    ctx.moveTo(nodes2d[a].x, nodes2d[a].y);
                    ctx.lineTo(nodes2d[b].x, nodes2d[b].y);
                    
                    var isCyan = nodes2d[a].cyan && nodes2d[b].cyan;
                    ctx.strokeStyle = isCyan
                        ? 'rgba(0,242,255,' + alpha + ')'
                        : 'rgba(188,19,254,' + alpha + ')';
                    ctx.stroke();
                }
            }
        }

        // Draw nodes with depth scaling
        nodes2d.forEach(function (nd) {
            var scale = 0.5 + (nd.z + 50) / 200;
            var alpha = 0.5 + (nd.z + 50) / 300;
            
            ctx.beginPath();
            ctx.arc(nd.x, nd.y, nd.r * scale, 0, Math.PI * 2);
            ctx.fillStyle = nd.cyan 
                ? 'rgba(0,242,255,' + alpha + ')' 
                : 'rgba(188,19,254,' + alpha + ')';
            ctx.shadowBlur = 6 * scale;
            ctx.shadowColor = nd.cyan ? '#00f2ff' : '#bc13fe';
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    draw2d();

    var resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            resize();
            nodes2d.forEach(function (nd) {
                nd.x = Math.min(nd.x, canvas.width);
                nd.y = Math.min(nd.y, canvas.height);
            });
        }, 100);
    });
})();
