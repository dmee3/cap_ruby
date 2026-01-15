/**
 * Shared TypeScript types for tarp pattern rendering
 */

export interface Point {
  x: number;
  y: number;
}

export interface DiamondVertex extends Point {}

export interface DiamondEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  v1: DiamondVertex;
  v2: DiamondVertex;
}
