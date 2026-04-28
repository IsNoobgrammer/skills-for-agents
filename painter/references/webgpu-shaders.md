# WebGPU & Shaders for UI/UX

Advanced GPU-accelerated effects for modern web interfaces.

---

## When to Use WebGPU

**Use WebGPU when:**
- Building particle systems (10,000+ particles)
- Creating fluid simulations or organic transitions
- Implementing real-time image/video effects
- Need compute shaders for physics or data processing
- Targeting modern browsers (70%+ coverage in 2026)

**Stick with CSS/WebGL when:**
- Simple animations (CSS is faster to implement)
- Need maximum browser compatibility
- Effects don't require compute shaders
- Team lacks GPU programming experience

---

## Performance Gains

WebGPU vs WebGL:
- Rendering: 2-3× faster for complex scenes
- Particles: 15-20× faster
- Compute: 15-30× faster
- Example: 15k objects at 15 FPS (WebGL) → 200k objects at 60 FPS (WebGPU)

WebGPU vs CSS:
- CSS wins for simple transforms/opacity
- WebGPU wins for particle systems, fluid sims, procedural effects
- Hybrid approach: CSS for UI state, WebGPU for visual effects

---

## Core Concepts

### WGSL (WebGPU Shading Language)

Rust-inspired, strictly typed shader language.

**Basic structure:**
```wgsl
@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4<f32> {
  // Vertex shader: transform geometry
  return vec4(position, 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  // Fragment shader: color pixels
  return vec4(1.0, 0.0, 0.0, 1.0); // red
}

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id: vec3<u32>) {
  // Compute shader: parallel data processing
}
```

**Types:**
- Scalars: `f32`, `i32`, `u32`, `bool`
- Vectors: `vec2<f32>`, `vec3<f32>`, `vec4<f32>`
- Matrices: `mat4x4<f32>`

**Swizzling:**
```wgsl
let color = vec4(1.0, 0.5, 0.2, 1.0);
let rg = color.rg;   // vec2(1.0, 0.5)
let bgr = color.bgr; // vec3(0.2, 0.5, 1.0)
```

### Compute Shaders

Parallel data processing on GPU. Perfect for:
- Particle position updates
- Physics simulations
- Fluid dynamics
- Image processing
- Data transformations

**Pattern:**
```wgsl
struct Particle {
  position: vec2<f32>,
  velocity: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> deltaTime: f32;

@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  var particle = particles[index];
  
  // Update physics
  particle.position += particle.velocity * deltaTime;
  
  // Bounce off edges
  if (abs(particle.position.x) > 1.0) {
    particle.velocity.x *= -1.0;
  }
  
  particles[index] = particle;
}
```

---

## UI Effect Patterns

### 1. Particle Backgrounds

**Use case:** Dynamic backgrounds that react to mouse/scroll.

**Implementation:**
- Compute shader updates particle positions
- Fragment shader renders with glow/blur
- Pass mouse position as uniform for attraction

**Performance:** 10,000+ particles at 60fps.

**Code structure:**
```javascript
// Setup
const particleCount = 10000;
const particleBuffer = device.createBuffer({
  size: particleCount * 16, // vec4 per particle
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

// Update loop
function animate() {
  // Dispatch compute shader
  const computePass = encoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, bindGroup);
  computePass.dispatchWorkgroups(Math.ceil(particleCount / 64));
  computePass.end();
  
  // Render particles
  const renderPass = encoder.beginRenderPass({...});
  renderPass.setPipeline(renderPipeline);
  renderPass.draw(particleCount);
  renderPass.end();
  
  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(animate);
}
```

### 2. Fluid Simulations

**Use case:** Organic transitions, hover effects, reveal animations.

**Implementation:**
- Simplified Navier-Stokes in compute shader
- Render fluid as displacement/distortion texture
- Apply to DOM elements via canvas overlay

**Performance:** 512×512 fluid grid at 60fps.

