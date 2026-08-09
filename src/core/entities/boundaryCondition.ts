import { Dof } from "@arcora/core/types";

export enum BCType {
  Dirichlet = "dirichlet",
  Spring = "spring",
  Dependent = "dependent",
}

export interface MasterDof {
  nodeId: string;
  dof: Dof;
  /**
   * u_slave = Σ(**coefficient** × u_master) + constant
   *
   * `coefficient=0` -> `u_slave = fixed`
   *
   * `coefficient=1` -> `u_slave = u_master`
   */
  coefficient: number;
}

export interface DependentDofData {
  masters: MasterDof[];
  /**
   * u_slave = Σ(coefficient × u_master) + **constant**
   */
  constant?: number;
}

export interface SpringDofData {
  stiffness: number;
  preload?: number;
}

export interface BCData {
  nodeId: string;
  rotation: number;

  dirichlet?: Partial<Record<Dof, number>>;
  spring?: Partial<Record<Dof, SpringDofData>>;
  dependent?: Partial<Record<Dof, DependentDofData>>;
}
