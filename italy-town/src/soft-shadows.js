import { ShaderChunk } from "three";

/** Contact-hardening sunlight. Near a surface shadows stay crisp; farther away
 * they soften, as they would under a large photographic softbox. */
export function installSoftShadows() {
  const pcss = `
  float portoSoftShadow(sampler2D shadowMap, vec2 uv, float receiver) {
    float angle = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.283185;
    float blockers = 0.0;
    float blockerDepth = 0.0;
    for (int i = 0; i < 16; i++) {
      float a = float(i) * 2.399963 + angle;
      vec2 offset = vec2(cos(a), sin(a)) * sqrt((float(i) + .5) / 16.0) * .008;
      float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + offset));
      if (depth < receiver - .00008) { blockers += 1.0; blockerDepth += depth; }
    }
    if (blockers < 1.0) return 1.0;
    float separation = max(0.0, receiver - blockerDepth / blockers);
    float penumbra = clamp(separation * .09, .0003, .023);
    float result = 0.0;
    for (int i = 0; i < 32; i++) {
      float a = float(i) * 2.399963 + angle;
      vec2 offset = vec2(cos(a), sin(a)) * sqrt((float(i) + .5) / 32.0) * penumbra;
      result += texture2DCompare(shadowMap, uv + offset, receiver);
    }
    return result / 32.0;
  }
  `;
  ShaderChunk.shadowmap_pars_fragment = ShaderChunk.shadowmap_pars_fragment
    .replace("float getShadow(", `${pcss}\nfloat getShadow(`)
    .replace(
      "if ( frustumTest ) {",
      "if ( frustumTest ) { return mix(1.0, portoSoftShadow(shadowMap, shadowCoord.xy, shadowCoord.z), shadowIntensity);",
    );
}