**Shader pattern:**
```wgsl
// Advection step
@compute @workgroup_size(8, 8)
fn advect(@builtin(global_invocation_id) id: vec3<u32>) {
  let pos = vec2<f32>(id.xy);
  let velocity = textureLoad(velocityTexture, id.xy, 0).xy;
  let prevPos = pos - velocity * deltaTime;
  let advected = textureSampleLevel(densityTexture, sampler, prevPos / resolution, 0.0);
  textureStore(outputTexture, id.xy, advected);
}
```

### 3. Morphing Text Effects

**Use case:** Animated typography, logo reveals, hero sections.

**Implementation:**
- Convert text to particle positions (one per pixel)
- Interpolate between text states in compute shader
- Render as instanced points or meshes

**Performance:** 50,000+ particles for large text at 60fps.

**Pattern:**
```wgsl
@compute @workgroup_size(64)
fn morph(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  let startPos = startPositions[index];
  let endPos = endPositions[index];
  let t = smoothstep(0.0, 1.0, progress);
  particles[index].position = mix(startPos, endPos, t);
}
```

### 4. Procedural Gradients

**Use case:** Animated backgrounds, loading states, ambient effects.

**Implementation:**
- Fragment shader generates noise/gradients
- Time uniform for animation
- No geometry needed (fullscreen quad)

**Performance:** Negligible overhead.

**Shader:**
```wgsl
@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let noise = fbm(uv * 3.0 + time * 0.1);
  let gradient = mix(color1, color2, noise);
  return vec4(gradient, 1.0);
}

fn fbm(p: vec2<f32>) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var frequency = 1.0;
  for (var i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
```

### 5. GPU-Accelerated Filters

**Use case:** Real-time image effects, photo editors, video filters.

**Implementation:**
- Load image as texture
- Apply effects in fragment shader
- Compute shader for multi-pass effects (blur, etc.)

**Performance:** 1080p real-time at 60fps.

**Blur example:**
```wgsl
@compute @workgroup_size(8, 8)
fn blur(@builtin(global_invocation_id) id: vec3<u32>) {
  var sum = vec4<f32>(0.0);
  let radius = 5;
  for (var y = -radius; y <= radius; y++) {
    for (var x = -radius; x <= radius; x++) {
      let offset = vec2<i32>(x, y);
      let sample = textureLoad(inputTexture, id.xy + offset, 0);
      sum += sample;
    }
  }
  let blurred = sum / f32((radius * 2 + 1) * (radius * 2 + 1));
  textureStore(outputTexture, id.xy, blurred);
}
```

---

## Three.js Integration

### WebGPURenderer

Three.js r171+ includes WebGPURenderer.

```javascript
import { WebGPURenderer } from 'three/webgpu';

const renderer = new WebGPURenderer({ antialias: true });
await renderer.init(); // async required

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Use like WebGLRenderer
renderer.render(scene, camera);
```

**Key differences:**
- Async initialization
- TSL (Three Shading Language) for custom shaders
- Some features still catching up to WebGL

### TSL (Three Shading Language)

Node-based shader system for WebGPU.

```javascript
import { MeshBasicNodeMaterial, vec3, uniform } from 'three/nodes';

const material = new MeshBasicNodeMaterial();
const timeUniform = uniform(0);

material.colorNode = vec3(
  Math.sin(timeUniform),
  Math.cos(timeUniform),
  0.5
);

// Update in render loop
function animate() {
  timeUniform.value = performance.now() * 0.001;
  renderer.render(scene, camera);
}
```

---

## Libraries & Tools

### UI-Focused

**Shaders.com**
90+ composable WebGPU effects for React/Vue/Svelte. No GLSL/WGSL required.

```jsx
import { Shader, Noise, Gradient } from '@shaders/react';

<Shader>
  <Noise scale={3} speed={0.5} />
  <Gradient colors={['#ff0080', '#7928ca']} />
</Shader>
```

**gpu-curtains**
DOM-synced WebGPU planes. Perfect for image effects on DOM elements.

```javascript
import { GPUCurtains, Plane } from 'gpu-curtains';

const curtains = new GPUCurtains({ container: '#canvas' });
const plane = new Plane(curtains, document.querySelector('.image'), {
  vertexShader: vs,
  fragmentShader: fs,
});
```

### General WebGPU

**Three.js WebGPU**
Full 3D engine with WebGPU support.

