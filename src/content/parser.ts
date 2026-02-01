import type { JsonNode, JsonNodeType } from './model';

function getNodeType(value: any): JsonNodeType {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  return 'unknown';
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

export function parseToNodes(value: any, key: string | number | null = null, path = ''): JsonNode {
  const nodeType = getNodeType(value);

  const node: JsonNode = {
    key,
    path,
    expanded: true,
    type: nodeType,
    value,
    children: null,
  };

  if (nodeType === 'object' || nodeType === 'array') {
    node.children = createChildren(value, path);
  }

  return node;
}
