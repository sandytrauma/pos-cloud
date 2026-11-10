// Location: components/three/Timeline3DCanvas.tsx
"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

interface Timeline3DProps {
  itemCount?: number;
}

/**
 * 🌟 TIMELINE 3D ENGINE (Urban Ambrosia)
 * Complete standalone Three.js WebGL component featuring:
 * 1. 3D Luxury Platters & Gourmet Cloche Covers spinning and orbiting around the vertical timeline axis as the user scrolls.
 * 2. Volumetric 3D Spotlight Beam tracking the active timeline node with warm amber illumination.
 * 3. 350 Rising Golden Embers & Saffron Flakes swirling in a helical vortex.
 * 4. Interactive mouse parallax camera tracking with smooth lerp physics.
 */
export default function Timeline3DCanvas({ itemCount = 6 }: Timeline3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let animId: number;
    let isDisposed = false;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Lighting System: Ambient Warmth & Dynamic Tracked Spotlight
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.4);
    scene.add(ambientLight);

    // Volumetric directional spotlight targeting the active timeline node
    const spotlight = new THREE.SpotLight(0xffbe53, 6.0, 50, Math.PI / 4.5, 0.5, 1.2);
    spotlight.position.set(0, 18, 16);
    scene.add(spotlight);

    // Rim lighting: Charcoal hearth amber & saffron glow
    const hearthAmber = new THREE.PointLight(0xf59e0b, 3.5, 30);
    hearthAmber.position.set(-12, 0, 10);
    scene.add(hearthAmber);

    const saffronRim = new THREE.PointLight(0xd97706, 3.0, 30);
    saffronRim.position.set(12, 0, 10);
    scene.add(saffronRim);

    // 3. Volumetric Visual Spotlight Cone (Visible Light Beam)
    const coneGeo = new THREE.ConeGeometry(5.5, 24, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const spotlightCone = new THREE.Mesh(coneGeo, coneMat);
    spotlightCone.position.set(0, 10, 8);
    spotlightCone.rotation.x = -Math.PI / 7;
    scene.add(spotlightCone);

    // Active Spotlight Target Glow Disk (Illuminates the central timeline axis)
    const glowDiskGeo = new THREE.RingGeometry(0.8, 2.6, 32);
    const glowDiskMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const glowDisk = new THREE.Mesh(glowDiskGeo, glowDiskMat);
    glowDisk.rotation.x = Math.PI / 2;
    scene.add(glowDisk);

    // 4. 3D Spinning Culinary Platters with Gourmet Cloche Domes
    const plattersGroup = new THREE.Group();
    scene.add(plattersGroup);

    const platterCount = Math.max(4, Math.min(8, itemCount));
    const platters: any[] = [];

    // Shared Geometries
    const platterBaseGeo = new THREE.CylinderGeometry(2.8, 2.4, 0.35, 48);
    const goldRimGeo = new THREE.TorusGeometry(2.82, 0.08, 16, 64);
    const clocheDomeGeo = new THREE.SphereGeometry(2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
    const clocheHandleGeo = new THREE.TorusGeometry(0.3, 0.06, 12, 32);
    const foodCoreGeo = new THREE.CylinderGeometry(2.2, 2.1, 0.1, 32);

    // Luxury Materials
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.25,
      metalness: 0.5,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
    });

    const clocheSilverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.88,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });

    // Artisan dish accent discs
    const dishMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.3 }), // Mint mojito
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.2 }), // Saffron chaap
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.5, metalness: 0.3 }), // Charcoal tandoor
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.4 }), // Ghee roast
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.3, metalness: 0.5 }), // Espresso crema
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.3 }), // Golden truffle
    ];

    for (let i = 0; i < platterCount; i++) {
      const itemGroup = new THREE.Group();

      // Platter Base
      const plateMesh = new THREE.Mesh(platterBaseGeo, plateMat);
      itemGroup.add(plateMesh);

      // 24K Gold Plated Rim
      const goldRim = new THREE.Mesh(goldRimGeo, goldMat);
      goldRim.rotation.x = Math.PI / 2;
      goldRim.position.y = 0.18;
      itemGroup.add(goldRim);

      // Food Jewel Center
      const foodDisc = new THREE.Mesh(foodCoreGeo, dishMaterials[i % dishMaterials.length]);
      foodDisc.position.y = 0.2;
      itemGroup.add(foodDisc);

      // Cloche Dome Cover (Alternate between open platter and covered luxury dome)
      if (i % 2 === 1) {
        const clocheDome = new THREE.Mesh(clocheDomeGeo, clocheSilverMat);
        clocheDome.position.y = 0.25;
        itemGroup.add(clocheDome);

        const clocheHandle = new THREE.Mesh(clocheHandleGeo, goldMat);
        clocheHandle.position.y = 2.25;
        itemGroup.add(clocheHandle);
      }

      // Spatial placement along vertical timeline spine
      const verticalSpread = 6.8;
      const orbitRadius = 8.5;
      const angleOffset = (i / platterCount) * Math.PI * 2;

      itemGroup.position.y = (platterCount / 2 - i) * verticalSpread;
      itemGroup.position.x = Math.sin(angleOffset) * orbitRadius;
      itemGroup.position.z = Math.cos(angleOffset) * (orbitRadius * 0.45);

      itemGroup.rotation.x = 0.55;
      itemGroup.rotation.y = angleOffset;

      plattersGroup.add(itemGroup);

      platters.push({
        group: itemGroup,
        baseY: itemGroup.position.y,
        angleOffset,
        orbitRadius,
        spinSpeed: 0.015 + (i % 2 === 0 ? 0.008 : -0.008),
      });
    }

    // 5. Helical Swirling Gold Embers (350 Particles Orbiting the Timeline)
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const angles = new Float32Array(particleCount);
    const heights = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      heights[i] = (Math.random() - 0.5) * 55;
      speeds[i] = 0.01 + Math.random() * 0.02;
      radii[i] = 3.5 + Math.random() * 9.5;

      posArray[i * 3] = Math.cos(angles[i]) * radii[i];
      posArray[i * 3 + 1] = heights[i];
      posArray[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.28,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const emberParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(emberParticles);

    // 6. Interactive Scroll and Mouse Tracking
    let scrollProgress = 0;
    let targetScrollY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight || 1;
      targetScrollY = Math.max(0, Math.min(1, window.scrollY / totalScroll));
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Initialize scroll calculation
    handleScroll();

    // 7. 60 FPS Render Loop with Smooth Spring Physics
    let clock = 0;
    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);
      clock += 0.018;

      // Smooth scroll interpolation (Damped Spring)
      scrollProgress += (targetScrollY - scrollProgress) * 0.09;
      const scrollVelocity = Math.abs(targetScrollY - scrollProgress);

      // Dynamic Helical Orbit & Spin of 3D Platters around the Timeline Spine
      platters.forEach((p, idx) => {
        // Continuous idle rotation + dynamic scroll-driven spin acceleration
        p.group.rotation.y += p.spinSpeed + (targetScrollY - scrollProgress) * 1.2;
        p.group.rotation.z = Math.sin(clock * 1.5 + idx) * 0.08;

        // Dynamic orbital position along the helical timeline path
        const currentAngle = p.angleOffset + scrollProgress * Math.PI * 4;
        p.group.position.x = Math.sin(currentAngle) * p.orbitRadius;
        p.group.position.z = Math.cos(currentAngle) * (p.orbitRadius * 0.55);

        // Vertical scroll travel tracking the page content
        p.group.position.y = p.baseY + scrollProgress * 32 - 16;
      });

      // 3D Spotlight follows scroll focus directly down the central timeline
      const targetSpotlightY = 16 - scrollProgress * 36;
      spotlight.position.y = targetSpotlightY + 8;
      spotlight.position.x = mouseX * 6;
      spotlight.target.position.set(0, targetSpotlightY, 0);
      spotlight.target.updateMatrixWorld();

      // Spotlight Cone alignment
      spotlightCone.position.set(mouseX * 3, targetSpotlightY + 10, 6);
      spotlightCone.lookAt(0, targetSpotlightY, 0);
      spotlightCone.rotation.x -= Math.PI / 2;

      // Glow Disk on the central spine
      glowDisk.position.set(0, targetSpotlightY, 0);
      glowDisk.scale.setScalar(1 + Math.sin(clock * 3) * 0.15 + scrollVelocity * 2.5);

      // Swirling Golden Embers Physics
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        angles[i] += speeds[i];
        heights[i] += speeds[i] * 1.8;

        if (heights[i] > 28) {
          heights[i] = -28;
        }

        positions[i * 3] = Math.cos(angles[i]) * radii[i];
        positions[i * 3 + 1] = heights[i];
        positions[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Subtle mouse camera tilt
      camera.position.x += (mouseX * 3.5 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 2.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup & Resource Disposal
    return () => {
      isDisposed = true;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);

      platterBaseGeo.dispose();
      goldRimGeo.dispose();
      clocheDomeGeo.dispose();
      clocheHandleGeo.dispose();
      foodCoreGeo.dispose();
      plateMat.dispose();
      goldMat.dispose();
      clocheSilverMat.dispose();
      dishMaterials.forEach((m) => m.dispose());

      coneGeo.dispose();
      coneMat.dispose();
      glowDiskGeo.dispose();
      glowDiskMat.dispose();

      particleGeo.dispose();
      particleMat.dispose();

      if (container && renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [itemCount]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-[12] overflow-hidden"
      aria-hidden="true"
    />
  );
}