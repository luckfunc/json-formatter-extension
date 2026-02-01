import type { JsonNode } from './model';

export function toggleNodeExpansion(node: JsonNode, targetPath: string): boolean {
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
