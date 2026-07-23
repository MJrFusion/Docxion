import { mountViewer } from '../index.tsx';
import type { ViewerAPI, ViewerOptions } from '../types/core';

const picker = document.getElementById('file-picker') as HTMLInputElement;
const container = document.getElementById('viewer') as HTMLElement;
const fileNameDisplay = document.getElementById('file-name') as HTMLElement;
const controls = document.getElementById('controls') as HTMLElement;

let viewer: ViewerAPI | null = null;

picker.addEventListener('change', async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  fileNameDisplay.textContent = file.name;
  container.innerHTML = '';

  const options: ViewerOptions = {
    file,
    theme: 'light',
    rendererMode: 'replace',
    search: { maxMatches: 1000, caseSensitive: false },
    onEvent: (event) => {
      console.log('>> onEvent:', event.type, event.detail);
      if (event.type === 'pageChange') {
        updatePageDisplay();
        updateZoomDisplay();
      }
      if (event.type === 'zoom-change') {
        updateZoomDisplay();
      }
    },
  };

  viewer = await mountViewer(container, options);
  controls.style.display = 'flex';
  updateZoomDisplay();
  updatePageDisplay();

  console.log('Viewer API:', viewer);

  setTimeout(() => {
    if (viewer) {
      console.log('Test getCurrentPage:', viewer.getCurrentPage());
      console.log('Test getTotalPages:', viewer.getTotalPages());
      console.log('Test getZoom:', viewer.getZoom());
    }
  }, 2000);
});

function updateZoomDisplay() {
  const zoom = viewer?.getZoom() || 1;
  const display = document.getElementById('zoom-level');
  if (display) {
    display.textContent = `${Math.round(zoom * 100)}%`;
  }
}

function updatePageDisplay() {
  if (!viewer) return;
  const current = viewer.getCurrentPage();
  const total = viewer.getTotalPages();
  const display = document.getElementById('page-display');
  if (display) {
    display.textContent = `${current + 1} / ${total}`;
  }
}

document.getElementById('zoom-in')?.addEventListener('click', async () => {
  console.log('Zoom in clicked');
  if (!viewer) return;
  await viewer.zoomIn();
  updateZoomDisplay();
});

document.getElementById('zoom-out')?.addEventListener('click', async () => {
  console.log('Zoom out clicked');
  if (!viewer) return;
  await viewer.zoomOut();
  updateZoomDisplay();
});

document.getElementById('zoom-fit')?.addEventListener('click', async () => {
  console.log('Fit clicked');
  if (!viewer) return;
  await viewer.fitToWidth();
  updateZoomDisplay();
});

document.getElementById('prev-page')?.addEventListener('click', async () => {
  console.log('Prev page clicked');
  if (!viewer) return;
  const current = viewer.getCurrentPage();
  await viewer.goToPage(Math.max(0, current - 1));
  updatePageDisplay();
});

document.getElementById('next-page')?.addEventListener('click', async () => {
  console.log('Next page clicked');
  if (!viewer) return;
  const current = viewer.getCurrentPage();
  const total = viewer.getTotalPages();
  await viewer.goToPage(Math.min(total - 1, current + 1));
  updatePageDisplay();
});

document.getElementById('search-btn')?.addEventListener('click', async () => {
  console.log('Search clicked');
  if (!viewer) return;
  const input = document.getElementById('search-input') as HTMLInputElement;
  const query = input.value.trim();
  if (!query) return;
  const results = await viewer.search(query);
  console.log('Search results:', results);
  if (results.length > 0) await viewer.goToNextMatch();
});

document.getElementById('search-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('search-btn')?.click();
});

document.getElementById('add-highlight')?.addEventListener('click', async () => {
  console.log('Highlight clicked');
  if (!viewer) return;
  const page = viewer.getCurrentPage();
  const rect = { left: 0, top: 0, right: 100, bottom: 20 };
  const color = 0xFFFF00;
  try {
    const highlight = await viewer.addHighlight(page, rect, color);
    console.log('Highlight added:', highlight);
  } catch (err) {
    console.error('Failed to add highlight:', err);
  }
});

document.getElementById('toggle-theme')?.addEventListener('click', () => {
  console.log('Theme toggle clicked');
  if (!viewer) return;
  const current = viewer.getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  viewer.setTheme(next);
  const label = document.getElementById('theme-label');
  if (label) {
    label.textContent = `Theme: ${next}`;
  }
});

document.getElementById('print-btn')?.addEventListener('click', () => {
  console.log('Print clicked');
  viewer?.print();
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    document.getElementById('zoom-in')?.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault();
    document.getElementById('zoom-out')?.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '0') {
    e.preventDefault();
    document.getElementById('zoom-fit')?.click();
  }
  if (e.key === 'ArrowLeft') document.getElementById('prev-page')?.click();
  if (e.key === 'ArrowRight') document.getElementById('next-page')?.click();
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    document.getElementById('search-input')?.focus();
  }
});

(window as any).__viewer = viewer;
console.log('Dev controls ready. Load a file.');