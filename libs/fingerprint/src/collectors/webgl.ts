/**
 * WebGL fingerprinting: extracts GPU vendor/renderer strings and hardware
 * capability parameters from the WebGL rendering context.
 */
interface WebGLData {
  vendor: string;
  renderer: string;
  maxTextureSize: number | null;
  maxViewportDims: number[] | null;
  maxVertexAttribs: number | null;
  maxVertexTextureImageUnits: number | null;
  maxFragmentUniformVectors: number | null;
  aliasedLineWidthRange: number[] | null;
  aliasedPointSizeRange: number[] | null;
  maxRenderbufferSize: number | null;
  redBits: number | null;
  greenBits: number | null;
  blueBits: number | null;
  alphaBits: number | null;
  depthBits: number | null;
  stencilBits: number | null;
}

function toArray(v: unknown): number[] | null {
  if (v == null) return null;
  if (v instanceof Float32Array || v instanceof Int32Array) {
    return Array.from(v);
  }
  return null;
}

export function getWebGLFingerprint(): string {
  if (typeof document === 'undefined') return '';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const gl: WebGLRenderingContext | null =
      canvas.getContext('webgl') ??
      // 'experimental-webgl' is not a standard TS overload; cast is necessary
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return '';

    const ext = gl.getExtension('WEBGL_debug_renderer_info');

    const data: WebGLData = {
      vendor: ext
        ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL))
        : String(gl.getParameter(gl.VENDOR)),
      renderer: ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER)),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number | null,
      maxViewportDims: toArray(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number | null,
      maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) as number | null,
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number | null,
      aliasedLineWidthRange: toArray(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)),
      aliasedPointSizeRange: toArray(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number | null,
      redBits: gl.getParameter(gl.RED_BITS) as number | null,
      greenBits: gl.getParameter(gl.GREEN_BITS) as number | null,
      blueBits: gl.getParameter(gl.BLUE_BITS) as number | null,
      alphaBits: gl.getParameter(gl.ALPHA_BITS) as number | null,
      depthBits: gl.getParameter(gl.DEPTH_BITS) as number | null,
      stencilBits: gl.getParameter(gl.STENCIL_BITS) as number | null,
    };

    // Free GPU resources
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    return JSON.stringify(data);
  } catch {
    return '';
  }
}
