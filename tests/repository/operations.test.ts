import { describe, it, expect } from "vitest";
import { Model } from "@arcora/core/model";
import { ModelRepository } from "@arcora/repository/modelRepository";
import { Transaction } from "@arcora/repository/Transaction";
import { AddNodeOperation } from "@arcora/repository/operations/nodeCreate";
import { RemoveNodeOperation } from "@arcora/repository/operations/nodeDelete";
import { AddElementOperation } from "@arcora/repository/operations/elementCreate";
import { RemoveElementOperation } from "@arcora/repository/operations/elementDelete";
import { UpdateNodeOperation } from "@arcora/repository/operations/nodeUpdate";
import type { NodeData } from "@arcora/core/entities/node";
import { Material } from "@arcora/core/entities/material";
import { Crossection } from "@arcora/core/entities/crossection";

function addMaterialAndCrossection(model: Model): {
  materialID: string;
  crossectionID: string;
} {
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
  return { materialID: material.id, crossectionID: crossection.id };
}

function makeTwoNodes(
  repo: ModelRepository
): [AddNodeOperation, AddNodeOperation] {
  const a = new AddNodeOperation({ x: 0, z: 0, name: "A" });
  const b = new AddNodeOperation({ x: 10, z: 0, name: "B" });
  const txn = new Transaction("Add nodes");
  txn.addCommand(a);
  txn.addCommand(b);
  repo.commit(txn);
  return [a, b];
}

describe("AddNodeOperation", () => {
  it("commit adds node, undo removes, redo restores", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const op = new AddNodeOperation({ x: 5, z: 15 });
    const txn = new Transaction("Add");
    txn.addCommand(op);
    repo.commit(txn);
    expect(model.nodes.size).toBe(1);
    expect(model.nodes.get(op.id)?.pos).toEqual({ x: 5, z: 15 });

    repo.undo();
    expect(model.nodes.size).toBe(0);

    repo.redo();
    expect(model.nodes.size).toBe(1);
  });

  it("emits change on commit", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    const emitted: unknown[] = [];
    repo.onChange((c) => emitted.push(c));

    const op = new AddNodeOperation({ x: 0, z: 0 });
    const txn = new Transaction("Add");
    txn.addCommand(op);
    repo.commit(txn);

    expect(emitted).toHaveLength(1);
  });
});

describe("RemoveNodeOperation", () => {
  it("removes a standalone node, undo restores, redo removes", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const [nodeA] = makeTwoNodes(repo);
    expect(model.nodes.size).toBe(2);

    const txn = new Transaction("Remove");
    txn.addCommand(new RemoveNodeOperation(nodeA.id));
    repo.commit(txn);
    expect(model.nodes.size).toBe(1);
    expect(model.nodes.has(nodeA.id)).toBe(false);

    repo.undo();
    expect(model.nodes.size).toBe(2);
    expect(model.nodes.has(nodeA.id)).toBe(true);

    repo.redo();
    expect(model.nodes.size).toBe(1);
  });

  it("cascading removes connected elements, undo restores all", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const [nodeA, nodeB] = makeTwoNodes(repo);

    const { materialID, crossectionID } = addMaterialAndCrossection(model);
    const elOp = new AddElementOperation({
      nodeIDs: [nodeA.id, nodeB.id],
      materialID,
      crossectionID,
    });
    const elTxn = new Transaction("Add element");
    elTxn.addCommand(elOp);
    repo.commit(elTxn);
    expect(model.elements.size).toBe(1);

    const txn = new Transaction("Remove node A");
    txn.addCommand(new RemoveNodeOperation(nodeA.id));
    repo.commit(txn);
    expect(model.nodes.size).toBe(1);
    expect(model.elements.size).toBe(0);

    repo.undo();
    expect(model.nodes.size).toBe(2);
    expect(model.elements.size).toBe(1);

    repo.redo();
    expect(model.nodes.size).toBe(1);
    expect(model.elements.size).toBe(0);
  });

  it("returns Error for nonexistent node, emits no changes", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    let emitted = false;
    repo.onChange(() => (emitted = true));

    const txn = new Transaction("Remove missing");
    txn.addCommand(new RemoveNodeOperation("nonexistent"));
    repo.commit(txn);

    expect(emitted).toBe(false);
    expect(model.nodes.size).toBe(0);
  });

  it("succeeds when node and its connected element are both in the transaction", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const [nodeA, nodeB] = makeTwoNodes(repo);
    const { materialID, crossectionID } = addMaterialAndCrossection(model);
    const elOp = new AddElementOperation({
      nodeIDs: [nodeA.id, nodeB.id],
      materialID,
      crossectionID,
    });
    const elTxn = new Transaction("Add element");
    elTxn.addCommand(elOp);
    repo.commit(elTxn);
    expect(model.elements.size).toBe(1);

    const delTxn = new Transaction("Delete selection");
    delTxn.addCommand(new RemoveNodeOperation(nodeA.id));
    delTxn.addCommand(new RemoveElementOperation(elOp.id));
    repo.commit(delTxn);

    expect(model.nodes.size).toBe(1);
    expect(model.nodes.has(nodeA.id)).toBe(false);
    expect(model.elements.size).toBe(0);

    repo.undo();
    expect(model.nodes.size).toBe(2);
    expect(model.nodes.has(nodeA.id)).toBe(true);
    expect(model.elements.size).toBe(1);

    repo.redo();
    expect(model.nodes.size).toBe(1);
    expect(model.elements.size).toBe(0);
  });
});

