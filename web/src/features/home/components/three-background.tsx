/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect, useRef } from 'react'

type ThreeModule = typeof import('three')

const BLUE = [0.16, 0.6, 1]
const PURPLE = [0.75, 0.35, 0.95]
const WHITE = [0.96, 0.96, 0.98]

function pickColor(rand: () => number): number[] {
  const r = rand()
  if (r < 0.45) return BLUE
  if (r < 0.8) return PURPLE
  return WHITE
}

function initBackground(
  THREE: ThreeModule,
  canvas: HTMLCanvasElement
): () => void {
  let renderer: InstanceType<ThreeModule['WebGLRenderer']> | null = null
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    })
  } catch {
    return () => {}
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.z = 9

  const isMobile = window.innerWidth < 820
  const COUNT = isMobile ? 90 : 180
  const BOUNDS = { x: 11, y: 6.5, z: 3 }
  const LINK_DIST = 2.4
  const MAX_LINKS = COUNT * 6

  const positions = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)
  const velocities = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i += 1) {
    positions[i * 3] = (Math.random() * 2 - 1) * BOUNDS.x
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * BOUNDS.y
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * BOUNDS.z
    const c = pickColor(Math.random)
    colors[i * 3] = c[0]
    colors[i * 3 + 1] = c[1]
    colors[i * 3 + 2] = c[2]
    velocities[i * 3] = (Math.random() - 0.5) * 0.12
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.06
  }

  const pointsGeo = new THREE.BufferGeometry()
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const pointsMat = new THREE.PointsMaterial({
    size: 0.09,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
  })
  const points = new THREE.Points(pointsGeo, pointsMat)
  scene.add(points)

  const linePositions = new Float32Array(MAX_LINKS * 6)
  const lineColors = new Float32Array(MAX_LINKS * 6)
  const linesGeo = new THREE.BufferGeometry()
  linesGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(linePositions, 3)
  )
  linesGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))
  const linesMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  })
  const lines = new THREE.LineSegments(linesGeo, linesMat)
  lines.frustumCulled = false
  scene.add(lines)

  const mouse = new THREE.Vector2(9999, 9999)
  const mouseWorld = new THREE.Vector3()
  const onMouseMove = (event: MouseEvent): void => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  }
  const onMouseLeave = (): void => {
    mouse.x = 9999
    mouse.y = 9999
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseleave', onMouseLeave)

  const resize = (): void => {
    const width = window.innerWidth
    const height = window.innerHeight
    renderer?.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  let raf = 0
  let last = performance.now()
  const step = (now: number): void => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    if (mouse.x < 9000) {
      mouseWorld.set(mouse.x * BOUNDS.x, mouse.y * BOUNDS.y, 0)
    }
    for (let i = 0; i < COUNT; i += 1) {
      let vx = velocities[i * 3]
      let vy = velocities[i * 3 + 1]
      let vz = velocities[i * 3 + 2]
      if (mouse.x < 9000) {
        const dx = positions[i * 3] - mouseWorld.x
        const dy = positions[i * 3 + 1] - mouseWorld.y
        const dz = positions[i * 3 + 2] - mouseWorld.z
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < 4 && d2 > 0.0001) {
          const d = Math.sqrt(d2)
          const push = ((2 - d) / 2) * 0.55 * dt
          vx += (dx / d) * push
          vy += (dy / d) * push
          vz += (dz / d) * push
        }
      }
      vx *= 1 - 0.4 * dt
      vy *= 1 - 0.4 * dt
      vz *= 1 - 0.4 * dt
      velocities[i * 3] = vx
      velocities[i * 3 + 1] = vy
      velocities[i * 3 + 2] = vz
      positions[i * 3] += vx * dt * 8
      positions[i * 3 + 1] += vy * dt * 8
      positions[i * 3 + 2] += vz * dt * 8
      if (positions[i * 3] > BOUNDS.x || positions[i * 3] < -BOUNDS.x) {
        velocities[i * 3] *= -1
        positions[i * 3] = Math.max(
          -BOUNDS.x,
          Math.min(BOUNDS.x, positions[i * 3])
        )
      }
      if (positions[i * 3 + 1] > BOUNDS.y || positions[i * 3 + 1] < -BOUNDS.y) {
        velocities[i * 3 + 1] *= -1
        positions[i * 3 + 1] = Math.max(
          -BOUNDS.y,
          Math.min(BOUNDS.y, positions[i * 3 + 1])
        )
      }
      if (positions[i * 3 + 2] > BOUNDS.z || positions[i * 3 + 2] < -BOUNDS.z) {
        velocities[i * 3 + 2] *= -1
        positions[i * 3 + 2] = Math.max(
          -BOUNDS.z,
          Math.min(BOUNDS.z, positions[i * 3 + 2])
        )
      }
    }
    pointsGeo.attributes.position.needsUpdate = true

    let linkCount = 0
    for (let i = 0; i < COUNT && linkCount < MAX_LINKS; i += 1) {
      for (let j = i + 1; j < COUNT && linkCount < MAX_LINKS; j += 1) {
        const dx = positions[i * 3] - positions[j * 3]
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 > LINK_DIST * LINK_DIST) continue
        const fade = 1 - Math.sqrt(d2) / LINK_DIST
        const o = linkCount * 6
        linePositions[o] = positions[i * 3]
        linePositions[o + 1] = positions[i * 3 + 1]
        linePositions[o + 2] = positions[i * 3 + 2]
        linePositions[o + 3] = positions[j * 3]
        linePositions[o + 4] = positions[j * 3 + 1]
        linePositions[o + 5] = positions[j * 3 + 2]
        const r = (colors[i * 3] + colors[j * 3]) / 2
        const g = (colors[i * 3 + 1] + colors[j * 3 + 1]) / 2
        const b = (colors[i * 3 + 2] + colors[j * 3 + 2]) / 2
        lineColors[o] = r * fade
        lineColors[o + 1] = g * fade
        lineColors[o + 2] = b * fade
        lineColors[o + 3] = r * fade
        lineColors[o + 4] = g * fade
        lineColors[o + 5] = b * fade
        linkCount += 1
      }
    }
    linesGeo.setDrawRange(0, linkCount * 2)
    linesGeo.attributes.position.needsUpdate = true
    linesGeo.attributes.color.needsUpdate = true

    renderer?.render(scene, camera)
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseleave', onMouseLeave)
    window.removeEventListener('resize', resize)
    scene.remove(points)
    scene.remove(lines)
    pointsGeo.dispose()
    pointsMat.dispose()
    linesGeo.dispose()
    linesMat.dispose()
    renderer?.dispose()
    renderer?.forceContextLoss()
  }
}

export function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cancelled = false
    let cleanup: (() => void) | undefined
    import('three')
      .then((THREE) => {
        if (cancelled) return
        cleanup = initBackground(THREE, canvas)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  )
}
