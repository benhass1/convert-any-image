/**
 * Signal Utility design reminder: disclose exact capabilities and execute every available transformation locally.
 */

export const outputFormats = [
  { value: "webp", label: "WEBP", ext: "webp", mime: "image/webp", family: "Popular", magick: "WebP" },
  { value: "jpg", label: "JPG", ext: "jpg", mime: "image/jpeg", family: "Popular", magick: "Jpeg" },
  { value: "png", label: "PNG", ext: "png", mime: "image/png", family: "Popular", magick: "Png" },
  { value: "avif", label: "AVIF", ext: "avif", mime: "image/avif", family: "Popular", magick: "Avif" },
  { value: "svg", label: "SVG", ext: "svg", mime: "image/svg+xml", family: "Vector & document", magick: "Svg" },
  { value: "pdf", label: "PDF", ext: "pdf", mime: "application/pdf", family: "Vector & document", magick: "Pdf" },
  { value: "psd", label: "PSD", ext: "psd", mime: "image/vnd.adobe.photoshop", family: "Advanced local", magick: "Psd" },
  { value: "ico", label: "ICO", ext: "ico", mime: "image/x-icon", family: "Specialty", magick: "Ico" },
  { value: "cur", label: "CUR", ext: "cur", mime: "image/x-icon", family: "Specialty", magick: "Cur" },
  { value: "tiff", label: "TIFF", ext: "tiff", mime: "image/tiff", family: "Specialty", magick: "Tiff" },
  { value: "bmp", label: "BMP", ext: "bmp", mime: "image/bmp", family: "Specialty", magick: "Bmp" },
  { value: "gif", label: "GIF", ext: "gif", mime: "image/gif", family: "Specialty", magick: "Gif" },
  { value: "tga", label: "TGA", ext: "tga", mime: "image/x-tga", family: "Specialty", magick: "Tga" },
] as const;

export type OutputFormat = (typeof outputFormats)[number]["value"];
export type ProcessingPhase = "loading-engine" | "decoding" | "converting" | "packaging";

type FormatStatus = "native" | "wasm" | "local";
export type FormatDescriptor = { label: string; extensions: string[]; status: FormatStatus; category: string; direction: "Input & output" | "Input only" };

export const formatRegistry: FormatDescriptor[] = [
  { label: "JPEG", extensions: ["jpg", "jpeg"], status: "native", category: "Standard web", direction: "Input & output" },
  { label: "PNG", extensions: ["png"], status: "native", category: "Standard web", direction: "Input & output" },
  { label: "WEBP", extensions: ["webp"], status: "native", category: "Standard web", direction: "Input & output" },
  { label: "AVIF", extensions: ["avif"], status: "native", category: "Standard web", direction: "Input & output" },
  { label: "GIF", extensions: ["gif"], status: "native", category: "Standard web", direction: "Input & output" },
  { label: "BMP", extensions: ["bmp"], status: "native", category: "Standard web", direction: "Input & output" },
  { label: "TIFF", extensions: ["tif", "tiff"], status: "native", category: "Standard web", direction: "Input & output" },
  { label: "ICO", extensions: ["ico"], status: "native", category: "Standard web", direction: "Input & output" },
  { label: "CUR", extensions: ["cur"], status: "wasm", category: "Standard web", direction: "Input & output" },
  { label: "HEIC / HEIF", extensions: ["heic", "heif"], status: "native", category: "Mobile & next-gen", direction: "Input & output" },
  { label: "JPEG XL", extensions: ["jxl"], status: "wasm", category: "Mobile & next-gen", direction: "Input & output" },
  { label: "SVG", extensions: ["svg"], status: "native", category: "Vector & document", direction: "Input & output" },
  { label: "EPS", extensions: ["eps"], status: "wasm", category: "Vector & document", direction: "Input & output" },
  { label: "PDF", extensions: ["pdf"], status: "wasm", category: "Vector & document", direction: "Input & output" },
  { label: "Canon RAW", extensions: ["cr2", "cr3"], status: "wasm", category: "Camera RAW", direction: "Input only" },
  { label: "Nikon RAW", extensions: ["nef"], status: "wasm", category: "Camera RAW", direction: "Input only" },
  { label: "Sony RAW", extensions: ["arw"], status: "wasm", category: "Camera RAW", direction: "Input only" },
  { label: "Adobe DNG", extensions: ["dng"], status: "wasm", category: "Camera RAW", direction: "Input only" },
  { label: "Fujifilm RAW", extensions: ["raf"], status: "wasm", category: "Camera RAW", direction: "Input only" },
  { label: "Panasonic RAW", extensions: ["rw2"], status: "wasm", category: "Camera RAW", direction: "Input only" },
  { label: "Photoshop", extensions: ["psd"], status: "native", category: "Design & HDR", direction: "Input & output" },
  { label: "Targa", extensions: ["tga"], status: "wasm", category: "Design & HDR", direction: "Input & output" },
  { label: "OpenEXR", extensions: ["exr"], status: "wasm", category: "Design & HDR", direction: "Input & output" },
  { label: "Radiance HDR", extensions: ["hdr"], status: "wasm", category: "Design & HDR", direction: "Input & output" },
];

