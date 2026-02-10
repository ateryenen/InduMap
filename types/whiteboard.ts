export type NodeType =
  | 'category'
  | 'note'
  | 'text'
  | 'image'
  | 'table'
  | 'group'
  | 'title'
  | 'icon'
  | 'milestone'
  | 'kpi'
  | 'owner'
  | 'link'
  | 'tag'
  | 'callout'
  | 'flow-process'
  | 'flow-decision'
  | 'flow-terminator';

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  bgColor?: string;
  imageUrl?: string;
  imageFile?: string;
  imageCrop?: { x: number; y: number; w: number; h: number };
  table?: { rows: number; cols: number; cells: string[][] };
  fontSize?: number;
  textColor?: string;
  textOpacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: number;
  textShadow?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  linkUrl?: string;
  groupId?: string;
  children?: string[];
  locked?: boolean;
  level?: 'L1' | 'L2' | 'L3' | 'Info';
  categoryTag?: string;
  impact?: number;
  effort?: number;
  owner?: string;
}

export type ToolMode = 'select' | 'pan';

export interface TableData {
  rows: number;
  cols: number;
  cells: string[][];
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface WhiteboardState {
  nodes: Node[];
  viewport: Viewport;
}
