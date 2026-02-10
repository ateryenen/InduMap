// lib/whiteboard/boardReducer.ts
import type { Node, Edge } from "./types";

export type Viewport = { x: number; y: number; scale: number };

export type BoardState = {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
};

export type BoardAction =
  | { type: "SET_NODES"; next: Node[] | ((prev: Node[]) => Node[]) }
  | { type: "SET_EDGES"; next: Edge[] | ((prev: Edge[]) => Edge[]) }
  | { type: "SET_VIEWPORT"; next: Viewport | ((prev: Viewport) => Viewport) }
  | { type: "APPLY_TEMPLATE"; nodes: Node[]; edges: Edge[]; viewport?: Viewport };

export const initialBoardState: BoardState = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, scale: 1 },
};

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "SET_NODES": {
      const next = typeof action.next === "function" ? (action.next as any)(state.nodes) : action.next;
      return { ...state, nodes: Array.isArray(next) ? next : [] };
    }
    case "SET_EDGES": {
      const next = typeof action.next === "function" ? (action.next as any)(state.edges) : action.next;
      return { ...state, edges: Array.isArray(next) ? next : [] };
    }
    case "SET_VIEWPORT": {
      const next = typeof action.next === "function" ? (action.next as any)(state.viewport) : action.next;
      const vp = next && typeof next === "object" ? next : state.viewport;
      return { ...state, viewport: { x: vp.x ?? 0, y: vp.y ?? 0, scale: vp.scale ?? 1 } };
    }
    case "APPLY_TEMPLATE": {
      return {
        nodes: Array.isArray(action.nodes) ? action.nodes : [],
        edges: Array.isArray(action.edges) ? action.edges : [],
        viewport: action.viewport ?? state.viewport,
      };
    }
    default:
      return state;
  }
}
