import { describe, it, expect } from "vitest";
import { Element } from "../../../src/core/entities/element";
import { Node } from "../../../src/core/entities/node";

describe("Element class", () => {
  it("returns correct length", () => {
    const nodeA = new Node({ coords: { x: 0, z: 0 } });
    const nodeB = new Node({ coords: { x: 3, z: 4 } });
    const nodeC = new Node({ coords: { x: -1, z: -1 } });

    const nodesMap = new Map<string, Node>([
      [nodeA.id, nodeA],
      [nodeB.id, nodeB],
      [nodeC.id, nodeC],
    ]);

    const element = new Element({ id: "element-1", nodeIDs: [nodeA.id, nodeB.id] }, nodesMap);
    expect(element.length).toBe(5); // 3-4-5 triangle
  });
});
