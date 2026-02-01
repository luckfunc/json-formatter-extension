export async function loadCSS(): Promise<void> {
  const { themeStyle = 'classic' } = await chrome.storage.local.get('themeStyle');
  const { themeMode = 'auto' } = await chrome.storage.local.get('themeMode');

  let mode: 'light' | 'dark';
  if (themeMode === 'auto') {
    mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    mode = themeMode as 'light' | 'dark';
  }

  const templateUrl = chrome.runtime.getURL('themes/template.css');
  const variablesUrl = chrome.runtime.getURL(`themes/${themeStyle}/${mode}-variables.css`);

  try {
    const [templateRes, variablesRes] = await Promise.all([
      fetch(templateUrl),
      fetch(variablesUrl),
    ]);

    const [templateCSS, variablesCSS] = await Promise.all([
      templateRes.text(),
      variablesRes.text(),
    ]);

    const finalCSS = `${variablesCSS}\n\n${templateCSS}`;

    const existingStyle = document.getElementById('jsonFormatterStyle');
    if (existingStyle) {
      existingStyle.remove();
    }

    const styleEl = document.createElement('style');
    styleEl.id = 'jsonFormatterStyle';
    styleEl.textContent = finalCSS;
    document.head.appendChild(styleEl);
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
}
