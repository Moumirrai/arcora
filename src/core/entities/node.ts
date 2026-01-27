import type { Model } from "../model";
import type { Displacement, Vec2Plane, Vec2PlaneMutable } from "../types";
import { v4 as uuidv4 } from "uuid";

export interface NodeData {
  id: string;
  coords: Vec2Plane;
  name?: string;
  prescribedDisplacement?: Displacement;
}

type NodeDataPartial = Partial<NodeData> & { coords: Vec2Plane }; //all optional except coords

export class Node {
  public readonly id: string;
  public name: string | undefined;
  
  #model: Model;
  #prescribedDisplacement: Displacement | undefined;
  #dirty = false;
  #coords: Vec2PlaneMutable; //private, mutable only via get/set

  constructor(model: Model, data: NodeDataPartial) {
    this.#model = model;
    this.#coords = data.coords;
    this.id = data.id || uuidv4();
    this.#prescribedDisplacement = data.prescribedDisplacement;
    this.name = data.name;
  }

  get pos(): Vec2Plane {
    return { x: this.#coords.x, z: this.#coords.z };
  }

  set pos(newPos: Vec2Plane) {
    this.#coords = { x: newPos.x, z: newPos.z };
    this.#dirty = true;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  cleanDirty(): void {
    this.#dirty = false;
  }

  toData(): NodeData {
    const data: NodeData = {
      coords: this.pos,
      id: this.id,
    };

    if (this.name !== undefined) data.name = this.name;
    if (this.#prescribedDisplacement !== undefined)
      data.prescribedDisplacement = this.#prescribedDisplacement;
    return data;
  }
}
