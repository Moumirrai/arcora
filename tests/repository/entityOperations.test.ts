import { describe, it, expect } from "vitest";
import { Model } from "@arcora/core/model";
import { ModelRepository } from "@arcora/repository/modelRepository";
import { Transaction } from "@arcora/repository/Transaction";
import { changeKey } from "@arcora/repository/changes";
import { AddNodeOperation } from "@arcora/repository/operations/nodeCreate";
import { AddElementOperation } from "@arcora/repository/operations/elementCreate";
import { Material } from "@arcora/core/entities/material";
import { Crossection } from "@arcora/core/entities/crossection";
import { LoadCaseType } from "@arcora/core/entities/loadCase";
import { AddMaterialOperation } from "@arcora/repository/operations/materialCreate";
import { UpdateMaterialOperation } from "@arcora/repository/operations/materialUpdate";
import { RemoveMaterialOperation } from "@arcora/repository/operations/materialDelete";
import { AddCrossectionOperation } from "@arcora/repository/operations/crossectionCreate";
import { UpdateCrossectionOperation } from "@arcora/repository/operations/crossectionUpdate";
import { RemoveCrossectionOperation } from "@arcora/repository/operations/crossectionDelete";
import { AddLoadCaseOperation } from "@arcora/repository/operations/loadCaseCreate";
import { UpdateLoadCaseOperation } from "@arcora/repository/operations/loadCaseUpdate";
import { RemoveLoadCaseOperation } from "@arcora/repository/operations/loadCaseDelete";
import { AddLoadOperation } from "@arcora/repository/operations/loadCreate";
import { UpdateLoadOperation } from "@arcora/repository/operations/loadUpdate";
import { RemoveLoadOperation } from "@arcora/repository/operations/loadDelete";
import { RemoveElementOperation } from "@arcora/repository/operations/elementDelete";
import { ElementLoad } from "@arcora/core/entities/elementLoad";
import type { Load } from "@arcora/core/entities/load";

function isElementLoad(load: Load | undefined): load is ElementLoad {
  return load instanceof ElementLoad;
}

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

function makeElement(model: Model, repo: ModelRepository): AddElementOperation {
  const nodeA = new AddNodeOperation({ x: 0, z: 0, name: "A" });
  const nodeB = new AddNodeOperation({ x: 10, z: 0, name: "B" });
  const { materialID, crossectionID } = addMaterialAndCrossection(model);
  const elOp = new AddElementOperation({
    nodeIDs: [nodeA.id, nodeB.id],
    materialID,
    crossectionID,
  });
  const txn = new Transaction("Add element");
  txn.addCommand(nodeA);
  txn.addCommand(nodeB);
  txn.addCommand(elOp);
  repo.commit(txn);
  return elOp;
}

describe("AddMaterialOperation", () => {
  it("adds material, undo removes, redo restores", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const op = new AddMaterialOperation({
      E: 210e9,
      G: 80e9,
      alpha: 1.2e-5,
      density: 7850,
    });
    const txn = new Transaction("Add material");
    txn.addCommand(op);
    repo.commit(txn);

    expect(model.materials.size).toBe(1);
    expect(model.materials.get(op.id)?.E).toBe(210e9);

    repo.undo();
    expect(model.materials.size).toBe(0);

    repo.redo();
    expect(model.materials.size).toBe(1);
  });

  it("emits material change on commit", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    const emitted: { added: Map<string, { kind: string; id: string }> }[] = [];
    repo.onChange((c) => emitted.push(c));

    const op = new AddMaterialOperation({
      E: 1,
      G: 1,
      alpha: 1,
      density: 1,
    });
    const txn = new Transaction("Add material");
    txn.addCommand(op);
    repo.commit(txn);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]!.added.get(changeKey("material", op.id))).toEqual({
      kind: "material",
      id: op.id,
    });
  });
});