**GPU.js**
GPU-accelerated JavaScript (WebGL/WebGPU fallback).

---

## Best Practices

### Progressive Enhancement

Always detect support and provide fallbacks:

```javascript
async function initWebGPU() {
  if (!navigator.gpu) {
    // Fallback to CSS animations or WebGL
    console.warn('WebGPU not supported');
    return null;
  }
  
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.warn('No WebGPU adapter');
    return null;
  }
  
  return await adapter.requestDevice();
}
```

### Performance

**1. Batch operations**
Minimize pipeline switches. Group by material/shader.

**2. Reuse buffers**
Don't recreate buffers every frame. Update existing ones.

**3. Use compute for heavy work**
Particle updates, physics → compute shaders.

**4. Profile**
Chrome DevTools has WebGPU profiling. Use it.

**5. Respect reduced motion**
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Disable or simplify effects
}
```

### Resource Management

**Cleanup:**
```javascript
buffer.destroy();
texture.destroy();
pipeline = null;
```

**Buffer alignment:**
Uniform buffers must be 256-byte aligned. Add padding:
```wgsl
struct Uniforms {
  time: f32,
  _padding: vec3<f32>, // align to 16 bytes
}
```

---

## Gotchas

**1. Async initialization**
WebGPU setup is async. Handle gracefully.

**2. Shader compilation errors**
WGSL is strict. Use browser dev tools for detailed errors.

**3. Browser support**
70% in 2026, but always check and fallback.

**4. Memory limits**
Mobile devices have less GPU memory. Test on real devices.

**5. Coordinate systems**
WebGPU uses top-left origin, Y-down. CSS uses bottom-left, Y-up. Convert when needed.

---

## Migration from WebGL

### Checklist

- [ ] Update Three.js to r171+
- [ ] Change `WebGLRenderer` to `WebGPURenderer`
- [ ] Add `await renderer.init()`
- [ ] Convert GLSL shaders to WGSL or TSL
- [ ] Update post-processing (some not yet ported)
- [ ] Test on target browsers
- [ ] Add WebGL fallback

### Shader conversion

**GLSL → WGSL key changes:**
- `attribute` → `@location(0)`
- `varying` → `@location(0)` (both vertex out and fragment in)
- `uniform` → `@group(0) @binding(0) var<uniform>`
- `gl_Position` → `@builtin(position)`
- `gl_FragColor` → `@location(0)` return value
- `vec3(1.0)` → `vec3<f32>(1.0)` (explicit types)
- `texture2D(tex, uv)` → `textureSample(tex, sampler, uv)`

---

## When to Use What

| Effect | CSS | WebGL | WebGPU |
|--------|-----|-------|--------|
| Simple fade/slide | ✅ Best | ❌ Overkill | ❌ Overkill |
| Complex 3D | ❌ Can't | ✅ Good | ✅ Better |
| Particle systems (1k+) | ❌ Can't | ⚠️ Slow | ✅ Best |
| Fluid simulations | ❌ Can't | ⚠️ Limited | ✅ Best |
| Image filters | ❌ Limited | ✅ Good | ✅ Better |
| Procedural backgrounds | ❌ Can't | ✅ Good | ✅ Better |
| Compute (physics, ML) | ❌ Can't | ⚠️ Limited | ✅ Best |

**Decision tree:**
1. Can CSS do it? → Use CSS
2. Need compute shaders? → Use WebGPU
3. Need max compatibility? → Use WebGL
4. Need cutting-edge performance? → Use WebGPU with WebGL fallback

---

## Resources

**Official:**
- [MDN WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Tour of WGSL](https://google.github.io/tour-of-wgsl/)
- [WebGPU Fundamentals](https://webgpufundamentals.org/)

**Examples:**
- [WebGPU Samples](https://github.com/webgpu/webgpu-samples)
- [awesome-webgpu](https://github.com/mikbry/awesome-webgpu)

**Advanced:**
- [WebGPU Fluids Tutorial](https://tympanus.net/codrops/2025/01/29/particles-progress-and-perseverance-a-journey-into-webgpu-fluids/)
- [Text Particle Effects](https://ics.media/en/entry/221216/)
