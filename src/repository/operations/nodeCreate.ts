import type { IOperation } from "../IOperation";
import type { Node, NodeOptions } from "../../core/entities/node";
import { v4 as uuidv4 } from "uuid";

export class AddNodeOperation implements IOperation {
  constructor(private opts: NodeOptions) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.id = uuidv4();
  }

  do(): boolean {
    if (this.createdNode) {
      const nodeToAdd = this.createdNode;
      internalStore.update((model) => ({
        ...model,
        nodes: [...(model.nodes || []), nodeToAdd],
      }));
      return true;
    }
    const assignedName =
      this.name === undefined ? generateNextNodeName() : this.name;
    const newNode: Node = {
      id: this.id,
      name: assignedName,
      dx: this.x,
      dy: this.y,
    };

    internalStore.update((model) => {
      const nodes = model.nodes || [];
      return {
        ...model,
        nodes: [...nodes, newNode],
      };
    });

    this.createdNode = newNode;
    return true;
  }

  undo(): boolean {
    if (this.createdNode) {
      const nodeIdToRemove = this.createdNode.id;
      internalStore.update((model) => {
        const remainingNodes = (model.nodes || []).filter(
          (n) => n.id !== nodeIdToRemove
        );
        const remainingElements = (model.elements || []).filter(
          (el) =>
            el.nodeA.id !== nodeIdToRemove && el.nodeB.id !== nodeIdToRemove
        );
        return {
          ...model,
          nodes: remainingNodes,
          elements: remainingElements,
        };
      });
      return true;
    } else {
      console.warn(
        `AddNodeOperation: No node was created previously for ID "${this.id}". Nothing to undo.`
      );
      return false;
    }
  }
}
