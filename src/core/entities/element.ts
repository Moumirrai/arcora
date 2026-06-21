import { Matrix } from "@algebra";
import type { Model } from "../model";
import type { Node } from "./node";

export class ElementsMap extends Map<string, Element> {
  constructor(private model: Model) {
    super();
  }

  override set(key: string, value: Element): this {
    const old = super.get(key);
    if (old) {
      for (const id of old.nodeIDs) {
        const node = this.model.nodes.get(id);
        if (node) node.connectedElementIDs.delete(key);
      }
    }
    super.set(key, value);
    for (const id of value.nodeIDs) {
      const node = this.model.nodes.get(id);
      if (node) node.connectedElementIDs.add(key);
    }
    return this;
  }

  override delete(key: string): boolean {
    const element = super.get(key);
    if (element) {
      for (const id of element.nodeIDs) {
        const node = this.model.nodes.get(id);
        if (node) node.connectedElementIDs.delete(key);
      }
    }
    return super.delete(key);
  }

  override clear(): void {
    for (const [key, el] of this) {
      for (const id of el.nodeIDs) {
        const node = this.model.nodes.get(id);
        if (node) node.connectedElementIDs.delete(key);
      }
    }
    super.clear();
  }
}

export interface ElementData {
  nodeIDs: readonly [string, string];
  id: string;
}

export type ElementDataPartial = Partial<ElementData> & {
  nodeIDs: readonly [string, string];
}; //all optional except nodeIDs

export class Element {
  public readonly id: string;
  public readonly nodeIDs: readonly [string, string];

  #model: Model;

  #len: number = 0;
  #sine: number = 0;
  #cosine: number = 0;
  #transformMatrix: Matrix | undefined;
  #stiffnessMatrix: Matrix | undefined;
  #globalStiffnessMatrix: Matrix | undefined;
  #dirty = false;

  #nodeA: Node | undefined;
  #nodeB: Node | undefined;

  constructor(model: Model, data: ElementDataPartial) {
    this.#model = model;
    this.id = data.id ?? crypto.randomUUID();
    this.nodeIDs = data.nodeIDs;
    this.updateCache();
  }

  toData(): ElementData {
    return { id: this.id, nodeIDs: this.nodeIDs };
  }

  updateCache(): void {
    this.#nodeA = this.#model.nodes.get(this.nodeIDs[0]);
    this.#nodeB = this.#model.nodes.get(this.nodeIDs[1]);
    if (!this.#nodeA || !this.#nodeB) {
      throw new Error(
        `Node ${this.nodeIDs[0]} or ${this.nodeIDs[1]} does not exist`
      );
    }

    this.#len = Math.hypot(
      this.#nodeB.pos.x - this.#nodeA.pos.x,
      this.#nodeB.pos.z - this.#nodeA.pos.z
    );
    this.#cosine = (this.#nodeB.pos.x - this.#nodeA.pos.x) / this.#len;
    this.#sine = (this.#nodeB.pos.z - this.#nodeA.pos.z) / this.#len;

    const c = this.#cosine;
    const s = this.#sine;

    this.#transformMatrix = new Matrix(6, 6, [
      [c, s, 0, 0, 0, 0],
      [-s, c, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, c, s, 0],
      [0, 0, 0, -s, c, 0],
      [0, 0, 0, 0, 0, 1],
    ]);

    this.#stiffnessMatrix = this.computeLocalStiffnessMatrix(
      210e9,
      0.01,
      8.333e-6
    ); //example values

    this.#globalStiffnessMatrix = this.#transformMatrix
      .transpose()
      .multiply(this.#stiffnessMatrix)
      .multiply(this.#transformMatrix);

    this.#dirty = false;
  }

  private computeLocalStiffnessMatrix(E: number, A: number, I: number): Matrix {
    const L = this.#len;
    const kLocal = new Matrix(6, 6, [
      [(A * E) / L, 0, 0, (-A * E) / L, 0, 0],
      [
        0,
        (12 * E * I) / L ** 3,
        (6 * E * I) / L ** 2,
        0,
        (-12 * E * I) / L ** 3,
        (6 * E * I) / L ** 2,
      ],
      [
        0,
        (6 * E * I) / L ** 2,
        (4 * E * I) / L,
        0,
        (-6 * E * I) / L ** 2,
        (2 * E * I) / L,
      ],
      [(-A * E) / L, 0, 0, (A * E) / L, 0, 0],
      [
        0,
        (-12 * E * I) / L ** 3,
        (-6 * E * I) / L ** 2,
        0,
        (12 * E * I) / L ** 3,
        (-6 * E * I) / L ** 2,
      ],
      [
        0,
        (6 * E * I) / L ** 2,
        (2 * E * I) / L,
        0,
        (-6 * E * I) / L ** 2,
        (4 * E * I) / L,
      ],
    ]);
    return kLocal;
  }

  get dirty(): boolean {
    // If element is dirty or any of the child nodes are dirty return true
    return (
      this.#dirty ||
      (this.#nodeA?.dirty ?? true) ||
      (this.#nodeB?.dirty ?? true)
    );
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

  get globalStiffnessMatrix(): Matrix | undefined {
    return this.#globalStiffnessMatrix;
  }
}
