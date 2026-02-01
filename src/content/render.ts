import type { JsonNode } from './model';
import { createElement } from './dom';

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
        const childrenContainer = createElement('div', 'json-children');
        const children = node.children;
        if (children) {
          children.forEach((child, index) => {
            const isChildLast = index === children.length - 1;
            childrenContainer.appendChild(renderNode(child, isChildLast));
          });
        }
        valueContainer.appendChild(childrenContainer);
        valueContainer.appendChild(createClosingLine(closeSyntax));
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
      (valueContainer.lastChild as HTMLElement | null)?.appendChild(commaSpan);
    } else {
      valueContainer.appendChild(commaSpan);
    }
  } else {
    valueContainer.appendChild(commaSpan);
  }

  return valueContainer;
}

function createClosingLine(closeSyntax: string): HTMLElement {
  const line = createElement('div', 'json-line');
  const placeholder = createElement('span', 'json-expander-placeholder');
  placeholder.setAttribute('aria-hidden', 'true');
  line.appendChild(placeholder);
  line.appendChild(createElement('span', 'json-syntax', closeSyntax));
  return line;
}

export function renderNode(node: JsonNode, isLast = false): HTMLElement {
  const line = createElement('div', 'json-line');
  const isContainer = node.type === 'object' || node.type === 'array';
  const childCount = node.children?.length ?? 0;
  const isExpandable = isContainer && childCount > 0;

  line.dataset.path = node.path;

  if (isContainer) {
    line.classList.add(`json-${node.type}`);
    if (isExpandable && !node.expanded) {
      line.classList.add('collapsed');
    }
  }

  const expander = createElement(
    'span',
    isExpandable ? 'json-expander' : 'json-expander-placeholder',
    isExpandable ? (node.expanded ? '▼' : '▶') : ''
  );
  if (!isExpandable) {
    expander.setAttribute('aria-hidden', 'true');
  } else {
    expander.dataset.expanded = node.expanded ? 'true' : 'false';
  }
  line.appendChild(expander);

  if (typeof node.key === 'string') {
    const keySpan = createElement('span', 'json-key', `"${node.key}"`);
    const colon = createElement('span', 'json-syntax', ': ');
    line.appendChild(keySpan);
    line.appendChild(colon);
  }

  const valueElement = renderValue(node, isLast);
  line.appendChild(valueElement);

  return line;
}
