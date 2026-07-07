'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useTheme } from 'next-themes'

export function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(isDark ? 0x0f0f18 : 0xffffff, 10, 50)
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 700
    const posArray = new Float32Array(particlesCount * 3)
    
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 40
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: isDark ? 0x8585ff : 0x6366f1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })
    
    const particlesMesh = new THREE.Points(particlesGeometry, material)
    scene.add(particlesMesh)
    camera.position.z = 15

    let mouseX = 0
    let mouseY = 0

    const windowHalfX = window.innerWidth / 2
    const windowHalfY = window.innerHeight / 2

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX)
      mouseY = (event.clientY - windowHalfY)
    }

    document.addEventListener('mousemove', onDocumentMouseMove)

    const clock = new THREE.Clock()

    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()
      
      const targetX = mouseX * 0.001
      const targetY = mouseY * 0.001

      particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y)
      particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x)
      particlesMesh.position.y = Math.sin(elapsedTime * 0.2) * 0.5
      
      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('mousemove', onDocumentMouseMove)
      cancelAnimationFrame(animationFrameId)
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
      particlesGeometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [isDark])

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 -z-10 opacity-60 pointer-events-none" 
    />
  )
}
