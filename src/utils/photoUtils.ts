import type { PhotoItem } from '../types';

export const PHOTO_WIDTH_MM = 35;
export const PHOTO_HEIGHT_MM = 45;
export const DPI = 300;
export const PHOTO_WIDTH_PX = Math.round(PHOTO_WIDTH_MM / 25.4 * DPI);
export const PHOTO_HEIGHT_PX = Math.round(PHOTO_HEIGHT_MM / 25.4 * DPI);
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to decode image'));
    image.src = source;
  });
}

export async function renderPhoto(photo: PhotoItem, width = PHOTO_WIDTH_PX, height = PHOTO_HEIGHT_PX): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported by this browser');
  ctx.fillStyle = photo.background;
  ctx.fillRect(0, 0, width, height);
  const image = await loadImage(photo.source);
  const scale = Math.max(width / image.width, height / image.height) * photo.zoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.save();
  ctx.translate(width / 2 + photo.offsetX * width / 100, height / 2 + photo.offsetY * height / 100);
  ctx.rotate(photo.rotation * Math.PI / 180);
  ctx.filter = `brightness(${photo.brightness}%) contrast(${photo.contrast}%) saturate(${photo.saturation}%)`;
  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image export failed')), type, quality));
}

export function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}