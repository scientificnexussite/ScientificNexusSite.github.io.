/**
 * nexus-tilt.js
 * Enhanced 3D perspective tilt with smooth animations.
 * Skipped on mobile and on lore-sidebar.
 */
(function () {
    'use strict';

    if (window.innerWidth < 768) return;

    var panels = document.querySelectorAll('[data-tilt]');

    panels.forEach(function (panel) {
        var glow = panel.querySelector('.panel-glow');
        var rafPending = false;
        var lastE = null;
        var currentRotX = 0;
        var currentRotY = 0;
        var targetRotX = 0;
        var targetRotY = 0;

        panel.addEventListener('mouseenter', function() {
            panel.style.willChange = 'transform';
        }, { passive: true });

        panel.addEventListener('mousemove', function (e) {
            lastE = e;
            if (rafPending) return;
            rafPending = true;

            requestAnimationFrame(function () {
                rafPending = false;
                if (!lastE) return;

                var rect = panel.getBoundingClientRect();
                var dx = (lastE.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
                var dy = (lastE.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

                // Smoother 3D rotation
                targetRotY = dx * 8;  // Max 8 degrees
                targetRotX = -dy * 8;

                // Smooth interpolation
                currentRotX += (targetRotX - currentRotX) * 0.1;
                currentRotY += (targetRotY - currentRotY) * 0.1;

                var shadowX = -currentRotY * 3;
                var shadowY = currentRotX * 3;

                panel.style.transform = 
                    'perspective(1000px) ' +
                    'rotateX(' + currentRotX.toFixed(2) + 'deg) ' +
                    'rotateY(' + currentRotY.toFixed(2) + 'deg) ' +
                    'scale3d(1.02, 1.02, 1.02)';
                
                panel.style.boxShadow = 
                    shadowX + 'px ' + shadowY + 'px 50px rgba(0,0,0,0.5), ' +
                    '0 0 40px rgba(0,242,255,0.1)';

                // Dynamic glow follows mouse
                if (glow) {
                    var mx = ((lastE.clientX - rect.left) / rect.width) * 100;
                    var my = ((lastE.clientY - rect.top) / rect.height) * 100;
                    glow.style.setProperty('--mx', mx + '%');
                    glow.style.setProperty('--my', my + '%');
                }
            });
        }, { passive: true });

        panel.addEventListener('mouseleave', function () {
            lastE = null;
            
            // Smooth return animation
            function resetTransform() {
                if (lastE) return; // Mouse re-entered
                
                currentRotX += (0 - currentRotX) * 0.15;
                currentRotY += (0 - currentRotY) * 0.15;
                
                if (Math.abs(currentRotX) < 0.01 && Math.abs(currentRotY) < 0.01) {
                    panel.style.transform = '';
                    panel.style.boxShadow = '';
                    panel.style.willChange = 'auto';
                    return;
                }
                
                panel.style.transform = 
                    'perspective(1000px) ' +
                    'rotateX(' + currentRotX.toFixed(2) + 'deg) ' +
                    'rotateY(' + currentRotY.toFixed(2) + 'deg) ' +
                    'scale3d(1, 1, 1)';
                
                requestAnimationFrame(resetTransform);
            }
            
            resetTransform();
        });
    });
})();
