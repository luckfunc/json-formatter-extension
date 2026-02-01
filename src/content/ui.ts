import { createElement } from './dom';

interface UIHandlers {
  onFormatted: () => void;
  onRaw: () => void;
}

export function createUI(rawContent: string, handlers: UIHandlers): void {
  const optionBar = createElement('div');
  optionBar.id = 'optionBar';

  const btnFormatted = createElement('button', 'selected', 'Formatted');
  btnFormatted.id = 'btnFormatted';
  btnFormatted.addEventListener('click', handlers.onFormatted);

  const btnRaw = createElement('button', '', 'Raw');
  btnRaw.id = 'btnRaw';
  btnRaw.addEventListener('click', handlers.onRaw);

  optionBar.appendChild(btnFormatted);
  optionBar.appendChild(btnRaw);

  const formattedContainer = createElement('div');
  formattedContainer.id = 'jsonFormatterParsed';

  const rawContainer = createElement('div');
  rawContainer.id = 'jsonFormatterRaw';
  rawContainer.style.display = 'none';

  const rawPre = createElement('pre', '', rawContent);
  rawContainer.appendChild(rawPre);

  document.body.appendChild(optionBar);
  document.body.appendChild(formattedContainer);
  document.body.appendChild(rawContainer);
}
