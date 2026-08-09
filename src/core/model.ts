import { Node } from "./entities/node";
import { Element } from "./entities/element";
import { Material } from "./valueProps/material";
import { ElementsMap } from "./entities/element";
import type { BCData } from "./entities/boundaryCondition";

export class Model {
  public readonly nodes: Map<string, Node> = new Map();
  public readonly elements: ElementsMap = new ElementsMap(this);
  public readonly materials: Map<string, Material> = new Map();

  public readonly boundaryConditions: Map<string, BCData> = new Map();

  public dirty = false;

  public setNodes(nodes: Map<string, Node>): void {
    this.nodes.clear();
    for (const [id, node] of nodes) {
      this.nodes.set(id, node);
    }
  }

  public setElements(elements: Map<string, Element>): void {
    this.elements.clear();
    for (const [id, element] of elements) {
      this.elements.set(id, element);
    }
  }
}
