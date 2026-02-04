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

  it("computes stiffness matrix values correctly", () => {
    const element = new Element(model, {
      id: "element-10",
      nodeIDs: [nodeA.id, nodeB.id],
    });

    const k = element.stiffnessMatrix!;
    expect(k.get([0, 0])).toBeCloseTo(420000000);
    expect(k.get([0, 3])).toBeCloseTo(-420000000);
    expect(k.get([1, 1])).toBeCloseTo(167993.28);
    expect(k.get([1, 2])).toBeCloseTo(419983.2);
    expect(k.get([2, 2])).toBeCloseTo(1399944);
    expect(k.get([3, 3])).toBeCloseTo(420000000);
    expect(k.get([4, 4])).toBeCloseTo(167993.28);
    expect(k.get([5, 5])).toBeCloseTo(1399944);
  });

  it("updates cache correctly when updateCache is called after node changes", () => {
    nodeA.cleanDirty();
    nodeB.cleanDirty();
    const element = new Element(model, {
      id: "element-11",
      nodeIDs: [nodeA.id, nodeB.id],
    });
    expect(element.length).toBe(5);
    expect(element.cosine).toBeCloseTo(0.6);
    expect(element.sine).toBeCloseTo(0.8);

    // Clean and change node position
    nodeB.cleanDirty();
    nodeB.pos = { x: 0, z: 5 }; // now from (0,0) to (0,5), length 5, cosine=0, sine=1
    expect(element.dirty).toBe(true);

    // Call updateCache
    element.updateCache();

    expect(element.length).toBe(5);
    expect(element.cosine).toBeCloseTo(0);
    expect(element.sine).toBeCloseTo(1);
    expect(element.dirty).toBe(true); // node is still dirty
  });

  it("returns false for dirty after creation", () => {
    nodeA.cleanDirty();
    nodeB.cleanDirty();
    const element = new Element(model, {
      id: "element-5",
      nodeIDs: [nodeA.id, nodeB.id],
    });
    expect(element.dirty).toBe(false);
  });

  it("returns true for dirty when node position changes", () => {
    nodeA.cleanDirty();
    nodeB.cleanDirty();
    const element = new Element(model, {
      id: "element-6",
      nodeIDs: [nodeA.id, nodeB.id],
    });
    expect(element.dirty).toBe(false);
    nodeA.pos = { x: 1, z: 0 };
    expect(element.dirty).toBe(true);
  });

  it("returns true for dirty even after cleanDirty if nodes are dirty", () => {
    const element = new Element(model, {
      id: "element-7",
      nodeIDs: [nodeA.id, nodeB.id],
    });
    nodeB.pos = { x: 4, z: 4 };
    expect(element.dirty).toBe(true);
    element.cleanDirty();
    expect(element.dirty).toBe(true); // still true because node is dirty
  });

  it("returns false for dirty after cleaning node dirty", () => {
    const element = new Element(model, {
      id: "element-8",
      nodeIDs: [nodeA.id, nodeB.id],
    });
    nodeA.cleanDirty();
    nodeB.cleanDirty();
    nodeA.pos = { x: 2, z: 0 };
    expect(element.dirty).toBe(true);
    nodeA.cleanDirty();
    expect(element.dirty).toBe(false);
  });

  it("handles zero-length element (nodes at same position)", () => {
    const nodeD = new Node(model, { coords: { x: 0, z: 0 } });
    const nodeE = new Node(model, { coords: { x: 0, z: 0 } });
    model.setNodes(
      new Map([...nodesMap, [nodeD.id, nodeD], [nodeE.id, nodeE]])
    );
    const element = new Element(model, {
      id: "element-9",
      nodeIDs: [nodeD.id, nodeE.id],
    });
    expect(element.length).toBe(0);
    expect(isNaN(element.sine)).toBe(true);
    expect(isNaN(element.cosine)).toBe(true);
    expect(element.stiffnessMatrix).toBeDefined();
  });
});