export const supportedInputExtensions = new Set(formatRegistry.flatMap((format) => format.extensions));
export const browserReadyExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "bmp", "tif", "tiff", "ico", "heic", "heif", "svg"]);
const nativeCanvasOutputs = new Set<OutputFormat>(["jpg", "png", "webp", "avif", "svg", "pdf", "psd", "ico", "cur", "tiff", "bmp", "gif", "tga"]);

let magickLoad: Promise<typeof import("@imagemagick/magick-wasm")> | null = null;

async function loadMagick() {
  if (!magickLoad) {
    magickLoad = (async () => {
      const magick = await import("@imagemagick/magick-wasm");
      await magick.initializeImageMagick(new URL("/manus-storage/imagemagick-x86_daf0dc7a.wasm", window.location.origin));
      return magick;
    })();
  }
  return magickLoad;
}

export function extensionOf(fileName: string) { return fileName.split(".").pop()?.toLowerCase() || ""; }
export function prettySize(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
export function formatFor(value: OutputFormat) { return outputFormats.find((format) => format.value === value)!; }

function imageFromBlob(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob); const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This browser cannot decode the image.")); };
    image.src = url;
  });
}
function blobFromCanvas(canvas: HTMLCanvasElement, type: string, quality = .92) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("This browser cannot encode the selected output format.")), type, quality));
}
async function pdfFromCanvas(source: HTMLCanvasElement) {
  const { jsPDF } = await import("jspdf");
  const width = Math.max(1, source.width); const height = Math.max(1, source.height);
  const page = new jsPDF({ orientation: width > height ? "landscape" : "portrait", unit: "px", format: [width, height], compress: true, hotfixes: ["px_scaling"] });
  const flattened = document.createElement("canvas"); flattened.width = width; flattened.height = height;
  const context = flattened.getContext("2d"); if (!context) throw new Error("Canvas is unavailable.");
  context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height); context.drawImage(source, 0, 0, width, height);
  page.addImage(flattened.toDataURL("image/jpeg", .92), "JPEG", 0, 0, page.internal.pageSize.getWidth(), page.internal.pageSize.getHeight(), undefined, "FAST");
  return page.output("blob");
}
async function psdFromCanvas(source: HTMLCanvasElement) {
  const { initializeCanvas, writePsd } = await import("ag-psd");
  initializeCanvas((width, height) => { const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; return canvas; });
  const bytes = writePsd({ width: source.width, height: source.height, children: [{ name: "Converted image", canvas: source }] });
  return new Blob([bytes], { type: "image/vnd.adobe.photoshop" });
}
function pixelsFromCanvas(source: HTMLCanvasElement) {
  const context = source.getContext("2d"); if (!context) throw new Error("Canvas is unavailable.");
  return context.getImageData(0, 0, source.width, source.height);
}
async function dataUrlFromBlob(blob: Blob) { return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("The image preview could not be encoded.")); reader.readAsDataURL(blob); }); }
async function svgFromCanvas(source: HTMLCanvasElement) {
  const png = await blobFromCanvas(source, "image/png"); const imageData = await dataUrlFromBlob(png);
  return new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${source.width}" height="${source.height}" viewBox="0 0 ${source.width} ${source.height}"><image href="${imageData}" width="${source.width}" height="${source.height}"/></svg>`], { type: "image/svg+xml" });
}
function bmpFromCanvas(source: HTMLCanvasElement) {
  const { data, width, height } = pixelsFromCanvas(source); const rowSize = Math.ceil((width * 3) / 4) * 4; const file = new Uint8Array(54 + rowSize * height); const view = new DataView(file.buffer);
  file[0] = 0x42; file[1] = 0x4d; view.setUint32(2, file.length, true); view.setUint32(10, 54, true); view.setUint32(14, 40, true); view.setInt32(18, width, true); view.setInt32(22, height, true); view.setUint16(26, 1, true); view.setUint16(28, 24, true); view.setUint32(34, rowSize * height, true);
  let offset = 54; for (let y = height - 1; y >= 0; y--) { for (let x = 0; x < width; x++) { const pixel = (y * width + x) * 4; file[offset++] = data[pixel + 2]; file[offset++] = data[pixel + 1]; file[offset++] = data[pixel]; } offset += rowSize - width * 3; }
  return new Blob([file], { type: "image/bmp" });
}
function tgaFromCanvas(source: HTMLCanvasElement) {
  const { data, width, height } = pixelsFromCanvas(source); const file = new Uint8Array(18 + width * height * 4); file[2] = 2; file[12] = width & 255; file[13] = width >> 8; file[14] = height & 255; file[15] = height >> 8; file[16] = 32; file[17] = 0x28;
  for (let index = 0, offset = 18; index < data.length; index += 4) { file[offset++] = data[index + 2]; file[offset++] = data[index + 1]; file[offset++] = data[index]; file[offset++] = data[index + 3]; }
  return new Blob([file], { type: "image/x-tga" });
}
async function icoFromCanvas(source: HTMLCanvasElement, cursor = false) {
  const png = new Uint8Array(await (await blobFromCanvas(source, "image/png")).arrayBuffer()); const file = new Uint8Array(22 + png.length); const view = new DataView(file.buffer); view.setUint16(2, cursor ? 2 : 1, true); view.setUint16(4, 1, true); file[6] = source.width >= 256 ? 0 : source.width; file[7] = source.height >= 256 ? 0 : source.height;
  if (cursor) { view.setUint16(10, 0, true); view.setUint16(12, 0, true); } else { view.setUint16(10, 1, true); view.setUint16(12, 32, true); } view.setUint32(14, png.length, true); view.setUint32(18, 22, true); file.set(png, 22);
  return new Blob([file], { type: "image/x-icon" });
}
async function tiffFromCanvas(source: HTMLCanvasElement) { const UTIF = await import("utif"); const { data, width, height } = pixelsFromCanvas(source); return new Blob([UTIF.encodeImage(new Uint8Array(data), width, height)], { type: "image/tiff" }); }
async function gifFromCanvas(source: HTMLCanvasElement) {
  const { GIFEncoder, applyPalette, quantize } = await import("gifenc"); const { data, width, height } = pixelsFromCanvas(source); const palette = quantize(data, 256, { format: "rgba4444", oneBitAlpha: true }); const index = applyPalette(data, palette, "rgba4444"); const gif = GIFEncoder(); gif.writeFrame(index, width, height, { palette, repeat: -1, transparent: true }); gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}
