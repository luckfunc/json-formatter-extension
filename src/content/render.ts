import type { JsonNode } from './model';
import { createElement } from './dom';

interface RenderContext {
  line: number;
  showLineNumbers: boolean;
}

interface RowElements {
  row: HTMLElement;
  content: HTMLElement;
}

function createRow(
  context: RenderContext,
  options: {
    path?: string;
    depth: number;
    expandable: boolean;
    expanded: boolean;
  }
): RowElements {
  const row = createElement('div', 'json-row');
  if (options.path !== undefined) {
    row.dataset.path = options.path;
  }

  const gutter = createElement('div', 'json-gutter');
  const lineNumber = createElement(
    'span',
    context.showLineNumbers ? 'json-line-number' : 'json-line-number hidden',
    context.showLineNumbers ? String(context.line) : ''
  );

  const expander = createElement(
    'span',
    options.expandable ? 'json-expander' : 'json-expander-placeholder',
    ''
  );
  if (!options.expandable) {
    expander.setAttribute('aria-hidden', 'true');
  } else {
    expander.dataset.expanded = options.expanded ? 'true' : 'false';
  }

  gutter.appendChild(lineNumber);
  gutter.appendChild(expander);
  row.appendChild(gutter);

  const content = createElement('div', 'json-content');
  content.style.setProperty('--indent-level', String(options.depth));
  row.appendChild(content);

  context.line += 1;

  return { row, content };
}

function appendComma(target: HTMLElement, isLast: boolean): void {
  if (isLast) {
    return;
  }
  target.appendChild(createElement('span', 'json-comma', ','));
}

function appendKey(content: HTMLElement, node: JsonNode): void {
  if (typeof node.key !== 'string') {
    return;
  }
  const keySpan = createElement('span', 'json-key', `"${node.key}"`);
  const colon = createElement('span', 'json-syntax', ': ');
  content.appendChild(keySpan);
  content.appendChild(colon);
}

function appendPrimitive(content: HTMLElement, node: JsonNode, isLast: boolean): void {
  const value = createElement('span', 'json-value');

  switch (node.type) {
    case 'string':
      value.className = 'json-string';
      value.textContent = `"${node.value}"`;
      break;
    case 'number':
      value.className = 'json-number';
      value.textContent = String(node.value);
      break;
    case 'boolean':
      value.className = 'json-boolean';
      value.textContent = String(node.value);
      break;
    case 'null':
      value.className = 'json-null';
      value.textContent = 'null';
      break;
    default:
      value.className = 'json-unknown';
      value.textContent = String(node.value);
      break;
  }

  content.appendChild(value);
  appendComma(content, isLast);
}

function createClosingRow(
  context: RenderContext,
  closeSyntax: string,
  depth: number,
  isLast: boolean
): HTMLElement {
  const { row, content } = createRow(context, {
    depth,
    expandable: false,
    expanded: false,
  });
  content.appendChild(createElement('span', 'json-syntax', closeSyntax));
  appendComma(content, isLast);
  return row;
}

function renderNode(
  node: JsonNode,
  isLast: boolean,
  depth: number,
  context: RenderContext
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const isContainer = node.type === 'object' || node.type === 'array';
  const childCount = node.children?.length ?? 0;
  const isExpandable = isContainer && childCount > 0;

  const { row, content } = createRow(context, {
    path: node.path,
    depth,
    expandable: isExpandable,
    expanded: node.expanded,
  });

  if (isContainer) {
    row.classList.add(`json-${node.type}`);
    if (isExpandable && !node.expanded) {
      row.classList.add('collapsed');
    }
  }

  appendKey(content, node);

  if (!isContainer) {
    appendPrimitive(content, node, isLast);
    fragment.appendChild(row);
    return fragment;
  }

  const openSyntax = node.type === 'object' ? '{' : '[';
  const closeSyntax = node.type === 'object' ? '}' : ']';

  content.appendChild(createElement('span', 'json-syntax', openSyntax));

  if (!isExpandable) {
    content.appendChild(createElement('span', 'json-syntax', closeSyntax));
    appendComma(content, isLast);
    fragment.appendChild(row);
    return fragment;
  }

  if (!node.expanded) {
    const ellipsis = createElement('span', 'json-syntax', ' … ');
    const items = node.type === 'object' ? 'properties' : 'items';
    const item = node.type === 'object' ? 'property' : 'item';
    const commentText = ` // ${childCount} ${childCount === 1 ? item : items}`;
    const comment = createElement('span', 'json-comment', commentText);
    content.appendChild(ellipsis);
    content.appendChild(createElement('span', 'json-syntax', closeSyntax));
    content.appendChild(comment);
    appendComma(content, isLast);
    fragment.appendChild(row);
    return fragment;
  }

  fragment.appendChild(row);

  const children = node.children ?? [];
  children.forEach((child, index) => {
    const isChildLast = index === children.length - 1;
    fragment.appendChild(renderNode(child, isChildLast, depth + 1, context));
  });

  fragment.appendChild(createClosingRow(context, closeSyntax, depth, isLast));
  return fragment;
}

export function renderTree(
  rootNode: JsonNode,
  options: { showLineNumbers?: boolean } = {}
): DocumentFragment {
  const context: RenderContext = {
    line: 1,
    showLineNumbers: options.showLineNumbers !== false,
  };

  return renderNode(rootNode, true, 0, context);
}
