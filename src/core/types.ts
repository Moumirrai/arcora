export type Vec2PlaneMutable = { x: number; z: number };

export type Vec2Plane = Readonly<Vec2PlaneMutable>;

export type DisplacementMutable = { u?: number; v?: number; w?: number };

export type Displacement = Readonly<DisplacementMutable>;

export enum Dof {
  Ux = 0,
  Uy = 1,
  Rz = 2,
}

export type WithOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
