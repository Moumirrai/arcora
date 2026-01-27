import type { Vec2, Vec2Mutable } from "../types";
import { v4 as uuidv4 } from "uuid";

export interface NodeData {
  id: string;
  coords: Vec2;
  name?: string;
  initialDisplacement?: Vec2;
}

type NodeDataPartial = Partial<NodeData> & { coords: Vec2 }; //all optional except coords

export class Node {
  public readonly id: string;
  public readonly initialDisplacement: Vec2 | undefined;
  public name: string | undefined;

  #dirty: boolean = false;
  #coords: Vec2Mutable; //private, mutable only via get/set

  constructor(data: NodeDataPartial) {
    this.#coords = data.coords;
    this.id = data.id || uuidv4();
    this.initialDisplacement = data.initialDisplacement;
    this.name = data.name;
  }

  get pos(): Vec2 {
    return { x: this.#coords.x, z: this.#coords.z };
  }

  set pos(newPos: Vec2) {
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
    if (this.initialDisplacement !== undefined)
      data.initialDisplacement = this.initialDisplacement;

    return data;
  }
}
