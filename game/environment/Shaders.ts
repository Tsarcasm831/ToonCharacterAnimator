export const WATER_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float uTime;

void main() {
    vUv = uv;
    vec3 pos = position;
    float dist = length(pos.xy);
    pos.z += sin(dist * 2.0 - uTime * 1.5) * 0.05;
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const WATER_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uFoamColor;
uniform vec2 uCenter;
uniform float uRadius;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    float dist = length(vWorldPosition.xz - uCenter);
    float radius = uRadius;
    float n1 = noise(vUv * 15.0 + uTime * 0.5);
    float n2 = noise(vUv * 25.0 - uTime * 0.3);
    float caustics = pow(n1 * n2, 1.5) * 0.5;
    float foamLine = smoothstep(radius - 0.5, radius, dist);
    float finalFoam = caustics + foamLine * 0.4;
    vec3 color = mix(uColor, uFoamColor, finalFoam);
    float alpha = 0.7 + foamLine * 0.3;
    gl_FragColor = vec4(color, alpha);
}
`;

export const SKY_VERTEX_SHADER = `
varying vec3 vWorldPosition;
varying vec3 vViewDir;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vViewDir = normalize(vWorldPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SKY_FRAGMENT_SHADER = `
varying vec3 vWorldPosition;
varying vec3 vViewDir;

uniform vec3 topColor;
uniform vec3 bottomColor;
uniform vec3 sunColor;
uniform vec3 sunPos;
uniform float sunSize;

void main() {
    float h = vViewDir.y;
    
    float gradientFactor = max(pow(max(h + 0.1, 0.0), 0.8), 0.0);
    vec3 skyColor = mix(bottomColor, topColor, gradientFactor);
    
    float sunIntensity = dot(vViewDir, normalize(sunPos));
    float sunGlow = pow(max(sunIntensity, 0.0), 120.0) * 1.5;
    float sunDisk = smoothstep(sunSize, sunSize + 0.005, sunIntensity);
    
    vec3 finalColor = skyColor + (sunColor * sunGlow) + (sunColor * sunDisk);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;
