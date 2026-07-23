import { mountViewer } from '../index.tsx';
import type { ViewerAPI, ViewerOptions } from '../types/core';

// DOM elements
const picker = document.getElementById('file-picker') as HTMLInputElement;
const container = document.getElementById('viewer') as HTMLElement;
const fileNameDisplay = document.getElementById('file-name') as HTMLElement;
const controls = document.getElementById('controls') as HTMLElement;

let viewer: ViewerAPI | null = null;

// File picker
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
    search: {
      maxMatches: 1000,
      caseSensitive: false,
    },
    onEvent: (event) => {
      console.log('Viewer event:', event.type, event.detail);
    },
  };

  viewer = mountViewer(container, options);
  controls.style.display = 'flex';

  console.log('Viewer mounted. API available:', viewer);
});

// Zoom controls
document.getElementById('zoom-in')?.addEventListener('click', async () => {
  await viewer?.zoomIn();
  updateZoomDisplay();
});

document.getElementById('zoom-out')?.addEventListener('click', async () => {
  await viewer?.zoomOut();
  updateZoomDisplay();
});

document.getElementById('zoom-fit')?.addEventListener('click', async () => {
  await viewer?.fitToWidth();
  updateZoomDisplay();
});

function updateZoomDisplay() {
  const zoom = viewer?.getZoom() || 1;
  document.getElementById('zoom-level')!.textContent = `${Math.round(zoom * 100)}%`;
}

// Navigation controls
document.getElementById('prev-page')?.addEventListener('click', async () => {
  const current = viewer?.getCurrentPage() || 0;
  await viewer?.goToPage(Math.max(0, current - 1));
});

document.getElementById('next-page')?.addEventListener('click', async () => {
  const current = viewer?.getCurrentPage() || 0;
  const total = viewer?.getTotalPages() || 0;
  await viewer?.goToPage(Math.min(total - 1, current + 1));
});

// Search controls
document.getElementById('search-btn')?.addEventListener('click', async () => {
  const input = document.getElementById('search-input') as HTMLInputElement;
  const query = input.value.trim();
  if (query && viewer) {
    const results = await viewer.search(query);
    console.log('Search results:', results);
    if (results.length > 0) {
      await viewer.goToNextMatch();
    }
  }
});

// Highlight controls
document.getElementById('add-highlight')?.addEventListener('click', async () => {
  if (viewer) {
    const page = viewer.getCurrentPage();
    const rect = { left: 0, top: 0, right: 100, bottom: 20 };
    await viewer.addHighlight(page, rect, 0xFFFFFF00);
  }
});

// Theme toggle
document.getElementById('toggle-theme')?.addEventListener('click', () => {
  if (viewer) {
    const current = viewer.getTheme();
    const next = current === 'light' ? 'dark' : 'light';
    viewer.setTheme(next);
    document.getElementById('theme-label')!.textContent = `Theme: ${next}`;
  }
});

// Print
document.getElementById('print-btn')?.addEventListener('click', () => {
  viewer?.print();
});

// Expose for debugging
(window as any).__viewer = viewer;