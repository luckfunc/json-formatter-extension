export type JsonNodeType = 'null' | 'array' | 'object' | 'string' | 'number' | 'boolean' | 'unknown';

export interface JsonNode {
  key: string | number | null;
  path: string;
  expanded: boolean;
  type: JsonNodeType;
  value: any;
  children: JsonNode[] | null;
}

export type ViewMode = 'formatted' | 'raw';

export interface FormatterState {
  rootNode: JsonNode;
  viewMode: ViewMode;
  rawContent: string;
}
