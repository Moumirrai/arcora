import type { Node } from "./node";
import { matrix } from "mathjs";
import type { Matrix } from "mathjs";
import type { Model } from "../model";

export interface ElementData {
  nodeIDs: readonly [string, string];
  id: string;
}

export type ElementDataPartial = Partial<ElementData> & {
  nodeIDs: readonly [string, string];
}; //all optional except nodeIDs

export class Element {
  public readonly nodeIDs: readonly [string, string];
  
  #model: Model;
  
  #len: number = 0;
  #sine: number = 0;
  #cosine: number = 0;
  #transformMatrix: Matrix | undefined;
  #stiffnessMatrix: Matrix | undefined;
  #dirty = false;

  constructor(model: Model, data: ElementDataPartial) {
    this.#model = model;
    this.nodeIDs = data.nodeIDs;
    this.updateCache();
  }

  updateCache(): void {
    const nA = this.#model.nodes.get(this.nodeIDs[0]);
    const nB = this.#model.nodes.get(this.nodeIDs[1]);
    if (!nA || !nB) {
      throw new Error(
        `Node ${this.nodeIDs[0]} or ${this.nodeIDs[1]} does not exist`
      );
    }

    this.#len = Math.hypot(nB.pos.x - nA.pos.x, nB.pos.z - nA.pos.z);
    this.#cosine = (nB.pos.x - nA.pos.x) / this.#len;
    this.#sine = (nB.pos.z - nA.pos.z) / this.#len;

    const c = this.#cosine;
    const s = this.#sine;

    this.#transformMatrix = matrix([
      [c, s, 0, 0, 0, 0],
      [-s, c, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, c, s, 0],
      [0, 0, 0, -s, c, 0],
      [0, 0, 0, 0, 0, 1],
    ]);

    this.#stiffnessMatrix = this.computeStiffnessMatrix(210e9, 0.01, 8.333e-6); //example values

    this.#dirty = false;
  }

  private computeStiffnessMatrix(E: number, A: number, I: number): Matrix {
    const L = this.#len;
    const kLocal = matrix([
      [A * E / L, 0, 0, -A * E / L, 0, 0],
      [0, (12 * E * I) / (L ** 3), (6 * E * I) / (L ** 2), 0, (-12 * E * I) / (L ** 3), (6 * E * I) / (L ** 2)],
      [0, (6 * E * I) / (L ** 2), (4 * E * I) / L, 0, (-6 * E * I) / (L ** 2), (2 * E * I) / L],
      [-A * E / L, 0, 0, A * E / L, 0, 0],
      [0, (-12 * E * I) / (L ** 3), (-6 * E * I) / (L ** 2), 0, (12 * E * I) / (L ** 3), (-6 * E * I) / (L ** 2)],
      [0, (6 * E * I) / (L ** 2), (2 * E * I) / L, 0, (-6 * E * I) / (L ** 2), (4 * E * I) / L],
    ]);
    return kLocal;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  cleanDirty(): void {
    this.#dirty = false;
  }

  get length(): number {
    return this.#len;
  }

  get sine(): number {
    return this.#sine;
  }

  get cosine(): number {
    return this.#cosine;
  }

  get stiffnessMatrix(): Matrix | undefined {
    return this.#stiffnessMatrix;
  }
}
