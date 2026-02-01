// options.ts - 简化版本
type ThemeMode = 'auto' | 'light' | 'dark';
type ThemeStyle = 'classic' | 'github' | 'claude' | 'google';

interface ThemeSettings {
  themeMode?: ThemeMode;
  themeStyle?: ThemeStyle;
}

const radioButtons = [...document.querySelectorAll('input[name="theme"]')] as HTMLInputElement[];
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const statusElement = document.getElementById('status') as HTMLElement;

const getRadioButton = (value: ThemeMode): HTMLInputElement => {
  const el = radioButtons.find((input) => input.value === value);
  if (!el) {
    throw new Error(`Could not find radio button with value "${value}".`);
  }
  return el;
};

const isValidThemeMode = (value: any): value is ThemeMode => {
  return ['auto', 'light', 'dark'].includes(value);
};

const isValidThemeStyle = (value: any): value is ThemeStyle => {
  return ['classic', 'github', 'claude', 'google'].includes(value);
};

const updateUI = (settings: ThemeSettings): void => {
  // 更新主题模式单选按钮
  if (settings.themeMode && isValidThemeMode(settings.themeMode)) {
    getRadioButton(settings.themeMode).checked = true;
  }

  // 更新主题样式下拉选择
  if (settings.themeStyle && isValidThemeStyle(settings.themeStyle)) {
    themeSelect.value = settings.themeStyle;
  }
};

const showStatus = (message: string): void => {
  statusElement.textContent = message;
  statusElement.classList.add('show');

  setTimeout(() => {
    statusElement.classList.remove('show');
  }, 2000);
};

const saveSettings = (newSettings: Partial<ThemeSettings>): void => {
  chrome.storage.local.set(newSettings, () => {
    showStatus('Settings saved');
  });
};

// 页面加载时读取保存的设置
chrome.storage.local.get(['themeMode', 'themeStyle'], (result: ThemeSettings) => {
  const settings = {
    themeMode: result.themeMode || 'auto',
    themeStyle: result.themeStyle || 'classic',
  };
  updateUI(settings);
});

// 监听主题模式变化
radioButtons.forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked && isValidThemeMode(input.value)) {
      saveSettings({ themeMode: input.value as ThemeMode });
    }
  });
});

// 监听主题样式变化
themeSelect.addEventListener('change', () => {
  if (isValidThemeStyle(themeSelect.value)) {
    saveSettings({ themeStyle: themeSelect.value as ThemeStyle });
  }
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
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
  }
});

export type { ThemeMode, ThemeStyle, ThemeSettings };
