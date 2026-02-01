export type ThemeMode = 'auto' | 'light' | 'dark';
export type ThemeStyle = 'classic' | 'vscode' | 'github' | 'claude' | 'google';

export interface ThemeSettings {
  themeMode?: ThemeMode;
  themeStyle?: ThemeStyle;
}

interface ThemeControls {
  radioButtons: HTMLInputElement[];
  themeSelect: HTMLSelectElement;
  statusElement?: HTMLElement | null;
  defaultThemeMode?: ThemeMode;
  defaultThemeStyle?: ThemeStyle;
  statusMessage?: string;
}

const isValidThemeMode = (value: any): value is ThemeMode => {
  return ['auto', 'light', 'dark'].includes(value);
};

const isValidThemeStyle = (value: any): value is ThemeStyle => {
  return ['classic', 'vscode', 'github', 'claude', 'google'].includes(value);
};

export function initThemeSettings(controls: ThemeControls): void {
  const {
    radioButtons,
    themeSelect,
    statusElement,
    defaultThemeMode = 'auto',
    defaultThemeStyle = 'classic',
    statusMessage = 'Settings saved',
  } = controls;

  const getRadioButton = (value: ThemeMode): HTMLInputElement => {
    const el = radioButtons.find((input) => input.value === value);
    if (!el) {
      throw new Error(`Could not find radio button with value "${value}".`);
    }
    return el;
  };

  const updateUI = (settings: ThemeSettings): void => {
    if (settings.themeMode && isValidThemeMode(settings.themeMode)) {
      getRadioButton(settings.themeMode).checked = true;
    }

    if (settings.themeStyle && isValidThemeStyle(settings.themeStyle)) {
      themeSelect.value = settings.themeStyle;
    }
  };

  const showStatus = (message: string): void => {
    if (!statusElement) {
      return;
    }
    statusElement.textContent = message;
    statusElement.classList.add('show');

    setTimeout(() => {
      statusElement.classList.remove('show');
    }, 1500);
  };

  const saveSettings = (newSettings: Partial<ThemeSettings>): void => {
    chrome.storage.local.set(newSettings, () => {
      showStatus(statusMessage);
    });
  };

  chrome.storage.local.get(['themeMode', 'themeStyle'], (result: ThemeSettings) => {
    const settings = {
      themeMode: result.themeMode || defaultThemeMode,
      themeStyle: result.themeStyle || defaultThemeStyle,
    };
    updateUI(settings);
  });

  radioButtons.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked && isValidThemeMode(input.value)) {
        saveSettings({ themeMode: input.value as ThemeMode });
      }
    });
  });

  themeSelect.addEventListener('change', () => {
    if (isValidThemeStyle(themeSelect.value)) {
      saveSettings({ themeStyle: themeSelect.value as ThemeStyle });
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    const updates: ThemeSettings = {};

    if (changes.themeMode && isValidThemeMode(changes.themeMode.newValue)) {
      updates.themeMode = changes.themeMode.newValue;
    }

    if (changes.themeStyle && isValidThemeStyle(changes.themeStyle.newValue)) {
      updates.themeStyle = changes.themeStyle.newValue;
    }

    if (Object.keys(updates).length > 0) {
      updateUI(updates);
    }
  });
}