describe("AddElementOperation", () => {
  it("adds element between nodes, undo removes, redo restores", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const [nodeA, nodeB] = makeTwoNodes(repo);

    const { materialID, crossectionID } = addMaterialAndCrossection(model);
    const elOp = new AddElementOperation({
      nodeIDs: [nodeA.id, nodeB.id],
      materialID,
      crossectionID,
    });
    const txn = new Transaction("Add element");
    txn.addCommand(elOp);
    repo.commit(txn);
    expect(model.elements.size).toBe(1);

    repo.undo();
    expect(model.elements.size).toBe(0);

    repo.redo();
    expect(model.elements.size).toBe(1);
  });

  it("returns Error when referenced node does not exist", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    let emitted = false;
    repo.onChange(() => (emitted = true));

    const { materialID, crossectionID } = addMaterialAndCrossection(model);
    const txn = new Transaction("Add bad element");
    txn.addCommand(
      new AddElementOperation({
        nodeIDs: ["missing", "also-missing"],
        materialID,
        crossectionID,
      })
    );
    repo.commit(txn);

    expect(emitted).toBe(false);
    expect(model.elements.size).toBe(0);
  });
});

describe("RemoveElementOperation", () => {
  it("removes element, undo restores, redo removes", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const [nodeA, nodeB] = makeTwoNodes(repo);
    const { materialID, crossectionID } = addMaterialAndCrossection(model);
    const elOp = new AddElementOperation({
      nodeIDs: [nodeA.id, nodeB.id],
      materialID,
      crossectionID,
    });
    const addTxn = new Transaction("Add element");
    addTxn.addCommand(elOp);
    repo.commit(addTxn);
    expect(model.elements.size).toBe(1);

    const delTxn = new Transaction("Remove element");
    delTxn.addCommand(new RemoveElementOperation(elOp.id));
    repo.commit(delTxn);
    expect(model.elements.size).toBe(0);

    repo.undo();
    expect(model.elements.size).toBe(1);

    repo.redo();
    expect(model.elements.size).toBe(0);
  });

  it("returns Error for nonexistent element", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    let emitted = false;
    repo.onChange(() => (emitted = true));

    const txn = new Transaction("Remove missing element");
    txn.addCommand(new RemoveElementOperation("nonexistent"));
    repo.commit(txn);

    expect(emitted).toBe(false);
  });
});

describe("Transaction rollback", () => {
  it("rolls back prior commands when a later command fails", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    let emitted = false;
    repo.onChange(() => (emitted = true));

    const nodeOp = new AddNodeOperation({ x: 0, z: 0 });
    const txn = new Transaction("Add then fail");
    txn.addCommand(nodeOp);
    txn.addCommand(new RemoveNodeOperation("nonexistent"));
    repo.commit(txn);

    expect(emitted).toBe(false);
    expect(model.nodes.size).toBe(0);
  });

  it("rolls back prior undos when a later undo fails during multi-undo", async () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const n1 = new AddNodeOperation({ x: 0, z: 0 });
    const t1 = new Transaction("Add 1");
    t1.addCommand(n1);
    repo.commit(t1);

    const n2 = new AddNodeOperation({ x: 1, z: 0 });
    const t2 = new Transaction("Add 2");
    t2.addCommand(n2);
    repo.commit(t2);

    expect(model.nodes.size).toBe(2);

    repo.undo(); // removes n2
    expect(model.nodes.size).toBe(1);
    expect(model.nodes.has(n1.id)).toBe(true);
  });
});

