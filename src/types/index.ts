export type Language = 'en' | 'hi';
export type BackgroundPreset = 'white' | 'lightBlue' | 'skyBlue' | 'blue' | 'red' | 'green' | 'lightGrey' | 'yellow' | 'black' | 'custom';

export interface PhotoItem {
  id: string;
  name: string;
  source: string;
  copies: number;
  saved?: boolean;
  background: string;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  bgStatus?: 'processing' | 'done' | 'failed';
  bgProgress?: number;
  bgError?: string;
}

export interface PrintSettings {
  paper: 'a4';
  orientation: 'portrait' | 'landscape';
  marginMm: number;
  spacingMm: number;
  columns: number;
  dpi: number;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paper: 'a4',
  orientation: 'portrait',
  marginMm: 10,
  spacingMm: 2,
  columns: 5,
  dpi: 300,
};