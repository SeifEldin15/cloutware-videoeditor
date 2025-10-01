// Shared types for animation system
export interface Position {
  x: number;
  y: number;
}

export interface AnimationResult {
  events: string;
  lastPosition: Position;
}