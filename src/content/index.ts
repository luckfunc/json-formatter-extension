// 核心数据结构
interface JsonNode {
  key: string | number | null;
  path: string;
  expanded: boolean;
  type: JsonNodeType;
  value: any;
  children: JsonNode[] | null;
}

type JsonNodeType = 'null' | 'array' | 'object' | 'string' | 'number' | 'boolean' | 'unknown';

// 状态管理
interface FormatterState {
  rootNode: JsonNode;
  viewMode: 'formatted' | 'raw';
  rawContent: string;
}

let state: FormatterState | null = null;

// 工具函数
function getNodeType(value: any): JsonNodeType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

function createElement(tag: string, className?: string, textContent?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
}

function createChildren(container: object | any[], parentPath: string): JsonNode[] {
  const children: JsonNode[] = [];

  if (Array.isArray(container)) {
    container.forEach((item: any, index: number) => {
      const childPath = `${parentPath}[${index}]`;
      children.push(parseToNodes(item, index, childPath));
    });
  } else {
    Object.keys(container).forEach((key: string) => {
      const childPath = parentPath ? `${parentPath}.${key}` : key;
      children.push(parseToNodes((container as any)[key], key, childPath));
    });
  }

  return children;
}

function parseToNodes(value: any, key: string | number | null = null, path = ''): JsonNode {
  const nodeType = getNodeType(value);

  const node: JsonNode = {
    key,
    path,
    expanded: true, // 默认展开
    type: nodeType,
    value,
    children: null,
  };

  if (nodeType === 'object' || nodeType === 'array') {
    node.children = createChildren(value, path);
  }

  return node;
}

// 渲染函数
function renderNode(node: JsonNode, isLast = false): HTMLElement {
  const line = createElement('div', 'json-line');
  const isContainer = node.type === 'object' || node.type === 'array';

  // The element with the data-path for click handling is always the line.
  line.dataset.path = node.path;

  if (isContainer) {
    line.classList.add(`json-${node.type}`);
    const expander = createElement('span', 'json-expander', node.expanded ? '▼' : '▶');
    line.appendChild(expander);
  }

  // Render key if it's an object property
  if (typeof node.key === 'string') {
    const keySpan = createElement('span', 'json-key', `"${node.key}"`);
    const colon = createElement('span', 'json-syntax', ': ');
    line.appendChild(keySpan);
    line.appendChild(colon);
  }

  // Render the actual value ({...}, [...] or primitive)
  const valueElement = renderValue(node, isLast);
  line.appendChild(valueElement);

  return line;
}

function renderValue(node: JsonNode, isLast: boolean): HTMLElement {
  const valueContainer = createElement('span', 'json-value');
  const comma = isLast ? '' : ',';

  switch (node.type) {
    case 'object':
    case 'array': {
      const openSyntax = node.type === 'object' ? '{' : '[';
      const closeSyntax = node.type === 'object' ? '}' : ']';
      const childCount = node.children?.length || 0;

      valueContainer.appendChild(createElement('span', 'json-syntax', openSyntax));

      if (childCount === 0) {
        valueContainer.appendChild(createElement('span', 'json-syntax', closeSyntax));
      } else if (!node.expanded) {
        const syntax = createElement('span', 'json-syntax', ' … ');
        const items = node.type === 'object' ? 'properties' : 'items';
        const item = node.type === 'object' ? 'property' : 'item';
        const commentText = ` // ${childCount} ${childCount === 1 ? item : items}`;
        const comment = createElement('span', 'json-comment', commentText);
        valueContainer.appendChild(syntax);
        valueContainer.appendChild(createElement('span', 'json-syntax', closeSyntax));
        valueContainer.appendChild(comment);
      } else {
        // Expanded state: render children
        const childrenContainer = createElement('div', 'json-children');
        if (node.children) {
          node.children.forEach((child, index) => {
            const isChildLast = index === node.children.length - 1;
            childrenContainer.appendChild(renderNode(child, isChildLast));
          });
        }
        valueContainer.appendChild(childrenContainer);
        valueContainer.appendChild(createElement('div', 'json-line', closeSyntax));
      }
      break;
    }

    case 'string':
      valueContainer.className = 'json-string';
      valueContainer.textContent = `"${node.value}"`;
      break;
    case 'number':
      valueContainer.className = 'json-number';
      valueContainer.textContent = String(node.value);
      break;
    case 'boolean':
      valueContainer.className = 'json-boolean';
      valueContainer.textContent = String(node.value);
      break;
    case 'null':
      valueContainer.className = 'json-null';
      valueContainer.textContent = 'null';
      break;
    default:
      valueContainer.className = 'json-unknown';
      valueContainer.textContent = String(node.value);
      break;
  }

  const commaSpan = createElement('span', 'json-comma', comma);
  if (node.type === 'object' || node.type === 'array') {
    if (node.expanded && node.children && node.children.length > 0) {
      valueContainer.lastChild?.appendChild(commaSpan);
    } else {
      valueContainer.appendChild(commaSpan);
    }
  } else {
    valueContainer.appendChild(commaSpan);
  }

  return valueContainer;
}

