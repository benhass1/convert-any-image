/**
 * Signal Utility design reminder: disclose exact capabilities and execute every available transformation locally.
 */
import heic2any from "heic2any";
import * as UTIF from "utif";
import { convertWithLocalBackend } from "./heavy-converter-client";

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
  { value: "jxl", label: "JXL", ext: "jxl", mime: "image/jxl", family: "Specialty", magick: "Jxl" },
  { value: "hdr", label: "HDR", ext: "hdr", mime: "image/vnd.radiance", family: "Specialty", magick: "Hdr" },
  { value: "exr", label: "EXR", ext: "exr", mime: "image/x-exr", family: "Specialty", magick: "Exr" },
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
const nativeCanvasOutputs = new Set<OutputFormat>(["jpg", "png", "webp", "avif", "pdf", "psd"]);
const localBackendOutputs = new Set<OutputFormat>(["tiff", "bmp", "gif", "ico", "tga"]);

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
async function canvasFromTiff(file: File) {
  const buffer = await file.arrayBuffer(); const ifds = UTIF.decode(buffer); if (!ifds.length) throw new Error("The TIFF file could not be read.");
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
    onPhase?.("decoding"); const result = await heic2any({ blob: file, toType: target.mime as "image/jpeg", quality: .92 });
    return [Array.isArray(result) ? result[0] : result];
  }
  if (browserReadyExtensions.has(extension) && nativeCanvasOutputs.has(output)) {
    onPhase?.("decoding"); const canvas = extension === "tif" || extension === "tiff" ? await canvasFromTiff(file) : await canvasFromStandardImage(file);
    onPhase?.("converting"); return [output === "pdf" ? await pdfFromCanvas(canvas) : output === "psd" ? await psdFromCanvas(canvas) : await blobFromCanvas(canvas, target.mime)];
  }
  if (localBackendOutputs.has(output)) {
    onPhase?.("loading-engine");
    try { onPhase?.("converting"); return [await convertWithLocalBackend(file, output)]; }
    catch { throw new Error(`${target.label} output requires the optional local Docker converter. Start it on this device, then retry.`); }
  }
  onPhase?.("loading-engine");
  try { onPhase?.("decoding"); const results = await convertWithMagick(file, output); onPhase?.("converting"); return results; }
  catch (error) { throw new Error(`The local WASM decoder could not complete this ${extension.toUpperCase()} conversion. ${error instanceof Error ? error.message : ""}`.trim()); }
}

export function downloadBlob(blob: Blob, fileName: string) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url); }
