import { describe, bench } from "vitest";

import { Element } from "../../../src/core/entities/element";
import { Node } from "../../../src/core/entities/node";
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

  bench("compute cache", () => {
    const element = new Element(model, {
      id: "element-bench-2",
      nodeIDs: [nodeA.id, nodeB.id],
    });
  });
});
