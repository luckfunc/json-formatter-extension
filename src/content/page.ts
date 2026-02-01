export function getPreContentAndRemove(): string | null {
  const preElement = document.querySelector('body > pre') as HTMLPreElement;
  if (!preElement) {
    return null;
  }

  const content = preElement.textContent;
  preElement.remove();
  return content;
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
