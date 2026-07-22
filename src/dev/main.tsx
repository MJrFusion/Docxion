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
    display.textContent = `${current} / ${total}`;
  }
}

// Zoom
document.getElementById('zoom-in')?.addEventListener('click', async () => {
  if (!viewer) return;
  await viewer.zoomIn();
  updateZoomDisplay();
});

document.getElementById('zoom-out')?.addEventListener('click', async () => {
  if (!viewer) return;
  await viewer.zoomOut();
  updateZoomDisplay();
});

document.getElementById('zoom-fit')?.addEventListener('click', async () => {
  if (!viewer) return;
  await viewer.fitToWidth();
  updateZoomDisplay();
});

// Navigation – 1‑based
document.getElementById('prev-page')?.addEventListener('click', async () => {
  if (!viewer) return;
  const current = viewer.getCurrentPage();
  await viewer.goToPage(Math.max(1, current - 1));
  updatePageDisplay();
});

document.getElementById('next-page')?.addEventListener('click', async () => {
  if (!viewer) return;
  const current = viewer.getCurrentPage();
  const total = viewer.getTotalPages();
  await viewer.goToPage(Math.min(total, current + 1));
  updatePageDisplay();
});

// Search
document.getElementById('search-btn')?.addEventListener('click', async () => {
  if (!viewer) return;
  const input = document.getElementById('search-input') as HTMLInputElement;
  const query = input.value.trim();
  if (!query) return;
  const results = await viewer.search(query);
  console.log('Search results:', results);
  if (results.length > 0) {
    await viewer.goToNextMatch();
  }
});

document.getElementById('search-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('search-btn')?.click();
});

// Next/Prev search buttons (dynamically added)
const nextSearchBtn = document.getElementById('next-search');
const prevSearchBtn = document.getElementById('prev-search');
if (nextSearchBtn) {
  nextSearchBtn.addEventListener('click', async () => {
    if (!viewer) return;
    await viewer.goToNextMatch();
  });
}
if (prevSearchBtn) {
  prevSearchBtn.addEventListener('click', async () => {
    if (!viewer) return;
    await viewer.goToPreviousMatch();
  });
}

// Highlight using actual selection
document.getElementById('add-highlight')?.addEventListener('click', async () => {
  if (!viewer) return;

  const selectedText = viewer.getSelectedText();
  if (!selectedText) {
    console.log('No text selected');
    alert('Please select some text first.');
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    console.log('No selection range');
    return;
  }

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const adjustedRect = {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    right: rect.right - containerRect.left,
    bottom: rect.bottom - containerRect.top,
  };

  // Ensure positive dimensions
  if (adjustedRect.left < 0) adjustedRect.left = 0;
  if (adjustedRect.top < 0) adjustedRect.top = 0;
  if (adjustedRect.right < adjustedRect.left) {
    [adjustedRect.left, adjustedRect.right] = [adjustedRect.right, adjustedRect.left];
  }
  if (adjustedRect.bottom < adjustedRect.top) {
    [adjustedRect.top, adjustedRect.bottom] = [adjustedRect.bottom, adjustedRect.top];
  }

  const page = viewer.getCurrentPage();
  const color = 0xFFFFFF00;

  try {
    const highlight = await viewer.addHighlight(page, adjustedRect, color);
    console.log('Highlight added:', highlight);
    viewer.clearSelection();
  } catch (err) {
    console.error('Failed to add highlight:', err);
  }
});

// Theme
document.getElementById('toggle-theme')?.addEventListener('click', () => {
  if (!viewer) return;
  const current = viewer.getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  viewer.setTheme(next);
  const label = document.getElementById('theme-label');
  if (label) {
    label.textContent = `Theme: ${next}`;
  }
});

// Print
document.getElementById('print-btn')?.addEventListener('click', () => {
  viewer?.print();
});

// Keyboard shortcuts
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
  if (e.key === 'F3') {
    e.preventDefault();
    if (e.shiftKey) {
      document.getElementById('prev-search')?.click();
    } else {
      document.getElementById('next-search')?.click();
    }
  }
});

// Expose viewer for debugging
(window as any).__viewer = viewer;
console.log('Dev controls ready. Load a file.');