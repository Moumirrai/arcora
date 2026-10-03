import type { Model } from "../model";
import type { WithOptional } from "../types";

export interface NodalLoadData {
  id: string;
  nodeID: string;
  loadCaseID: string;
  Fx: number; //force in global x direction
  Fy: number; //force in global y direction
  Mz: number; //moment about global z axis
}

export type NodalLoadDataPartial = WithOptional<NodalLoadData, "id">;

export class NodalLoad {
  public readonly id: string;
  public readonly nodeID: string;
  public readonly loadCaseID: string;

  #Fx: number;
  #Fy: number;
  #Mz: number;

  #model: Model;
  #dirty = false;

  constructor(model: Model, data: NodalLoadDataPartial) {
    this.#model = model;
    this.id = data.id ?? crypto.randomUUID();
    this.nodeID = data.nodeID;
    this.loadCaseID = data.loadCaseID;
    this.#Fx = data.Fx;
    this.#Fy = data.Fy;
    this.#Mz = data.Mz;
  }

  get Fx(): number {
    return this.#Fx;
  }

  set Fx(value: number) {
    this.#Fx = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get Fy(): number {
    return this.#Fy;
  }

  set Fy(value: number) {
    this.#Fy = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get Mz(): number {
    return this.#Mz;
  }

  set Mz(value: number) {
    this.#Mz = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  cleanDirty(): void {
    this.#dirty = false;
  }

  toData(): NodalLoadData {
    return {
      id: this.id,
      nodeID: this.nodeID,
      loadCaseID: this.loadCaseID,
      Fx: this.#Fx,
      Fy: this.#Fy,
      Mz: this.#Mz,
    };
  }
}
