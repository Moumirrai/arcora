import { describe, bench } from "vitest";

import { Element } from "../../../src/core/entities/element";
import { Node } from "../../../src/core/entities/node";
import { Material } from "../../../src/core/entities/material";
import { Crossection } from "../../../src/core/entities/crossection";
import { Model } from "../../../src/core/model";

describe("Element class", () => {
  const model = new Model();

  const nodeA = new Node(model, { coords: { x: 0, z: 0 } });
  const nodeB = new Node(model, { coords: { x: 3, z: 4 } });

  const nodesMap = new Map<string, Node>([
    [nodeA.id, nodeA],
    [nodeB.id, nodeB],
  ]);

  model.setNodes(nodesMap);

  const material = new Material(model, {
    E: 210e9,
    G: 80e9,
    alpha: 1.2e-5,
    density: 7850,
  });
  const crossection = new Crossection(model, {
    area: 0.01,
    Iy: 8.333e-6,
    Iz: 8.333e-6,
  });
  model.materials.set(material.id, material);
  model.crossections.set(crossection.id, crossection);

  bench("compute cache", () => {
    const element = new Element(model, {
      id: "element-bench-2",
      nodeIDs: [nodeA.id, nodeB.id],
      materialID: material.id,
      crossectionID: crossection.id,
    });
    element.globalStiffnessMatrix;
  });
});
