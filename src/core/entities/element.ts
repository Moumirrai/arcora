import { Matrix } from "@algebra";
import type { Model } from "../model";
import type { WithOptional } from "../types";

export class ElementsMap extends Map<string, Element> {
  #structureVersion = 0;

  constructor(private model: Model) {
    super();
  }

  get structureVersion(): number {
    return this.#structureVersion;
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
    this.#structureVersion++;
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
    const existed = super.delete(key);
    if (existed) this.#structureVersion++;
    return existed;
  }

  override clear(): void {
    for (const [key, el] of this) {
      for (const id of el.nodeIDs) {
        const node = this.model.nodes.get(id);
        if (node) node.connectedElementIDs.delete(key);
      }
    }
    super.clear();
    this.#structureVersion++;
  }
}

export interface ElementData {
  nodeIDs: readonly [string, string];
  materialID: string;
  crossectionID: string;
  id: string;
  hinges?: readonly [boolean, boolean];
}

export type ElementDataPartial = WithOptional<ElementData, "id">;

export class Element {
  public readonly id: string;
  public readonly nodeIDs: readonly [string, string];

  #materialID: string;
  #crossectionID: string;
  #hinges: [boolean, boolean];

  #model: Model;

  #len: number = 0;
  #sine: number = 0;
  #cosine: number = 0;
  #transformMatrix: Matrix | undefined;
  #baseStiffnessMatrix: Matrix | undefined;
  #stiffnessMatrix: Matrix | undefined;
  #globalStiffnessMatrix: Matrix | undefined;
  #dirty = false;

  constructor(model: Model, data: ElementDataPartial) {
    this.#model = model;
    this.id = data.id ?? crypto.randomUUID();
    this.nodeIDs = data.nodeIDs;
    this.#materialID = data.materialID;
    this.#crossectionID = data.crossectionID;
    this.#hinges = data.hinges ? [...data.hinges] : [false, false];
    this.updateCache();
  }

  toData(): ElementData {
    return {
      id: this.id,
      nodeIDs: this.nodeIDs,
      materialID: this.#materialID,
      crossectionID: this.#crossectionID,
      hinges: this.#hinges,
    };
  }

  updateCache(): void {
    const nodeA = this.#model.nodes.get(this.nodeIDs[0]);
    const nodeB = this.#model.nodes.get(this.nodeIDs[1]);
    if (!nodeA || !nodeB) {
      throw new Error(
        `Node ${this.nodeIDs[0]} or ${this.nodeIDs[1]} does not exist`
      );
    }

    const material = this.#model.materials.get(this.#materialID);
    const crossection = this.#model.crossections.get(this.#crossectionID);
    if (!material || !crossection) {
      throw new Error(
        `Material ${this.#materialID} or crossection ${this.#crossectionID} does not exist`
      );
    }

    this.#len = Math.hypot(
      nodeB.pos.x - nodeA.pos.x,
      nodeB.pos.z - nodeA.pos.z
    );
    this.#cosine = (nodeB.pos.x - nodeA.pos.x) / this.#len;
    this.#sine = (nodeB.pos.z - nodeA.pos.z) / this.#len;

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

