import './style.less';

const input = document.getElementById('opt') as HTMLInputElement;
input?.addEventListener('input', () => {
  chrome.storage.sync.set({ userInput: input.value });
});
