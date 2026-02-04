import { initThemeSettings } from '../options/theme-settings';

const radioButtons = [...document.querySelectorAll('input[name="theme"]')] as HTMLInputElement[];
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const statusElement = document.getElementById('status') as HTMLElement;

initThemeSettings({
  radioButtons,
  themeSelect,
  statusElement,
  statusMessage: 'Saved',
});