describe("UpdateMaterialOperation", () => {
  it("updates material, undo restores original", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const addOp = new AddMaterialOperation({
      E: 210e9,
      G: 80e9,
      alpha: 1.2e-5,
      density: 7850,
    });
    const addTxn = new Transaction("Add material");
    addTxn.addCommand(addOp);
    repo.commit(addTxn);

    const updateOp = new UpdateMaterialOperation({
      id: addOp.id,
      E: 300e9,
      G: 100e9,
      alpha: 2e-5,
      density: 8000,
    });
    const updateTxn = new Transaction("Update material");
    updateTxn.addCommand(updateOp);
    repo.commit(updateTxn);

    expect(model.materials.get(addOp.id)?.E).toBe(300e9);
    expect(model.materials.get(addOp.id)?.density).toBe(8000);

    repo.undo();
    expect(model.materials.get(addOp.id)?.E).toBe(210e9);

    repo.redo();
    expect(model.materials.get(addOp.id)?.E).toBe(300e9);
  });

  it("emits changed for material and referencing elements", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const elOp = makeElement(model, repo);
    const materialID = model.elements.get(elOp.id)!.materialID;

    const emitted: { changed: Map<string, { kind: string; id: string }> }[] =
      [];
    repo.onChange((c) => emitted.push(c));

    const updateOp = new UpdateMaterialOperation({
      id: materialID,
      E: 300e9,
      G: 100e9,
      alpha: 2e-5,
      density: 8000,
    });
    const txn = new Transaction("Update material");
    txn.addCommand(updateOp);
    repo.commit(txn);

    const changed = Array.from(emitted[0]!.changed.values());
    expect(changed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "material", id: materialID }),
        expect.objectContaining({ kind: "element", id: elOp.id }),
      ])
    );
  });

  it("returns Error for nonexistent material", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    let emitted = false;
    repo.onChange(() => (emitted = true));

    const txn = new Transaction("Update missing");
    txn.addCommand(
      new UpdateMaterialOperation({
        id: "missing",
        E: 1,
        G: 1,
        alpha: 1,
        density: 1,
      })
    );
    repo.commit(txn);

    expect(emitted).toBe(false);
  });
});

describe("RemoveMaterialOperation", () => {
  it("throws an error if the material is still in use", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const elOp = makeElement(model, repo);
    const materialID = model.elements.get(elOp.id)!.materialID;
    expect(model.materials.size).toBe(1);
    expect(model.elements.size).toBe(1);

    const delTxn = new Transaction("Remove material");
    delTxn.addCommand(new RemoveMaterialOperation(materialID));
    repo.commit(delTxn);

    expect(model.materials.size).toBe(1);
    expect(model.elements.size).toBe(1);
  });

  it("removes material, undo restores", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const { materialID } = addMaterialAndCrossection(model);
    expect(model.materials.size).toBe(1);

    const delTxn = new Transaction("Remove material");
    delTxn.addCommand(new RemoveMaterialOperation(materialID));
    repo.commit(delTxn);

    expect(model.materials.size).toBe(0);

    repo.undo();
    expect(model.materials.size).toBe(1);
    expect(model.materials.get(materialID)?.E).toBe(210e9);
  });

  it("returns Error for nonexistent material", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    let emitted = false;
    repo.onChange(() => (emitted = true));

    const txn = new Transaction("Remove missing");
    txn.addCommand(new RemoveMaterialOperation("missing"));
    repo.commit(txn);

    expect(emitted).toBe(false);
  });
});

describe("AddCrossectionOperation", () => {
  it("adds crossection, undo removes, redo restores", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const op = new AddCrossectionOperation({
      area: 0.01,
      Iy: 8.333e-6,
      Iz: 8.333e-6,
    });
    const txn = new Transaction("Add crossection");
    txn.addCommand(op);
    repo.commit(txn);

    expect(model.crossections.size).toBe(1);
    expect(model.crossections.get(op.id)?.area).toBe(0.01);

    repo.undo();
    expect(model.crossections.size).toBe(0);

    repo.redo();
    expect(model.crossections.size).toBe(1);
  });

  it("emits crossSection change on commit", () => {
    const model = new Model();
    const repo = new ModelRepository(model);
    const emitted: { added: Map<string, { kind: string; id: string }> }[] = [];
    repo.onChange((c) => emitted.push(c));

    const op = new AddCrossectionOperation({ area: 1, Iy: 1, Iz: 1 });
    const txn = new Transaction("Add crossection");
    txn.addCommand(op);
    repo.commit(txn);

    expect(emitted[0]!.added.get(changeKey("crossSection", op.id))).toEqual({
      kind: "crossSection",
      id: op.id,
    });
  });
});

describe("UpdateCrossectionOperation", () => {
  it("updates crossection, undo restores original", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const addOp = new AddCrossectionOperation({ area: 1, Iy: 1, Iz: 1 });
    const addTxn = new Transaction("Add crossection");
    addTxn.addCommand(addOp);
    repo.commit(addTxn);

    const updateOp = new UpdateCrossectionOperation({
      id: addOp.id,
      area: 2,
      Iy: 3,
      Iz: 4,
    });
    const updateTxn = new Transaction("Update crossection");
    updateTxn.addCommand(updateOp);
    repo.commit(updateTxn);

    expect(model.crossections.get(addOp.id)?.area).toBe(2);

    repo.undo();
    expect(model.crossections.get(addOp.id)?.area).toBe(1);

    repo.redo();
    expect(model.crossections.get(addOp.id)?.area).toBe(2);
  });
});

