```
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SceneContainer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Geometry
        const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true });
        const torusKnot = new THREE.Mesh(geometry, material);
        scene.add(torusKnot);

        // Stars (simple particles)
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 1000;
        const posArray = new Float32Array(starsCount * 3);
        
        for(let i = 0; i < starsCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 500;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMaterial = new THREE.PointsMaterial({ size: 0.5, color: 0xffffff });
        const starsMesh = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(starsMesh);

        camera.position.z = 30;

        // Animation loop
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            torusKnot.rotation.x += 0.01;
            torusKnot.rotation.y += 0.01;
            starsMesh.rotation.y += 0.002;

            renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            starsGeometry.dispose();
            starsMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                zIndex: -1, 
                background: '#0f172a' 
            }} 
        />
    );
};

export default SceneContainer;
```
