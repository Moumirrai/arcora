import { describe, it, expect } from "vitest";
import { Element } from "../../../src/core/entities/element";
import { Node } from "../../../src/core/entities/node";
import { Model } from "../../../src/core/model";

describe("Element class", () => {
  const model = new Model();

  const nodeA = new Node(model, { coords: { x: 0, z: 0 } });
  const nodeB = new Node(model, { coords: { x: 3, z: 4 } });
  const nodeC = new Node(model, { coords: { x: -1, z: -1 } });

  const nodesMap = new Map<string, Node>([
    [nodeA.id, nodeA],
    [nodeB.id, nodeB],
    [nodeC.id, nodeC],
  ]);

  model.setNodes(nodesMap);

  it("returns correct length", () => {
    const element = new Element(model, {
      id: "element-1",
      nodeIDs: [nodeA.id, nodeB.id],
    });
    expect(element.length).toBe(5); // 3-4-5 triangle
  });

  it("throws error if node IDs do not exist in model", () => {
    expect(() => {
      new Element(model, {
        id: "element-2",
        nodeIDs: ["nonexistent-node-1", "nonexistent-node-2"],
      });
    }).toThrowError(
      `Node nonexistent-node-1 or nonexistent-node-2 does not exist`
    );
  });

  it("return right cosine and sine values", () => {
    const element = new Element(model, {
      id: "element-3",
      nodeIDs: [nodeA.id, nodeB.id],
    });
    expect(element.cosine).toBeCloseTo(0.6); // 3/5
    expect(element.sine).toBeCloseTo(0.8); // 4/5
  });

  it("computes stiffness matrix correctly", () => {
    const element = new Element(model, {
      id: "element-4",
      nodeIDs: [nodeA.id, nodeB.id],
    });

    const k = element.stiffnessMatrix;
    expect(k).toBeDefined();
  });
});