describe("RemoveCrossectionOperation", () => {
  it("throws an error if the crossection is still in use", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const elOp = makeElement(model, repo);
    const crossectionID = model.elements.get(elOp.id)!.crossectionID;

    const delTxn = new Transaction("Remove crossection");
    delTxn.addCommand(new RemoveCrossectionOperation(crossectionID));
    repo.commit(delTxn);

    expect(model.crossections.size).toBe(1);
  });

  it("removes crossection, undo restores", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const { crossectionID } = addMaterialAndCrossection(model);
    expect(model.crossections.size).toBe(1);

    const delTxn = new Transaction("Remove crossection");
    delTxn.addCommand(new RemoveCrossectionOperation(crossectionID));
    repo.commit(delTxn);

    expect(model.crossections.size).toBe(0);

    repo.undo();
    expect(model.crossections.size).toBe(1);
    expect(model.crossections.get(crossectionID)?.area).toBe(0.01);
  });
});

describe("AddLoadCaseOperation", () => {
  it("adds load case, undo removes, redo restores", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const op = new AddLoadCaseOperation({
      name: "Dead",
      type: LoadCaseType.Dead,
      selfWeight: true,
    });
    const txn = new Transaction("Add load case");
    txn.addCommand(op);
    repo.commit(txn);

    expect(model.loadCases.size).toBe(1);
    expect(model.loadCases.get(op.id)?.name).toBe("Dead");

    repo.undo();
    expect(model.loadCases.size).toBe(0);

    repo.redo();
    expect(model.loadCases.size).toBe(1);
  });
});

describe("UpdateLoadCaseOperation", () => {
  it("updates load case, undo restores original", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const addOp = new AddLoadCaseOperation({
      name: "Live",
      type: LoadCaseType.Live,
      selfWeight: false,
    });
    const addTxn = new Transaction("Add load case");
    addTxn.addCommand(addOp);
    repo.commit(addTxn);

    const updateOp = new UpdateLoadCaseOperation({
      id: addOp.id,
      name: "Wind",
      type: LoadCaseType.Wind,
      selfWeight: true,
    });
    const updateTxn = new Transaction("Update load case");
    updateTxn.addCommand(updateOp);
    repo.commit(updateTxn);

    expect(model.loadCases.get(addOp.id)?.name).toBe("Wind");
    expect(model.loadCases.get(addOp.id)?.type).toBe(LoadCaseType.Wind);

    repo.undo();
    expect(model.loadCases.get(addOp.id)?.name).toBe("Live");
    expect(model.loadCases.get(addOp.id)?.type).toBe(LoadCaseType.Live);

    repo.redo();
    expect(model.loadCases.get(addOp.id)?.name).toBe("Wind");
  });
});

describe("RemoveLoadCaseOperation", () => {
  it("removes load case and cascades to its loads, undo restores all", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const nodeOp = new AddNodeOperation({ x: 0, z: 0 });
    const caseOp = new AddLoadCaseOperation({
      name: "Dead",
      type: LoadCaseType.Dead,
      selfWeight: true,
    });
    const setupTxn = new Transaction("Setup");
    setupTxn.addCommand(nodeOp);
    setupTxn.addCommand(caseOp);
    repo.commit(setupTxn);

    const loadOp = new AddLoadOperation({
      type: "nodal",
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 1,
      Fy: 2,
      Mz: 3,
    });
    const loadTxn = new Transaction("Add load");
    loadTxn.addCommand(loadOp);
    repo.commit(loadTxn);

    expect(model.loads.size).toBe(1);

    const delTxn = new Transaction("Remove load case");
    delTxn.addCommand(new RemoveLoadCaseOperation(caseOp.id));
    repo.commit(delTxn);

    expect(model.loadCases.size).toBe(0);
    expect(model.loads.size).toBe(0);

    repo.undo();
    expect(model.loadCases.size).toBe(1);
    expect(model.loads.size).toBe(1);
    expect(model.loads.get(loadOp.id)?.loadCaseID).toBe(caseOp.id);

    repo.redo();
    expect(model.loadCases.size).toBe(0);
    expect(model.loads.size).toBe(0);
  });
});

