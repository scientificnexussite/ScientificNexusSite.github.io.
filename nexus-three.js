/**
 * nexus-three.js
 * Three.js 3D particle network — runs on desktop (>= 768px) only.
 * Optimized for smooth 60fps with 3D depth effects.
 */
(function () {
    'use strict';

    if (window.innerWidth < 768) return;

    var canvas = document.getElementById('nexus-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: false, 
        powerPreference: "high-performance" 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050507, 0.015); // Depth fog for 3D feel

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 50);

    // Mouse parallax
    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    var isActive = true;
    
    document.addEventListener('mousemove', function (e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    document.addEventListener('visibilitychange', function() {
        isActive = document.visibilityState === 'visible';
    });

    // Nodes with depth
    var NODE_COUNT = 40;
    var nodes = [];
    var nodeGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var nodeMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
    var nodeMat2 = new THREE.MeshBasicMaterial({ color: 0xbc13fe });

    for (var i = 0; i < NODE_COUNT; i++) {
        var mat = Math.random() > 0.6 ? nodeMat2 : nodeMat;
        var mesh = new THREE.Mesh(nodeGeo, mat);
        
        // Distribute in 3D space with depth
        var x = (Math.random() - 0.5) * 140;
        var y = (Math.random() - 0.5) * 90;
        var z = (Math.random() - 0.5) * 60;
        
        mesh.position.set(x, y, z);
        
        var speed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.01
        };
        
        nodes.push({ mesh: mesh, speed: speed, originalZ: z });
        scene.add(mesh);
    }

    // Connection lines with depth-based opacity
    var lineMat = new THREE.LineBasicMaterial({ 
        color: 0x00f2ff, 
        transparent: true, 
        opacity: 0.08 
    });
    var lineMat2 = new THREE.LineBasicMaterial({ 
        color: 0xbc13fe, 
        transparent: true, 
        opacity: 0.05 
    });
    
    var linePool = [];
    var MAX_DIST = 25;
    var lineIdx = 0;

    function rebuildLines() {
        for (var k = 0; k < linePool.length; k++) {
            linePool[k].visible = false;
        }
        
        lineIdx = 0;
        
        for (var a = 0; a < nodes.length; a++) {
            for (var b = a + 1; b < nodes.length; b++) {
                var dist = nodes[a].mesh.position.distanceTo(nodes[b].mesh.position);
                
                if (dist < MAX_DIST) {
                    var line;
                    if (lineIdx < linePool.length) {
                        line = linePool[lineIdx];
                        line.geometry.setFromPoints([
                            nodes[a].mesh.position.clone(),
                            nodes[b].mesh.position.clone()
                        ]);
                        line.visible = true;
                    } else {
                        var geo = new THREE.BufferGeometry().setFromPoints([
                            nodes[a].mesh.position.clone(),
                            nodes[b].mesh.position.clone()
                        ]);
                        var lm = Math.random() > 0.5 ? lineMat : lineMat2;
                        line = new THREE.Line(geo, lm);
                        scene.add(line);
                        linePool.push(line);
                    }
                    
                    // Depth-based opacity
                    var avgZ = (nodes[a].mesh.position.z + nodes[b].mesh.position.z) / 2;
                    var depthOpacity = 1 - (avgZ + 30) / 60;
                    line.material.opacity = Math.max(0.02, depthOpacity * 0.1);
                    
                    lineIdx++;
                }
            }
        }
    }

    // 3D Rings with tilt
    var rings = [];
    for (var r = 0; r < 3; r++) {
        var rGeo = new THREE.RingGeometry(15 + r * 15, 15.3 + r * 15, 64);
        var rMat = new THREE.MeshBasicMaterial({
            color: r % 2 === 0 ? 0x00f2ff : 0xbc13fe,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.03 + r * 0.01
        });
        var ring = new THREE.Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 3 + r * 0.2;
        ring.rotation.y = r * 0.4;
        ring.position.z = -20 + r * 10;
        scene.add(ring);
        rings.push({ mesh: ring, speed: 0.0005 * (r % 2 === 0 ? 1 : -1) });
    }

    // Animation loop
    var frame = 0;
    var REBUILD_INTERVAL = 150;

    function animate() {
        requestAnimationFrame(animate);
        
        if (!isActive) return;
        
        frame++;

        // Smooth camera parallax with depth
        targetX += (mouseX * 5 - targetX) * 0.02;
        targetY += (-mouseY * 4 - targetY) * 0.02;
        camera.position.x = targetX;
        camera.position.y = targetY;
        camera.position.z = 50 + Math.sin(frame * 0.005) * 5; // Subtle zoom
        camera.lookAt(scene.position);

        // Move nodes with 3D drift
        nodes.forEach(function (n) {
            n.mesh.position.x += n.speed.x;
            n.mesh.position.y += n.speed.y;
            n.mesh.position.z += n.speed.z;
            
            // Gentle z oscillation
            n.mesh.position.z += Math.sin(frame * 0.01 + n.originalZ) * 0.01;
            
            if (Math.abs(n.mesh.position.x) > 70) n.speed.x *= -1;
            if (Math.abs(n.mesh.position.y) > 45) n.speed.y *= -1;
            if (Math.abs(n.mesh.position.z) > 30) n.speed.z *= -1;
        });

        // Rotate rings
        rings.forEach(function (rg) {
            rg.mesh.rotation.z += rg.speed;
            rg.mesh.rotation.x += rg.speed * 0.5;
        });

        if (frame % REBUILD_INTERVAL === 0) rebuildLines();

        renderer.render(scene, camera);
    }

    rebuildLines();
    animate();

    var resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, 100);
    });
})();
