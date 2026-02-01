import type { FormatterState } from './model';
import { toggleNodeExpansion } from './events';
import { getPreContentAndRemove, isJsonPage } from './page';
import { parseToNodes } from './parser';
import { renderTree } from './render';
import { loadCSS } from './theme';
import { createUI } from './ui';

let state: FormatterState | null = null;

function rerender(): void {
  if (!state) {
    return;
  }

  const container = document.getElementById('jsonFormatterParsed');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  const newDom = renderTree(state.rootNode, { showLineNumbers: true });
  container.appendChild(newDom);
}

function handleExpanderClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  if (!target.classList.contains('json-expander')) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const nodeElement = target.closest('[data-path]') as HTMLElement;
  if (!nodeElement) {
    return;
  }

  const { path } = nodeElement.dataset;
  if (path === undefined || !state) {
    return;
  }

  toggleNodeExpansion(state.rootNode, path);
  rerender();
}

function switchToFormatted(): void {
  if (!state) {
    return;
  }

  state.viewMode = 'formatted';

  const formattedContainer = document.getElementById('jsonFormatterParsed');
  const rawContainer = document.getElementById('jsonFormatterRaw');
  const formattedBtn = document.getElementById('btnFormatted');
  const rawBtn = document.getElementById('btnRaw');

  if (formattedContainer) {
    formattedContainer.style.display = 'block';
  }
  if (rawContainer) {
    rawContainer.style.display = 'none';
  }
  if (formattedBtn) {
    formattedBtn.classList.add('selected');
  }
  if (rawBtn) {
    rawBtn.classList.remove('selected');
  }
}

function switchToRaw(): void {
  if (!state) {
    return;
  }

  state.viewMode = 'raw';

  const formattedContainer = document.getElementById('jsonFormatterParsed');
  const rawContainer = document.getElementById('jsonFormatterRaw');
  const formattedBtn = document.getElementById('btnFormatted');
  const rawBtn = document.getElementById('btnRaw');

  if (formattedContainer) {
    formattedContainer.style.display = 'none';
  }
  if (rawContainer) {
    rawContainer.style.display = 'block';
  }
  if (formattedBtn) {
    formattedBtn.classList.remove('selected');
  }
  if (rawBtn) {
    rawBtn.classList.add('selected');
  }
}

async function initJsonFormatter(): Promise<void> {
  if (!isJsonPage()) {
    console.log('Not a JSON page, skipping formatter');
    return;
  }

  const chromeContainer = document.querySelector('.json-formatter-container');
  if (chromeContainer) {
    chromeContainer.remove();
  }

  const rawContent = getPreContentAndRemove();
  if (!rawContent) {
    console.log('No content found');
    return;
  }

  if (rawContent.length > 3000000) {
    console.log('JSON too large to format');
    return;
  }

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch (e) {
    console.log('Invalid JSON:', e);
    return;
  }

  const rootNode = parseToNodes(parsedJson);

  state = {
    rootNode,
    viewMode: 'formatted',
    rawContent,
  };

  await loadCSS();
  createUI(rawContent, { onFormatted: switchToFormatted, onRaw: switchToRaw });
  rerender();
  document.addEventListener('click', handleExpanderClick);
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }
    if (changes.themeMode || changes.themeStyle) {
      loadCSS().catch((error) => {
        console.error('Failed to reload theme:', error);
      });
    }
  });

  console.log('JSON Formatter initialized successfully!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJsonFormatter);
} else {
  initJsonFormatter();
}