// 事件处理
function toggleNodeExpansion(node: JsonNode, targetPath: string): boolean {
  if (node.path === targetPath) {
    node.expanded = !node.expanded;
    return true;
  }

  if (node.children) {
    for (const child of node.children) {
      if (toggleNodeExpansion(child, targetPath)) {
        return true;
      }
    }
  }

  return false;
}

function rerender(): void {
  if (!state) return;

  const container = document.getElementById('jsonFormatterParsed');
  if (!container) return;

  container.innerHTML = '';
  const newDom = renderNode(state.rootNode, true); // 根节点是最后一个（无逗号）
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
  if (!nodeElement) return;

  const { path } = nodeElement.dataset;
  if (path === undefined || !state) return;

  toggleNodeExpansion(state.rootNode, path);
  rerender();
}

// UI创建
function createUI(rawContent: string): void {
  const optionBar = createElement('div');
  optionBar.id = 'optionBar';

  const btnFormatted = createElement('button', 'selected', 'Formatted');
  btnFormatted.id = 'btnFormatted';
  btnFormatted.addEventListener('click', () => switchToFormatted());

  const btnRaw = createElement('button', '', 'Raw');
  btnRaw.id = 'btnRaw';
  btnRaw.addEventListener('click', () => switchToRaw());

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

  document.addEventListener('click', handleExpanderClick);
}

function switchToFormatted(): void {
  if (!state) return;

  state.viewMode = 'formatted';

  const formattedContainer = document.getElementById('jsonFormatterParsed');
  const rawContainer = document.getElementById('jsonFormatterRaw');
  const formattedBtn = document.getElementById('btnFormatted');
  const rawBtn = document.getElementById('btnRaw');

  if (formattedContainer) formattedContainer.style.display = 'block';
  if (rawContainer) rawContainer.style.display = 'none';
  if (formattedBtn) formattedBtn.classList.add('selected');
  if (rawBtn) rawBtn.classList.remove('selected');
}

function switchToRaw(): void {
  if (!state) return;

  state.viewMode = 'raw';

  const formattedContainer = document.getElementById('jsonFormatterParsed');
  const rawContainer = document.getElementById('jsonFormatterRaw');
  const formattedBtn = document.getElementById('btnFormatted');
  const rawBtn = document.getElementById('btnRaw');

  if (formattedContainer) formattedContainer.style.display = 'none';
  if (rawContainer) rawContainer.style.display = 'block';
  if (formattedBtn) formattedBtn.classList.remove('selected');
  if (rawBtn) rawBtn.classList.add('selected');
}

// 工具函数
function getPreContentAndRemove(): string | null {
  const preElement = document.querySelector('body > pre') as HTMLPreElement;
  if (!preElement) return null;

  const content = preElement.textContent;
  preElement.remove();
  return content;
}

function isJsonPage(): boolean {
  const bodyChildren = document.body.children;
  for (let i = 0; i < bodyChildren.length; i++) {
    const child = bodyChildren[i];
    if (child.tagName === 'PRE') {
      const content = child.textContent?.trim();
      if (content && /^\s*[{[]/.test(content)) {
        return true;
      }
    }
  }
  return false;
}

// 加载CSS样式文件
async function loadCSS(): Promise<void> {
  const { themeStyle = 'google' } = await chrome.storage.local.get('themeStyle');
  const { themeMode = 'auto' } = await chrome.storage.local.get('themeMode');

  // 直接根据设置确定要加载的模式
  let mode: 'light' | 'dark';
  if (themeMode === 'auto') {
    mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    mode = themeMode as 'light' | 'dark';
  }

  // 构建文件URL
  const templateUrl = chrome.runtime.getURL('themes/template.css');
  const variablesUrl = chrome.runtime.getURL(`themes/${themeStyle}/${mode}-variables.css`);

  try {
    // 并行加载文件
    const [templateRes, variablesRes] = await Promise.all([
      fetch(templateUrl),
      fetch(variablesUrl),
    ]);

    const [templateCSS, variablesCSS] = await Promise.all([
      templateRes.text(),
      variablesRes.text(),
    ]);

    // 组合CSS
    const finalCSS = `${variablesCSS}\n\n${templateCSS}`;

    // 移除旧样式并注入新样式
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

// 主初始化函数
async function initJsonFormatter(): Promise<void> {
  if (!isJsonPage()) {
    console.log('Not a JSON page, skipping formatter');
    return;
  }

  // 隐藏Chrome内置查看器
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

  await loadCSS(); // 加载外部CSS文件
  createUI(rawContent);
  rerender();

  console.log('JSON Formatter initialized successfully!');
}

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJsonFormatter);
} else {
  initJsonFormatter();
}
