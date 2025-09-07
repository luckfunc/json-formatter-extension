// options.ts
type ThemeMode = 'system' | 'force_light' | 'force_dark';
type ThemeStyle = 'default' | 'github' | 'claude' | 'google';

interface ThemeSettings {
  themeOverride?: ThemeMode;
  themeStyle?: ThemeStyle;
}

const radioButtons = [...document.querySelectorAll('input[name="theme"]')] as HTMLInputElement[];
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const statusElement = document.getElementById('status') as HTMLElement;

const getRadioButton = (value: ThemeMode): HTMLInputElement => {
  const el = radioButtons.find((input) => input.value === value);
  if (!el) throw new Error(`Could not find radio button with value "${value}".`);
  return el;
};

const isValidThemeMode = (value: any): value is ThemeMode => {
  return ['system', 'force_light', 'force_dark'].includes(value);
};

const isValidThemeStyle = (value: any): value is ThemeStyle => {
  return ['default', 'github', 'claude', 'google'].includes(value);
};

const updateUI = (settings: ThemeSettings): void => {
  // 更新主题模式单选按钮
  if (settings.themeOverride && isValidThemeMode(settings.themeOverride)) {
    getRadioButton(settings.themeOverride).checked = true;
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
chrome.storage.local.get(['themeOverride', 'themeStyle'], (result: ThemeSettings) => {
  const settings = {
    themeOverride: result.themeOverride || 'system',
    themeStyle: result.themeStyle || 'default',
  };
  updateUI(settings);
});

// 监听主题模式变化
radioButtons.forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked && isValidThemeMode(input.value)) {
      saveSettings({ themeOverride: input.value as ThemeMode });
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

    if (changes.themeOverride && isValidThemeMode(changes.themeOverride.newValue)) {
      updates.themeOverride = changes.themeOverride.newValue;
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