async function encodeCanvasOutput(source: HTMLCanvasElement, output: OutputFormat, target: (typeof outputFormats)[number]) {
  if (output === "pdf") return pdfFromCanvas(source); if (output === "psd") return psdFromCanvas(source); if (output === "svg") return svgFromCanvas(source); if (output === "bmp") return bmpFromCanvas(source); if (output === "tga") return tgaFromCanvas(source); if (output === "tiff") return await tiffFromCanvas(source); if (output === "ico") return icoFromCanvas(source); if (output === "cur") return icoFromCanvas(source, true); if (output === "gif") return gifFromCanvas(source);
  return blobFromCanvas(source, target.mime);
}
async function canvasFromTiff(file: File) {
  const UTIF = await import("utif"); const buffer = await file.arrayBuffer(); const ifds = UTIF.decode(buffer); if (!ifds.length) throw new Error("The TIFF file could not be read.");
  UTIF.decodeImage(buffer, ifds[0]); const rgba = UTIF.toRGBA8(ifds[0]);
  const canvas = document.createElement("canvas"); canvas.width = ifds[0].width; canvas.height = ifds[0].height;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas is unavailable.");
  context.putImageData(new ImageData(new Uint8ClampedArray(rgba), canvas.width, canvas.height), 0, 0); return canvas;
}
async function canvasFromStandardImage(file: File) {
  const image = await imageFromBlob(file); const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas is unavailable."); context.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas;
}