describe("AddLoadOperation", () => {
  it("adds a nodal load, undo removes, redo restores", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const nodeOp = new AddNodeOperation({ x: 0, z: 0 });
    const caseOp = new AddLoadCaseOperation({
      name: "Dead",
      type: LoadCaseType.Dead,
      selfWeight: true,
    });
    const setupTxn = new Transaction("Setup");
    setupTxn.addCommand(nodeOp);
    setupTxn.addCommand(caseOp);
    repo.commit(setupTxn);

    const op = new AddLoadOperation({
      type: "nodal",
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 10,
      Fy: 20,
      Mz: 30,
    });
    const txn = new Transaction("Add load");
    txn.addCommand(op);
    repo.commit(txn);

    expect(model.loads.size).toBe(1);
    expect(model.loads.get(op.id)?.toData()).toEqual({
      id: op.id,
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 10,
      Fy: 20,
      Mz: 30,
    });

    repo.undo();
    expect(model.loads.size).toBe(0);

    repo.redo();
    expect(model.loads.size).toBe(1);
  });

  it("adds a uniform element load", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const elOp = makeElement(model, repo);
    const caseOp = new AddLoadCaseOperation({
      name: "Live",
      type: LoadCaseType.Live,
      selfWeight: false,
    });
    const caseTxn = new Transaction("Add load case");
    caseTxn.addCommand(caseOp);
    repo.commit(caseTxn);

    const op = new AddLoadOperation({
      type: "uniform",
      elementID: elOp.id,
      loadCaseID: caseOp.id,
      qx: 5,
      qy: -10,
    });
    const txn = new Transaction("Add uniform load");
    txn.addCommand(op);
    repo.commit(txn);

    expect(model.loads.size).toBe(1);
    expect(model.loads.get(op.id)?.toData()).toEqual({
      id: op.id,
      elementID: elOp.id,
      loadCaseID: caseOp.id,
      qx: 5,
      qy: -10,
    });
  });

  it("returns Error when referenced node does not exist", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const caseOp = new AddLoadCaseOperation({
      name: "Dead",
      type: LoadCaseType.Dead,
      selfWeight: true,
    });
    const caseTxn = new Transaction("Add load case");
    caseTxn.addCommand(caseOp);
    repo.commit(caseTxn);

    let emitted = false;
    repo.onChange(() => (emitted = true));

    const txn = new Transaction("Add bad load");
    txn.addCommand(
      new AddLoadOperation({
        type: "nodal",
        nodeID: "missing",
        loadCaseID: caseOp.id,
        Fx: 0,
        Fy: 0,
        Mz: 0,
      })
    );
    repo.commit(txn);

    expect(emitted).toBe(false);
    expect(model.loads.size).toBe(0);
  });

  it("returns Error when referenced load case does not exist", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const nodeOp = new AddNodeOperation({ x: 0, z: 0 });
    const nodeTxn = new Transaction("Add node");
    nodeTxn.addCommand(nodeOp);
    repo.commit(nodeTxn);

    let emitted = false;
    repo.onChange(() => (emitted = true));

    const txn = new Transaction("Add bad load");
    txn.addCommand(
      new AddLoadOperation({
        type: "nodal",
        nodeID: nodeOp.id,
        loadCaseID: "missing",
        Fx: 0,
        Fy: 0,
        Mz: 0,
      })
    );
    repo.commit(txn);

    expect(emitted).toBe(false);
    expect(model.loads.size).toBe(0);
  });
});

