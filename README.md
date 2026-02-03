# JSON Formatter Extension

[Report Bug](https://github.com/luckfunc/json-formatter-extension/issues) · [Request Feature](https://github.com/luckfunc/json-formatter-extension/issues/new) · English · [中文](README.zh-CN.md)

![Preview](public/preview.png)

A browser JSON formatter extension.

## Features

- Structured JSON view (collapsible)
- Theme switching (Options / Popup)
- Raw mode uses the browser's default rendering
- Multiple themes (Classic / VSCode / GitHub / Claude / Google)

## Development

```bash
pnpm install
pnpm run build
```

Build output is in `dist/`. Load it in Chrome via "Load unpacked".

## Thanks

This project borrows interaction ideas from Monaco Editor. Thanks for the open-source work:
https://github.com/microsoft/monaco-editor