async function convertWithMagick(file: File, output: OutputFormat) {
  const magick = await loadMagick(); const target = formatFor(output);
  const bytes = new Uint8Array(await file.arrayBuffer());
  return magick.ImageMagick.readCollection(bytes, async (frames) => {
    return Promise.all(frames.map((image) => image.write(magick.MagickFormat[target.magick], (data) => new Blob([data], { type: target.mime }))));
  });
}

export async function convertImage(file: File, output: OutputFormat, onPhase?: (phase: ProcessingPhase) => void): Promise<Blob[]> {
  const extension = extensionOf(file.name); const target = formatFor(output);
  if (!supportedInputExtensions.has(extension)) throw new Error("This file extension is not on the supported format list.");
  if (extension === "heic" || extension === "heif") {
    onPhase?.("decoding"); const { default: heic2any } = await import("heic2any"); const result = await heic2any({ blob: file, toType: target.mime as "image/jpeg", quality: .92 });
    return [Array.isArray(result) ? result[0] : result];
  }
  if (browserReadyExtensions.has(extension) && nativeCanvasOutputs.has(output)) {
    onPhase?.("decoding"); const canvas = extension === "tif" || extension === "tiff" ? await canvasFromTiff(file) : await canvasFromStandardImage(file);
    onPhase?.("converting"); return [await encodeCanvasOutput(canvas, output, target)];
  }
  onPhase?.("loading-engine");
  try { onPhase?.("decoding"); const results = await convertWithMagick(file, output); onPhase?.("converting"); return results; }
  catch (error) { throw new Error(`The local WASM decoder could not complete this ${extension.toUpperCase()} conversion. ${error instanceof Error ? error.message : ""}`.trim()); }
}

export function downloadBlob(blob: Blob, fileName: string) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url); }

export type ExifOutputFormat = "jpg" | "png" | "webp";

/**
 * Re-renders supported pixel data to a new browser-created file. The canvas
 * encoder does not copy source EXIF blocks into the resulting image.
 */
export async function removeExifFromImage(file: File, output: ExifOutputFormat, quality = .92) {
  const extension = extensionOf(file.name);
  if (!["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"].includes(extension)) throw new Error("Choose a JPG, PNG, WebP, AVIF or HEIC image for this local metadata-cleaning tool.");
  let source: Blob = file;
  if (extension === "heic" || extension === "heif") {
    const { default: heic2any } = await import("heic2any");
    const decoded = await heic2any({ blob: file, toType: "image/jpeg", quality });
    source = Array.isArray(decoded) ? decoded[0] : decoded;
  }
  const image = await imageFromBlob(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas is unavailable in this browser.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const type = output === "png" ? "image/png" : output === "webp" ? "image/webp" : "image/jpeg";
  return blobFromCanvas(canvas, type, quality);
}
