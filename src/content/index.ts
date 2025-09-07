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
  switch (node.type) {
    case 'object':
      return renderObject(node, isLast);
    case 'array':
      return renderArray(node, isLast);
    default:
      return renderPrimitive(node, isLast);
  }
}

function renderObject(node: JsonNode, isLast = false): HTMLElement {
  const container = createElement('div', 'json-object');
  container.dataset.path = node.path;
  container.dataset.type = node.type;

  const childCount = node.children?.length || 0;
  const comma = isLast ? '' : ',';

  if (childCount === 0) {
    // 空对象
    container.innerHTML = `<span class="json-syntax">{}</span><span class="json-comma">${comma}</span>`;
    return container;
  }

  if (!node.expanded) {
    // 折叠状态
    const expander = createElement('span', 'json-expander', '▶');
    const syntax = createElement('span', 'json-syntax', '{ … }');
    const commentText = ` // ${childCount} ${childCount === 1 ? 'property' : 'properties'}`;
    const comment = createElement('span', 'json-comment', commentText);
    const commaSpan = createElement('span', 'json-comma', comma);

    container.appendChild(expander);
    container.appendChild(syntax);
    container.appendChild(commaSpan);
    container.appendChild(comment);
  } else {
    // 展开状态
    const firstLine = createElement('div', 'json-line');
    const expander = createElement('span', 'json-expander', '▼');
    const openBrace = createElement('span', 'json-syntax', '{');

    firstLine.appendChild(expander);
    firstLine.appendChild(openBrace);
    container.appendChild(firstLine);

    // 渲染子元素
    if (node.children) {
      node.children.forEach((child, index) => {
        const childLine = createElement('div', 'json-line json-property');

        // 键名
        if (child.key !== null) {
          const keySpan = createElement('span', 'json-key', `"${child.key}"`);
          const colon = createElement('span', 'json-syntax', ': ');
          childLine.appendChild(keySpan);
          childLine.appendChild(colon);
        }

        // 值
        const isChildLast = index === node.children!.length - 1;
        const valueElement = renderNode(child, isChildLast);
        childLine.appendChild(valueElement);

        container.appendChild(childLine);
      });
    }

    // 闭括号
    const lastLine = createElement('div', 'json-line');
    const closeBrace = createElement('span', 'json-syntax', '}');
    const commaSpan = createElement('span', 'json-comma', comma);

    lastLine.appendChild(closeBrace);
    lastLine.appendChild(commaSpan);
    container.appendChild(lastLine);
  }

  return container;
}

function renderArray(node: JsonNode, isLast = false): HTMLElement {
  const container = createElement('div', 'json-array');
  container.dataset.path = node.path;
  container.dataset.type = node.type;

  const childCount = node.children?.length || 0;
  const comma = isLast ? '' : ',';

  if (childCount === 0) {
    // 空数组
    container.innerHTML = `<span class="json-syntax">[]</span><span class="json-comma">${comma}</span>`;
    return container;
  }

  if (!node.expanded) {
    // 折叠状态
    const expander = createElement('span', 'json-expander', '▶');
    const syntax = createElement('span', 'json-syntax', '[ … ]');
    const commentText = ` // ${childCount} ${childCount === 1 ? 'item' : 'items'}`;
    const comment = createElement('span', 'json-comment', commentText);
    const commaSpan = createElement('span', 'json-comma', comma);

    container.appendChild(expander);
    container.appendChild(syntax);
    container.appendChild(commaSpan);
    container.appendChild(comment);
  } else {
    // 展开状态
    const firstLine = createElement('div', 'json-line');
    const expander = createElement('span', 'json-expander', '▼');
    const openBracket = createElement('span', 'json-syntax', '[');

    firstLine.appendChild(expander);
    firstLine.appendChild(openBracket);
    container.appendChild(firstLine);

    // 渲染子元素
    if (node.children) {
      node.children.forEach((child, index) => {
        const childLine = createElement('div', 'json-line json-item');

        const isChildLast = index === node.children!.length - 1;
        const valueElement = renderNode(child, isChildLast);
        childLine.appendChild(valueElement);

        container.appendChild(childLine);
      });
    }

    // 闭括号
    const lastLine = createElement('div', 'json-line');
    const closeBracket = createElement('span', 'json-syntax', ']');
    const commaSpan = createElement('span', 'json-comma', comma);

    lastLine.appendChild(closeBracket);
    lastLine.appendChild(commaSpan);
    container.appendChild(lastLine);
  }

  return container;
}

function renderPrimitive(node: JsonNode, isLast = false): HTMLElement {
  const comma = isLast ? '' : ',';
  let displayValue: string;
  let className: string;

  switch (node.type) {
    case 'string':
      displayValue = `"${node.value}"`;
      className = 'json-string';
      break;
    case 'number':
      displayValue = String(node.value);
      className = 'json-number';
      break;
    case 'boolean':
      displayValue = String(node.value);
      className = 'json-boolean';
      break;
    case 'null':
      displayValue = 'null';
      className = 'json-null';
      break;
    default:
      displayValue = String(node.value);
      className = 'json-unknown';
  }

  const span = createElement('span', className, displayValue);
  const commaSpan = createElement('span', 'json-comma', comma);

  const container = createElement('span', 'json-primitive');
  container.appendChild(span);
  container.appendChild(commaSpan);

  return container;
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
  const theme = themeStyle;

  const styleUrl = chrome.runtime.getURL(`themes/${theme}/style.css`);
  const styleDarkUrl = chrome.runtime.getURL(`themes/${theme}/styleDark.css`);

  const [styleRes, styleDarkRes] = await Promise.all([fetch(styleUrl), fetch(styleDarkUrl)]);

  const [css, darkThemeCss] = await Promise.all([styleRes.text(), styleDarkRes.text()]);

  // 获取主题覆盖设置
  const { themeOverride = 'system' } = await chrome.storage.local.get('themeOverride');

  let finalCSS: string;
  switch (themeOverride) {
    case 'force_light':
      finalCSS = css;
      break;
    case 'force_dark':
      finalCSS = `${css}\n\n${darkThemeCss}`;
      break;
    case 'system':
    default:
      finalCSS = `${css}\n\n@media (prefers-color-scheme: dark) {\n${darkThemeCss}\n}`;
  }

  // 注入到 style 标签
  const styleEl = document.createElement('style');
  styleEl.id = 'jsonFormatterStyle';
  styleEl.textContent = finalCSS;
  document.head.appendChild(styleEl);
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
