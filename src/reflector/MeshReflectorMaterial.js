import { Matrix4, MeshStandardMaterial, Texture } from "three";

export class MeshReflectorMaterial extends MeshStandardMaterial {
  _debug = { value: 0 };
  _tDepth = { value: null };
  _distortionMap = { value: null };
  _tDiffuse = { value: null };
  _tDiffuseBlur = { value: null };
  _textureMatrix = { value: null };
  _hasBlur = { value: false };
  _mirror = { value: 0.0 };
  _mixBlur = { value: 0.0 };
  _blurStrength = { value: 0.5 };
  _minDepthThreshold = { value: 0.9 };
  _maxDepthThreshold = { value: 1 };
  _depthScale = { value: 0 };
  _depthToBlurRatioBias = { value: 0.25 };
  _distortion = { value: 1 };

  constructor(parameters = {}) {
    super(parameters);
    this.setValues(parameters);
  }
  onBeforeCompile(shader) {
    if (!shader.defines?.USE_UV) {
      shader.defines.USE_UV = "";
    }
    shader.uniforms.debug = this._debug;
    shader.uniforms.hasBlur = this._hasBlur;
    shader.uniforms.tDiffuse = this._tDiffuse;
    shader.uniforms.tDepth = this._tDepth;
    shader.uniforms.distortionMap = this._distortionMap;
    shader.uniforms.tDiffuseBlur = this._tDiffuseBlur;
    shader.uniforms.textureMatrix = this._textureMatrix;
    shader.uniforms.mirror = this._mirror;
    shader.uniforms.mixBlur = this._mixBlur;
    shader.uniforms.mixStrength = this._blurStrength;
    shader.uniforms.minDepthThreshold = this._minDepthThreshold;
    shader.uniforms.maxDepthThreshold = this._maxDepthThreshold;
    shader.uniforms.depthScale = this._depthScale;
    shader.uniforms.depthToBlurRatioBias = this._depthToBlurRatioBias;
    shader.uniforms.distortion = this._distortion;
    shader.vertexShader = `
        uniform mat4 textureMatrix;
        varying vec4 my_vUv;     
      ${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `#include <project_vertex>
        my_vUv = textureMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );`
    );
    shader.fragmentShader = `
        uniform int debug;
        uniform sampler2D tDiffuse;
        uniform sampler2D tDiffuseBlur;
        uniform sampler2D tDepth;
        uniform sampler2D distortionMap;
        uniform float distortion;
        uniform float cameraNear;
			  uniform float cameraFar;
        uniform bool hasBlur;
        uniform float mixBlur;
        uniform float mirror;
        uniform float mixStrength;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float depthScale;
        uniform float depthToBlurRatioBias;
        varying vec4 my_vUv;        
        ${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
    
      float distortionFactor = 0.0;
      #ifdef USE_DISTORTION
        distortionFactor = texture2D(distortionMap, vUv).r * distortion;
      #endif

      vec2 normal_uv = vec2(0.0);
      vec4 new_vUv = my_vUv;
      new_vUv.x += distortionFactor;
      new_vUv.y += distortionFactor;

      vec4 base = texture2DProj(tDiffuse, new_vUv);
      vec4 blur = texture2DProj(tDiffuseBlur, new_vUv);
      
      vec4 merge = base;
      
      #ifdef USE_NORMALMAP
        vec4 normalColor = texture2D(normalMap, vUv * normalScale);
        vec3 my_normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b ,  normalColor.g * 2.0 - 1.0 ) );
        vec3 coord = new_vUv.xyz / new_vUv.w;
        normal_uv = coord.xy + coord.z * my_normal.xz * 0.01;
        vec4 base_normal = texture2D(tDiffuse, normal_uv);
        vec4 blur_normal = texture2D(tDiffuseBlur, normal_uv);
        merge = base_normal;
        blur = blur_normal;
      #endif

      float depthFactor = 0.0001;
      float blurFactor = 0.0;

      #ifdef USE_DEPTH
        vec4 depth = vec4(0.0);
   
        #ifdef USE_NORMALMAP
          depth = texture2D(tDepth, normal_uv);
        #else
          depth = texture2DProj(tDepth, new_vUv);
        #endif

        depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
        depthFactor *= depthScale;
        depthFactor = max(0.0001, min(1.0, depthFactor));

        #ifdef USE_BLUR
          blur = blur * min(1.0, depthFactor + depthToBlurRatioBias);
          merge = merge * min(1.0, depthFactor + 0.5);;
        #else
          merge = merge * depthFactor;
        #endif
  
      #endif

      float reflectorRoughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
        reflectorRoughnessFactor *= reflectorTexelRoughness.g;
      #endif
      
      #ifdef USE_BLUR
        blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
        merge = mix(merge, blur, blurFactor);
      #endif

      diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + merge.rgb * mixStrength);           
      diffuseColor = sRGBToLinear(diffuseColor);
      
      if (debug == 1) {
        diffuseColor = sRGBToLinear(vec4(vec3(depthFactor), 1.0));
      }
      if (debug == 2) {
        diffuseColor = sRGBToLinear(vec4(vec3(blurFactor), 1.0));
      }
      if (debug == 3) {
        diffuseColor = sRGBToLinear(texture2DProj(tDiffuse, new_vUv));
      }
      if (debug == 4) {
        diffuseColor = sRGBToLinear(texture2DProj(tDiffuseBlur, new_vUv));
      }
      `
    );
  }
  get tDiffuse() {
    return this._tDiffuse.value;
  }
  set tDiffuse(v) {
    this._tDiffuse.value = v;
  }
  get tDepth() {
    return this._tDepth.value;
  }
  set tDepth(v) {
    this._tDepth.value = v;
  }
  get distortionMap() {
    return this._distortionMap.value;
  }
  set distortionMap(v) {
    this._distortionMap.value = v;
  }
  get tDiffuseBlur() {
    return this._tDiffuseBlur.value;
  }
  set tDiffuseBlur(v) {
    this._tDiffuseBlur.value = v;
  }
  get textureMatrix() {
    return this._textureMatrix.value;
  }
  set textureMatrix(v) {
    this._textureMatrix.value = v;
  }
  get hasBlur() {
    return this._hasBlur.value;
  }
  set hasBlur(v) {
    this._hasBlur.value = v;
  }
  get mirror() {
    return this._mirror.value;
  }
  set mirror(v) {
    this._mirror.value = v;
  }
  get mixBlur() {
    return this._mixBlur.value;
  }
  set mixBlur(v) {
    this._mixBlur.value = v;
  }
  get mixStrength() {
    return this._blurStrength.value;
  }
  set mixStrength(v) {
    this._blurStrength.value = v;
  }
  get minDepthThreshold() {
    return this._minDepthThreshold.value;
  }
  set minDepthThreshold(v) {
    this._minDepthThreshold.value = v;
  }
  get maxDepthThreshold() {
    return this._maxDepthThreshold.value;
  }
  set maxDepthThreshold(v) {
    this._maxDepthThreshold.value = v;
  }
  get depthScale() {
    return this._depthScale.value;
  }
  set depthScale(v) {
    this._depthScale.value = v;
  }
  get debug() {
    return this._debug.value;
  }
  set debug(v) {
    this._debug.value = v;
  }
  get depthToBlurRatioBias() {
    return this._depthToBlurRatioBias.value;
  }
  set depthToBlurRatioBias(v) {
    this._depthToBlurRatioBias.value = v;
  }
  get distortion() {
    return this._distortion.value;
  }
  set distortion(v) {
    this._distortion.value = v;
  }
}
