// Location: components/three/CulinaryCanvas.tsx
"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

interface CulinaryCanvasProps {
  itemCount?: number;
}

/**
 * 🌟 GLASSY WHITE VOLUMETRIC SPOTLIGHT ENGINE (Urban Ambrosia)
 * Ultra-clean luxury lighting (all plates, meshes, and sparkles completely removed):
 * 1. Smooth, glassy white spotlight with zero sharp or pointed edges.
 * 2. Feathered radial Gaussian light pool following active timeline scroll position.
 * 3. Soft ambient stage illumination with smooth mouse parallax.
 */
export default function CulinaryCanvas({ itemCount = 6 }: CulinaryCanvasProps) {
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
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 24);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Diffused Glassy White Studio Spotlight
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    // Glassy White Spotlight with wide penumbra for ultra-soft, smooth falloff (no harsh edges)
    const spotlight = new THREE.SpotLight(0xffffff, 4.5, 65, Math.PI / 3.2, 0.9, 1.4);
    spotlight.position.set(0, 22, 18);
    scene.add(spotlight);

    // Subtle ethereal fill lights
    const softLeft = new THREE.PointLight(0xffffff, 1.4, 35);
    softLeft.position.set(-14, 0, 8);
    scene.add(softLeft);

    const softRight = new THREE.PointLight(0xfef3c7, 1.2, 35);
    softRight.position.set(14, 0, 8);
    scene.add(softRight);

    // 3. Smooth Glassy White Radial Light Pools (No Pointed Geometry)
    // Procedural feathered Gaussian falloff texture
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.65)");
      gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.38)");
      gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.14)");
      gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.03)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    const smoothLightTexture = new THREE.CanvasTexture(canvas);

    // Soft spotlight beam shaft (Smooth vertical oval with feathered transparency)
    const beamGeo = new THREE.PlaneGeometry(14, 28);
    const beamMat = new THREE.MeshBasicMaterial({
      map: smoothLightTexture,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const spotlightBeam = new THREE.Mesh(beamGeo, beamMat);
    spotlightBeam.position.set(0, 10, 4);
    scene.add(spotlightBeam);

    // Center Timeline Spotlight Pool (Feathered glassy white circle on the spine)
    const poolGeo = new THREE.PlaneGeometry(10, 10);
    const poolMat = new THREE.MeshBasicMaterial({
      map: smoothLightTexture,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const spotlightPool = new THREE.Mesh(poolGeo, poolMat);
    scene.add(spotlightPool);

    // 4. Scroll & Mouse Tracking
    let scrollProgress = 0;
    let targetScrollY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight || 1;
      targetScrollY = Math.max(0, Math.min(1, window.scrollY / maxScroll));
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

    handleScroll();

    // 5. 60 FPS Render Loop
    let clock = 0;
    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);
      clock += 0.015;

      // Smooth scroll interpolation
      scrollProgress += (targetScrollY - scrollProgress) * 0.08;

      // Smooth vertical movement of the glassy white spotlight down the timeline
      const targetSpotlightY = 14 - scrollProgress * 32;

      // Spotlight source & target
      spotlight.position.y = targetSpotlightY + 8;
      spotlight.position.x = mouseX * 4;
      spotlight.target.position.set(0, targetSpotlightY, 0);
      spotlight.target.updateMatrixWorld();

      // Soft light beam tracking
      spotlightBeam.position.set(mouseX * 2, targetSpotlightY + 6, 2);
      spotlightBeam.scale.set(
        1 + Math.sin(clock * 1.5) * 0.05,
        1 + Math.cos(clock * 1.2) * 0.05,
        1
      );

      // Glassy white pool tracking on the central spine
      spotlightPool.position.set(0, targetSpotlightY, 0);
      spotlightPool.scale.setScalar(1 + Math.sin(clock * 2) * 0.08);

      // Subtle mouse camera tilt
      camera.position.x += (mouseX * 2.0 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 1.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);

      beamGeo.dispose();
      beamMat.dispose();
      poolGeo.dispose();
      poolMat.dispose();
      smoothLightTexture.dispose();

      if (container && renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [itemCount]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-[2] overflow-hidden"
      aria-hidden="true"
    />
  );
}