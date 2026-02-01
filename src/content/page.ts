export function getPreElement(): HTMLPreElement | null {
  const preElement = document.querySelector('body > pre') as HTMLPreElement | null;
  if (!preElement) {
    return null;
  }
  return preElement;
}

export function isJsonPage(): boolean {
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
