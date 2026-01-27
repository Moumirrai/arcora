import type { Node } from "./node";
import { matrix } from "mathjs";

export interface ElementData {
  id: string;
  nodeIDs: readonly [string, string];
}

export class Element {
  public readonly nodeIDs: readonly [string, string];
  public readonly stifnessMatrix: any;

  #len: number = 0;
  #sine: number = 0;
  #cosine: number = 0;
  #transformMatrix: math.Matrix | undefined;

  constructor(data: ElementData, nodes: Map<string, Node>) {
    this.nodeIDs = data.nodeIDs;
    this.updateCache(nodes);
  }

  updateCache(nodes: Map<string, Node>) {
    const nA = nodes.get(this.nodeIDs[0]);
    const nB = nodes.get(this.nodeIDs[1]);
    if (nA === undefined || nB === undefined) {
      throw new Error(`Node ${this.nodeIDs[0]} or ${this.nodeIDs[1]} does not exist`);
    }

    this.#len = Math.hypot(nA.pos.x - nB.pos.x, nA.pos.z - nB.pos.z);

    const c = (nB.pos.x - nA.pos.x) / this.#len;
    const s = (nB.pos.z - nA.pos.z) / this.#len;

    this.#cosine = c;
    this.#sine = s;

    // Precompute transformation matrix
    this.#transformMatrix = matrix([
      [c, s, 0, 0, 0, 0],
      [-s, c, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, c, s, 0],
      [0, 0, 0, -s, c, 0],
      [0, 0, 0, 0, 0, 1],
    ]);
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
}
