/**
 * Signal Utility design reminder: precise, private, client-side processing with explicit states.
 */
export const coreOutputFormats = [
  { value: "image/webp", label: "WEBP", ext: "webp", note: "Web moderne" },
  { value: "image/jpeg", label: "JPG", ext: "jpg", note: "Universel" },
  { value: "image/png", label: "PNG", ext: "png", note: "Sans perte" },
  { value: "image/avif", label: "AVIF", ext: "avif", note: "Très compact" },
] as const;

export type CoreOutputMime = (typeof coreOutputFormats)[number]["value"];

export const supportedInputExtensions = new Set([
  "jpg", "jpeg", "png", "webp", "avif", "gif", "bmp", "tif", "tiff", "ico", "cur",
  "heic", "heif", "jxl", "svg", "cr2", "cr3", "nef", "arw", "dng", "raf", "rw2",
  "psd", "tga", "exr", "hdr", "eps", "pdf",
]);

export const readyExtensions = new Set([
  "jpg", "jpeg", "png", "webp", "avif", "gif", "bmp", "tif", "tiff", "ico", "cur", "heic", "heif", "svg",
]);

export const formatGroups = [
  { title: "POPULAIRES", formats: ["WEBP", "JPG", "PNG", "AVIF"] },
  { title: "ENTRÉE AVANCÉE", formats: ["HEIC", "HEIF", "TIFF", "SVG", "GIF"] },
  { title: "DÉTECTÉ & PRÉPARÉ", formats: ["RAW", "PSD", "PDF", "EPS", "JXL"] },
];

export function extensionOf(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function prettySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function imageFromBlob(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Le navigateur ne peut pas décoder cette image."));
    };
    image.src = url;
  });
}

async function canvasFromTiff(file: File) {
  const UTIF = await import("utif");
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  if (!ifds.length) throw new Error("TIFF illisible.");
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  const canvas = document.createElement("canvas");
  canvas.width = ifds[0].width;
  canvas.height = ifds[0].height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible.");
  context.putImageData(new ImageData(new Uint8ClampedArray(rgba), canvas.width, canvas.height), 0, 0);
  return canvas;
}

async function canvasFromStandardImage(file: File) {
  const image = await imageFromBlob(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function blobFromCanvas(canvas: HTMLCanvasElement, type: CoreOutputMime, quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Ce format de sortie n’est pas disponible dans ce navigateur."));
    }, type, quality);
  });
}

export async function convertImage(
  file: File,
  output: CoreOutputMime,
  onPhase?: (phase: "decoding" | "converting") => void,
) {
  const ext = extensionOf(file.name);
  if (!readyExtensions.has(ext)) {
    throw new Error("Le décodeur local de ce format spécialisé arrive prochainement. Aucun fichier n’a été transféré.");
  }

  onPhase?.("decoding");
  if (ext === "heic" || ext === "heif") {
    const { default: heic2any } = await import("heic2any");
    const result = await heic2any({ blob: file, toType: output, quality: 0.92 });
    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob) throw new Error("Échec du décodage HEIC/HEIF.");
    return blob;
  }

  const canvas = ext === "tif" || ext === "tiff" ? await canvasFromTiff(file) : await canvasFromStandardImage(file);
  onPhase?.("converting");
  return blobFromCanvas(canvas, output);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