    this.#baseStiffnessMatrix = this.computeLocalStiffnessMatrix(
      material.E,
      crossection.area,
      crossection.Iy
    );

    this.#stiffnessMatrix =
      this.releasedDofs.length > 0
        ? this.condenseStiffness()
        : this.#baseStiffnessMatrix;

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

  get releasedDofs(): number[] {
    const released: number[] = [];
    if (this.#hinges[0]) released.push(2); // local dof index
    if (this.#hinges[1]) released.push(5);
    return released;
  }

  private condenseStiffness(): Matrix {
    if (!this.#baseStiffnessMatrix)
      throw new Error("Element stiffness matrix is not cached");
    const out_K = this.#baseStiffnessMatrix.clone();
    const released = this.releasedDofs;
    for (const p of released) {
      const pivot = out_K.at(p, p);
      for (let j = 0; j < 6; j++) {
        // row loop
        if (j === p) continue;
        const ajp = out_K.at(j, p);
        if (ajp === 0) continue;
        for (let k = 0; k < 6; k++) {
          // column loop
          if (k === p) continue;
          //static condensation formula: K_jk - K_jp * K_pk / K_pp
          out_K.setAt(j, k, out_K.at(j, k) - (ajp * out_K.at(p, k)) / pivot);
        }
      }
    }
    for (const p of released) {
      // zero out rows and columns of released DOFs
      for (let j = 0; j < 6; j++) {
        out_K.setAt(p, j, 0);
        out_K.setAt(j, p, 0);
      }
    }
    return out_K;
  }

  condenseLocalForces(f: Float64Array): Float64Array {
    const released = this.releasedDofs;
    const out_f = new Float64Array(f);
    if (released.length === 0) return out_f;
    const K = this.#baseStiffnessMatrix;
    if (!K) throw new Error("Element stiffness matrix is not cached");

    const r = released.length;
    const Kaa = new Float64Array(r * r);
    const fa = new Float64Array(r);
    for (let i = 0; i < r; i++) {
      fa[i] = f[released[i]!]!;
      for (let j = 0; j < r; j++) {
        Kaa[i * r + j] = K.at(released[i]!, released[j]!);
      }
    }

    const x = Element.solveReleased(Kaa, fa, r);
    for (let j = 0; j < 6; j++) {
      if (released.includes(j)) {
        out_f[j] = 0;
        continue;
      }
      let s = f[j]!;
      for (let i = 0; i < r; i++) {
        s -= K.at(j, released[i]!) * x[i]!;
      }
      out_f[j] = s;
    }
    return out_f;
  }

  private static solveReleased(
    Kaa: Float64Array,
    fa: Float64Array,
    n: number
  ): Float64Array {
    const x = new Float64Array(n);
    if (n === 1) {
      x[0] = fa[0]! / Kaa[0]!;
      return x;
    }
    const a = Kaa[0]!;
    const b = Kaa[1]!;
    const c = Kaa[2]!;
    const d = Kaa[3]!;
    const det = a * d - b * c;
    x[0] = (d * fa[0]! - b * fa[1]!) / det;
    x[1] = (a * fa[1]! - c * fa[0]!) / det;
    return x;
  }

  get dirty(): boolean {
    const nodeA = this.#model.nodes.get(this.nodeIDs[0]);
    const nodeB = this.#model.nodes.get(this.nodeIDs[1]);
    const material = this.#model.materials.get(this.#materialID);
    const crossection = this.#model.crossections.get(this.#crossectionID);
    return (
      this.#dirty ||
      (nodeA?.dirty ?? true) ||
      (nodeB?.dirty ?? true) ||
      (material?.dirty ?? true) ||
      (crossection?.dirty ?? true)
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

  // raw Float64Array global 6x6 stiffness
  get ke(): Float64Array {
    const m = this.#globalStiffnessMatrix;
    if (!m) throw new Error("Element stiffness matrix is not cached");
    return m.data;
  }

  // raw Float64Array local 6x6 stiffness
  get localStiffness(): Float64Array {
    const m = this.#stiffnessMatrix;
    if (!m) throw new Error("Element stiffness matrix is not cached");
    return m.data;
  }

  // raw Float64Array 6x6 transform matrix
  get transform(): Float64Array {
    const m = this.#transformMatrix;
    if (!m) throw new Error("Element transform matrix is not cached");
    return m.data;
  }

  get materialID(): string {
    return this.#materialID;
  }

  get crossectionID(): string {
    return this.#crossectionID;
  }

  set materialID(value: string) {
    this.#materialID = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  set crossectionID(value: string) {
    this.#crossectionID = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get hingeStart(): boolean {
    return this.#hinges[0];
  }

  set hingeStart(value: boolean) {
    if (this.#hinges[0] === value) return;
    this.#hinges[0] = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get hingeEnd(): boolean {
    return this.#hinges[1];
  }

  set hingeEnd(value: boolean) {
    if (this.#hinges[1] === value) return;
    this.#hinges[1] = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }
}