describe("UpdateLoadOperation", () => {
  it("updates a nodal load, undo restores original", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const nodeOp = new AddNodeOperation({ x: 0, z: 0 });
    const caseOp = new AddLoadCaseOperation({
      name: "Dead",
      type: LoadCaseType.Dead,
      selfWeight: true,
    });
    const setupTxn = new Transaction("Setup");
    setupTxn.addCommand(nodeOp);
    setupTxn.addCommand(caseOp);
    repo.commit(setupTxn);

    const addOp = new AddLoadOperation({
      type: "nodal",
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 1,
      Fy: 2,
      Mz: 3,
    });
    const addTxn = new Transaction("Add load");
    addTxn.addCommand(addOp);
    repo.commit(addTxn);

    const updateOp = new UpdateLoadOperation({
      type: "nodal",
      id: addOp.id,
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 10,
      Fy: 20,
      Mz: 30,
    });
    const updateTxn = new Transaction("Update load");
    updateTxn.addCommand(updateOp);
    repo.commit(updateTxn);

    expect(model.loads.get(addOp.id)?.toData()).toEqual({
      id: addOp.id,
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 10,
      Fy: 20,
      Mz: 30,
    });

    repo.undo();
    expect(model.loads.get(addOp.id)?.toData()).toEqual({
      id: addOp.id,
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 1,
      Fy: 2,
      Mz: 3,
    });

    repo.redo();
    expect(model.loads.get(addOp.id)?.toData()).toEqual({
      id: addOp.id,
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 10,
      Fy: 20,
      Mz: 30,
    });
  });

  it("updates a uniform element load, undo restores original", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const elOp = makeElement(model, repo);
    const caseOp = new AddLoadCaseOperation({
      name: "Live",
      type: LoadCaseType.Live,
      selfWeight: false,
    });
    const caseTxn = new Transaction("Add load case");
    caseTxn.addCommand(caseOp);
    repo.commit(caseTxn);

    const addOp = new AddLoadOperation({
      type: "uniform",
      elementID: elOp.id,
      loadCaseID: caseOp.id,
      qx: 5,
      qy: -10,
    });
    const addTxn = new Transaction("Add load");
    addTxn.addCommand(addOp);
    repo.commit(addTxn);

    const updateOp = new UpdateLoadOperation({
      type: "uniform",
      id: addOp.id,
      elementID: elOp.id,
      loadCaseID: caseOp.id,
      qx: 50,
      qy: -100,
    });
    const updateTxn = new Transaction("Update load");
    updateTxn.addCommand(updateOp);
    repo.commit(updateTxn);

    expect(model.loads.get(addOp.id)?.toData()).toEqual({
      id: addOp.id,
      elementID: elOp.id,
      loadCaseID: caseOp.id,
      qx: 50,
      qy: -100,
    });

    repo.undo();
    expect(model.loads.get(addOp.id)?.toData()).toEqual({
      id: addOp.id,
      elementID: elOp.id,
      loadCaseID: caseOp.id,
      qx: 5,
      qy: -10,
    });
  });
});

describe("RemoveLoadOperation", () => {
  it("removes a load, undo restores, redo removes", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const nodeOp = new AddNodeOperation({ x: 0, z: 0 });
    const caseOp = new AddLoadCaseOperation({
      name: "Dead",
      type: LoadCaseType.Dead,
      selfWeight: true,
    });
    const setupTxn = new Transaction("Setup");
    setupTxn.addCommand(nodeOp);
    setupTxn.addCommand(caseOp);
    repo.commit(setupTxn);

    const addOp = new AddLoadOperation({
      type: "nodal",
      nodeID: nodeOp.id,
      loadCaseID: caseOp.id,
      Fx: 1,
      Fy: 2,
      Mz: 3,
    });
    const addTxn = new Transaction("Add load");
    addTxn.addCommand(addOp);
    repo.commit(addTxn);

    const delTxn = new Transaction("Remove load");
    delTxn.addCommand(new RemoveLoadOperation(addOp.id));
    repo.commit(delTxn);
    expect(model.loads.size).toBe(0);

    repo.undo();
    expect(model.loads.size).toBe(1);

    repo.redo();
    expect(model.loads.size).toBe(0);
  });
});

describe("RemoveElementOperation cascades to element loads", () => {
  it("removes attached element loads, undo restores all", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const elOp = makeElement(model, repo);
    const caseOp = new AddLoadCaseOperation({
      name: "Live",
      type: LoadCaseType.Live,
      selfWeight: false,
    });
    const caseTxn = new Transaction("Add load case");
    caseTxn.addCommand(caseOp);
    repo.commit(caseTxn);

    const loadOp = new AddLoadOperation({
      type: "uniform",
      elementID: elOp.id,
      loadCaseID: caseOp.id,
      qx: 5,
      qy: -10,
    });
    const loadTxn = new Transaction("Add load");
    loadTxn.addCommand(loadOp);
    repo.commit(loadTxn);
    expect(model.loads.size).toBe(1);

    const delTxn = new Transaction("Remove element");
    delTxn.addCommand(new RemoveElementOperation(elOp.id));
    repo.commit(delTxn);

    expect(model.elements.size).toBe(0);
    expect(model.loads.size).toBe(0);

    repo.undo();
    expect(model.elements.size).toBe(1);
    expect(model.loads.size).toBe(1);
    const restoredLoad = model.loads.get(loadOp.id);
    expect(isElementLoad(restoredLoad)).toBe(true);
    if (!isElementLoad(restoredLoad))
      throw new Error("Expected an element load");
    expect(restoredLoad.elementID).toBe(elOp.id);

    repo.redo();
    expect(model.elements.size).toBe(0);
    expect(model.loads.size).toBe(0);
  });
});