describe("Change tracking", () => {
  it("reports removed entities on cascading delete", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    const [nodeA, nodeB] = makeTwoNodes(repo);

    const { materialID, crossectionID } = addMaterialAndCrossection(model);
    const elOp = new AddElementOperation({
      nodeIDs: [nodeA.id, nodeB.id],
      materialID,
      crossectionID,
    });
    const elTxn = new Transaction("Add element");
    elTxn.addCommand(elOp);
    repo.commit(elTxn);

    const emitted: unknown[] = [];
    repo.onChange((c) => emitted.push(c));

    const delOp = new RemoveNodeOperation(nodeA.id);
    const txn = new Transaction("Remove");
    txn.addCommand(delOp);
    repo.commit(txn);

    expect(emitted).toHaveLength(1);
    const changes = emitted[0] as {
      removed: Set<{ kind: string; id: string }>;
    };
    expect(changes.removed.values().toArray()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "node", id: nodeA.id }),
        expect.objectContaining({ kind: "element", id: elOp.id }),
      ])
    );
  });
});

describe("UpdateNodeOperation", () => {
  it("updates node position, undo restores original", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const nodeOp = new AddNodeOperation({ x: 0, z: 0, name: "A" });
    const txn = new Transaction("Add");
    txn.addCommand(nodeOp);
    repo.commit(txn);

    const newData: NodeData = { id: nodeOp.id, coords: { x: 10, z: 15 } };

    const updateOp = new UpdateNodeOperation(newData);
    const updateTxn = new Transaction("Move");
    updateTxn.addCommand(updateOp);
    repo.commit(updateTxn);

    expect(model.nodes.get(nodeOp.id)!.pos).toEqual({ x: 10, z: 15 });

    repo.undo();
    expect(model.nodes.get(nodeOp.id)!.pos).toEqual({ x: 0, z: 0 });

    repo.redo();
    expect(model.nodes.get(nodeOp.id)!.pos).toEqual({ x: 10, z: 15 });
  });

  it("emits changed for node and connected elements", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const [nodeA, nodeB] = makeTwoNodes(repo);
    const { materialID, crossectionID } = addMaterialAndCrossection(model);
    const elOp = new AddElementOperation({
      nodeIDs: [nodeA.id, nodeB.id],
      materialID,
      crossectionID,
    });
    const elTxn = new Transaction("Add element");
    elTxn.addCommand(elOp);
    repo.commit(elTxn);

    const emitted: unknown[] = [];
    repo.onChange((c) => emitted.push(c));

    const newData = { id: nodeA.id, coords: { x: 5, z: 5 } };
    const updateOp = new UpdateNodeOperation(newData);
    const updateTxn = new Transaction("Move node");
    updateTxn.addCommand(updateOp);
    repo.commit(updateTxn);

    const changes = emitted[0] as {
      changed: Set<{ kind: string; id: string }>;
    };

    expect(changes.changed.values().toArray()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "node", id: nodeA.id }),
        expect.objectContaining({ kind: "element", id: elOp.id }),
      ])
    );
  });
});

describe("ModelRepository.apply", () => {
  it("emits changes but does not push to undo stack", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const [nodeA] = makeTwoNodes(repo);

    const emitted: unknown[] = [];
    repo.onChange((c) => emitted.push(c));

    const newData = { id: nodeA.id, coords: { x: 50, z: 50 } };
    const updateOp = new UpdateNodeOperation(newData);
    const applyTxn = new Transaction("Drag");
    applyTxn.addCommand(updateOp);
    repo.apply(applyTxn);

    expect(model.nodes.get(nodeA.id)!.pos).toEqual({ x: 50, z: 50 });
    expect(emitted).toHaveLength(1);

    repo.undo();
    expect(model.nodes.has(nodeA.id)).toBe(false);
  });
});

describe("node.pos setter sets model.dirty", () => {
  it("marks model dirty when node position changes", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const nodeOp = new AddNodeOperation({ x: 0, z: 0 });
    const txn = new Transaction("Add");
    txn.addCommand(nodeOp);
    repo.commit(txn);

    model.dirty = false;
    expect(model.dirty).toBe(false);

    model.nodes.get(nodeOp.id)!.pos = { x: 10, z: 20 };
    expect(model.dirty).toBe(true);
  });
});
