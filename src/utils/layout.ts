import type { PhotoItem, PrintSettings } from '../types';
import { A4_HEIGHT_MM, A4_WIDTH_MM, PHOTO_HEIGHT_MM, PHOTO_WIDTH_MM, renderPhoto } from './photoUtils';

export interface LayoutCell { photo: PhotoItem; x: number; y: number; width: number; height: number; }

export function calculateLayout(photos: PhotoItem[], settings: PrintSettings): LayoutCell[] {
  const pageWidth = settings.orientation === 'portrait' ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const pageHeight = settings.orientation === 'portrait' ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const usableWidth = pageWidth - settings.marginMm * 2;
  const maxColumns = Math.max(1, Math.floor((usableWidth + settings.spacingMm) / (PHOTO_WIDTH_MM + settings.spacingMm)));
  const columns = Math.max(1, Math.min(settings.columns, maxColumns));
  const cells: LayoutCell[] = [];
  let index = 0;
  for (const photo of photos) {
    for (let copy = 0; copy < Math.max(1, photo.copies); copy += 1) {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = settings.marginMm + col * (PHOTO_WIDTH_MM + settings.spacingMm);
      const y = settings.marginMm + row * (PHOTO_HEIGHT_MM + settings.spacingMm);
      if (y + PHOTO_HEIGHT_MM <= pageHeight - settings.marginMm + 0.001) {
        cells.push({ photo, x, y, width: PHOTO_WIDTH_MM, height: PHOTO_HEIGHT_MM });
      }
      index += 1;
    }
  }
  return cells;
}

export async function buildPrintCanvas(photos: PhotoItem[], settings: PrintSettings): Promise<HTMLCanvasElement> {
  const pageW = settings.orientation === 'portrait' ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const pageH = settings.orientation === 'portrait' ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pageW / 25.4 * settings.dpi);
  canvas.height = Math.round(pageH / 25.4 * settings.dpi);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = settings.dpi / 25.4;
  for (const cell of calculateLayout(photos, settings)) {
    const photoCanvas = await renderPhoto(cell.photo);
    ctx.drawImage(photoCanvas, Math.round(cell.x * scale), Math.round(cell.y * scale), Math.round(cell.width * scale), Math.round(cell.height * scale));
  }
  return canvas;
}