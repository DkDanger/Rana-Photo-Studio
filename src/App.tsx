import { useMemo, useRef, useState } from 'react';
import { Camera, FileImage, Languages, Minus, Plus, Printer, RotateCw, Trash2, Upload, Download, ShieldCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { removeBackground } from '@bg0/browser';
import type { Language, PhotoItem, PrintSettings } from './types';
import { DEFAULT_PRINT_SETTINGS } from './types';
import { getText } from './i18n';
import { buildPrintCanvas, calculateLayout } from './utils/layout';
import { createId, renderPhoto } from './utils/photoUtils';

const backgrounds = [
  { name: 'White', value: '#ffffff' }, { name: 'Light blue', value: '#dceeff' },
  { name: 'Sky blue', value: '#87ceeb' }, { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' }, { name: 'Green', value: '#16a34a' },
  { name: 'Light grey', value: '#e5e7eb' }, { name: 'Yellow', value: '#fde047' },
  { name: 'Black', value: '#111827' },
];

const newPhoto = (file: File, source: string): PhotoItem => ({
  id: createId(), name: file.name, source, copies: 1, background: '#ffffff',
  rotation: 0, brightness: 100, contrast: 100, saturation: 100, zoom: 1, offsetX: 0, offsetY: 0,
});

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [customColor, setCustomColor] = useState('#ffffff');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const t = (key: Parameters<typeof getText>[1]) => getText(language, key);
  const selected = photos.find(photo => photo.id === selectedId) ?? photos[0] ?? null;
  const cells = useMemo(() => calculateLayout(photos, settings), [photos, settings]);
  const total = photos.reduce((sum, photo) => sum + photo.copies, 0);

  function updateSelected(patch: Partial<PhotoItem>) {
    if (!selected) return;
    setPhotos(items => items.map(photo => photo.id === selected.id ? { ...photo, ...patch } : photo));
  }
  async function addFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    const added = valid.map(file => ({
      file,
      photo: { ...newPhoto(file, URL.createObjectURL(file)), bgStatus: 'processing' as const, bgProgress: 0 },
    }));
    if (!added.length) return;
    setPhotos(items => [...items, ...added.map(item => item.photo)]);
    if (added[0]) setSelectedId(added[0].photo.id);

    // Process sequentially to avoid exhausting memory on phones.
    for (const item of added) {
      try {
        const result = await removeBackground(item.file, {
          quality: 'quality',
          onProgress: ({ progress }) => {
            const value = typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress * 100))) : 0;
            setPhotos(items => items.map(photo => photo.id === item.photo.id ? { ...photo, bgProgress: value } : photo));
          },
        });
        const transparentSource = URL.createObjectURL(result.blob);
        setPhotos(items => items.map(photo => photo.id === item.photo.id
          ? { ...photo, source: transparentSource, bgStatus: 'done', bgProgress: 100 }
          : photo));
        URL.revokeObjectURL(item.photo.source);
      } catch {
        setPhotos(items => items.map(photo => photo.id === item.photo.id
          ? { ...photo, bgStatus: 'failed' }
          : photo));
      }
    }
  }
  function removePhoto(id: string) {
    setPhotos(items => {
      const target = items.find(photo => photo.id === id);
      if (target) URL.revokeObjectURL(target.source);
      const next = items.filter(photo => photo.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }
  function applyBackgroundToAll(color: string) {
    setPhotos(items => items.map(photo => ({ ...photo, background: color })));
  }
  async function exportPdf() {
    if (!photos.length) return;
    setBusy(true);
    try {
      const canvas = await buildPrintCanvas(photos, settings);
      const pdf = new jsPDF({ orientation: settings.orientation, unit: 'mm', format: 'a4', compress: true });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, settings.orientation === 'portrait' ? 210 : 297, settings.orientation === 'portrait' ? 297 : 210, undefined, 'FAST');
      pdf.save('Rana-Photo-Studio-A4.pdf');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'PDF export failed');
    } finally { setBusy(false); }
  }
  async function printSheet() {
    if (!photos.length) return;
    setBusy(true);
    try {
      const canvas = await buildPrintCanvas(photos, settings);
      const data = canvas.toDataURL('image/jpeg', 0.96);
      const win = window.open('', '_blank');
      if (!win) { alert('Please allow pop-ups to print.'); return; }
      win.document.write(`<!doctype html><html><head><title>Rana Photo Studio Print</title><style>@page{size:A4 ${settings.orientation};margin:0}html,body{margin:0;padding:0;width:100%;height:100%}img{display:block;width:100%;height:100%;object-fit:fill}</style></head><body><img src="${data}"></body></html>`);
      win.document.close();
      win.onload = () => { win.focus(); win.print(); };
    } catch (error) { alert(error instanceof Error ? error.message : 'Print failed'); }
    finally { setBusy(false); }
  }
  async function downloadPhoto() {
    if (!selected) return;
    const canvas = await renderPhoto(selected);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.download = 'passport-photo-35x45mm.jpg';
    link.click();
  }
  function resetSelected() {
    updateSelected({ rotation: 0, brightness: 100, contrast: 100, saturation: 100, zoom: 1, offsetX: 0, offsetY: 0, background: '#ffffff' });
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top"><span className="brand-icon">R</span><span><strong>Rana Photo Studio</strong><small>{t('tagline')}</small></span></a>
      <div className="top-actions">
        <span className="privacy-pill"><ShieldCheck size={15} /> Local processing</span>
        <button className="button button-quiet" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}><Languages size={17} />{t('language')}</button>
      </div>
    </header>

    <main id="top" className="workspace">
      <section className="welcome-row">
        <div><p className="eyebrow">35 × 45 MM · 300 DPI</p><h1>{t('appName')}</h1><p className="muted">{t('tagline')}</p></div>
        <button className="button button-primary" onClick={() => fileInput.current?.click()}><Upload size={18} />{t('upload')}</button>
        <input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => event.target.files && addFiles(event.target.files)} />
      </section>

      <section className="upload-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
        <FileImage size={25} /><strong>{t('uploadHint')}</strong><span>JPG · JPEG · PNG · WEBP</span>
        <button className="button button-outline" onClick={() => fileInput.current?.click()}><Camera size={17} /> {t('addMore')}</button>
      </section>

      <div className="editor-grid">
        <section className="panel editor-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('editor')}</p><h2>{selected?.name ?? t('noPhoto')}</h2></div>{selected && <button className="icon-button danger" title={t('remove')} onClick={() => removePhoto(selected.id)}><Trash2 size={17}/></button>}</div>
          {selected ? <>
            <div className="photo-stage"><div className="photo-preview" style={{ backgroundColor: selected.background }}><img src={selected.source} alt="Selected passport portrait" style={{ transform: `rotate(${selected.rotation}deg) scale(${selected.zoom})`, filter: `brightness(${selected.brightness}%) contrast(${selected.contrast}%) saturate(${selected.saturation}%)` }} /></div></div>
            {selected.bgStatus === 'processing' && <p className="help-note">{t('bgRemoving')} {selected.bgProgress ?? 0}%</p>}
            {selected.bgStatus === 'done' && <p className="help-note">{t('bgRemoved')}</p>}
            {selected.bgStatus === 'failed' && <p className="help-note">{t('bgFailed')}</p>}
            <div className="size-line"><span>{t('size')}</span><span>{t('dpi')}</span></div>
            <div className="control-block"><label>{t('background')}</label><div className="swatches">{backgrounds.map(color => <button key={color.value} title={color.name} className={selected.background === color.value ? 'swatch active' : 'swatch'} style={{ background: color.value }} onClick={() => updateSelected({ background: color.value })}/>)}
              <label className="custom-color">{t('custom')}<input type="color" value={customColor} onChange={event => {setCustomColor(event.target.value); updateSelected({background:event.target.value});}} /></label></div>
              <button className="text-button" onClick={() => applyBackgroundToAll(selected.background)}>{t('applyAll')}</button><p className="help-note">{t('bgNote')}</p>
            </div>
            {(['brightness','contrast','saturation','zoom'] as const).map(key => <div className="range-control" key={key}><label><span>{t(key)}</span><output>{key === 'zoom' ? selected[key].toFixed(2) + '×' : selected[key] + '%'}</output></label><input type="range" min={key === 'zoom' ? 0.7 : 50} max={key === 'zoom' ? 2 : 150} step={key === 'zoom' ? 0.05 : 1} value={selected[key]} onChange={event => updateSelected({[key]:Number(event.target.value)})}/></div>)}
            <div className="editor-actions"><button className="button button-outline" onClick={() => updateSelected({rotation:(selected.rotation + 90) % 360})}><RotateCw size={16}/>{t('rotate')}</button><button className="button button-outline" onClick={resetSelected}>{t('reset')}</button><button className="button button-primary" onClick={downloadPhoto}><Download size={16}/> JPG</button></div>
          </> : <div className="empty-state"><FileImage size={42}/><p>{t('noPhoto')}</p></div>}
          {photos.length > 0 && <div className="thumbnail-list">{photos.map(photo => <button key={photo.id} className={photo.id === selected?.id ? 'thumbnail selected' : 'thumbnail'} onClick={() => setSelectedId(photo.id)}><img src={photo.source} alt={photo.name}/><span>{photo.name}</span></button>)}</div>}
        </section>

        <section className="panel layout-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('layout')}</p><h2>{t('printReady')}</h2></div><span className="count-pill">{t('total')}: {total}</span></div>
          <div className="layout-settings">
            <label>{t('portrait')} / {t('landscape')}<select value={settings.orientation} onChange={event => setSettings(s => ({...s,orientation:event.target.value as PrintSettings['orientation']}))}><option value="portrait">{t('portrait')}</option><option value="landscape">{t('landscape')}</option></select></label>
            <label>{t('margin')}<input type="number" min="0" max="30" value={settings.marginMm} onChange={event => setSettings(s => ({...s,marginMm:Math.max(0,Number(event.target.value))}))}/></label>
            <label>{t('spacing')}<input type="number" min="0" max="15" value={settings.spacingMm} onChange={event => setSettings(s => ({...s,spacingMm:Math.max(0,Number(event.target.value))}))}/></label>
            <label>{t('columns')}<select value={settings.columns} onChange={event => setSettings(s => ({...s,columns:Number(event.target.value)}))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
          </div>
          <div className="paper-wrap"><div className={settings.orientation === 'portrait' ? 'paper' : 'paper landscape'}>{cells.map((cell,index)=><div key={cell.photo.id + '-' + index} className="paper-photo" style={{left:`${cell.x/(settings.orientation === 'portrait'?210:297)*100}%`,top:`${cell.y/(settings.orientation === 'portrait'?297:210)*100}%`,width:`${35/(settings.orientation === 'portrait'?210:297)*100}%`,height:`${45/(settings.orientation === 'portrait'?297:210)*100}%`,background:cell.photo.background}}><img src={cell.photo.source} alt="" style={{filter:`brightness(${cell.photo.brightness}%) contrast(${cell.photo.contrast}%) saturate(${cell.photo.saturation}%)`,transform:`rotate(${cell.photo.rotation}deg) scale(${cell.photo.zoom})`}}/></div>)}</div></div>
          <p className="muted small">{t('fitWarning')}</p>
          {cells.length < total && <p className="capacity-warning">{t('capacityWarning')}</p>}
          <div className="print-actions"><button className="button button-outline" disabled={!photos.length || busy} onClick={printSheet}><Printer size={17}/>{t('print')}</button><button className="button button-primary" disabled={!photos.length || busy} onClick={exportPdf}><Download size={17}/>{busy ? '…' : t('pdf')}</button></div>
        </section>
      </div>

      <section className="photo-list-panel panel"><div className="panel-heading"><div><p className="eyebrow">PHOTO QUEUE</p><h2>{photos.length} {language === 'hi' ? 'फोटो' : 'photos'}</h2></div></div>
        {photos.length ? photos.map(photo => <div className="queue-row" key={photo.id}><img src={photo.source} alt=""/><span>{photo.name}</span><label>{t('copies')}<div className="stepper"><button onClick={() => setPhotos(items=>items.map(p=>p.id===photo.id?{...p,copies:Math.max(1,p.copies-1)}:p))}><Minus size={14}/></button><b>{photo.copies}</b><button onClick={() => setPhotos(items=>items.map(p=>p.id===photo.id?{...p,copies:Math.min(100,p.copies+1)}:p))}><Plus size={14}/></button></div></label><button className="icon-button danger" onClick={()=>removePhoto(photo.id)}><Trash2 size={16}/></button></div>) : <p className="muted">{t('emptyLayout')}</p>}
      </section>
      <footer className="app-footer"><ShieldCheck size={16}/>{t('privacy')}<span>© Rana Typing · Rana Photo Studio</span></footer>
    </main>
  </div>;
}