import { describe, it, expect } from "vitest";
import { Model } from "../../../src/core/model";
import { Node } from "../../../src/core/entities/node";
import { Material } from "../../../src/core/entities/material";
import { Crossection } from "../../../src/core/entities/crossection";
import { Element } from "../../../src/core/entities/element";
import { LoadCase, LoadCaseType } from "../../../src/core/entities/loadCase";
import { NodalLoad } from "../../../src/core/entities/nodalLoad";
import { UniformLoad } from "../../../src/core/entities/uniformLoad";
import { TrapezoidalLoad } from "../../../src/core/entities/trapezoidalLoad";
import { PointLoadOnSpan } from "../../../src/core/entities/pointLoadOnSpan";
import { ThermalLoad } from "../../../src/core/entities/thermalLoad";

describe("loads", () => {
  const model = new Model();

  const nodeA = new Node(model, { coords: { x: 0, z: 0 } });
  const nodeB = new Node(model, { coords: { x: 3, z: 4 } });
  model.setNodes(
    new Map<string, Node>([
      [nodeA.id, nodeA],
      [nodeB.id, nodeB],
    ])
  );

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

  const element = new Element(model, {
    id: "element-load",
    nodeIDs: [nodeA.id, nodeB.id],
    materialID: material.id,
    crossectionID: crossection.id,
  });
  model.elements.set(element.id, element);

  const loadCase = new LoadCase(model, {
    name: "Dead",
    type: LoadCaseType.Dead,
    selfWeight: false,
  });
  model.loadCases.set(loadCase.id, loadCase);

  // L = 5, local x along (0,0)->(3,4)

  describe("LoadCase", () => {
    it("stores fields and round-trips through toData", () => {
      expect(loadCase.id).toBeDefined();
      expect(loadCase.name).toBe("Dead");
      expect(loadCase.type).toBe(LoadCaseType.Dead);
      expect(loadCase.selfWeight).toBe(false);
      expect(loadCase.toData()).toEqual({
        id: loadCase.id,
        name: "Dead",
        type: LoadCaseType.Dead,
        selfWeight: false,
      });
    });

    it("marks dirty on setter and propagates to model", () => {
      const lc = new LoadCase(model, {
        name: "Live",
        type: LoadCaseType.Live,
        selfWeight: false,
      });
      expect(lc.dirty).toBe(false);
      model.dirty = false;
      lc.type = LoadCaseType.Wind;
      expect(lc.dirty).toBe(true);
      expect(model.dirty).toBe(true);
      lc.cleanDirty();
      expect(lc.dirty).toBe(false);
    });
  });

  describe("NodalLoad", () => {
    it("stores fields and round-trips through toData", () => {
      const load = new NodalLoad(model, {
        nodeID: nodeA.id,
        loadCaseID: loadCase.id,
        Fx: 100,
        Fy: -50,
        Mz: 25,
      });
      expect(load.nodeID).toBe(nodeA.id);
      expect(load.loadCaseID).toBe(loadCase.id);
      expect(load.toData()).toEqual({
        id: load.id,
        nodeID: nodeA.id,
        loadCaseID: loadCase.id,
        Fx: 100,
        Fy: -50,
        Mz: 25,
      });
    });

    it("marks dirty on setter and propagates to model", () => {
      const load = new NodalLoad(model, {
        nodeID: nodeA.id,
        loadCaseID: loadCase.id,
        Fx: 0,
        Fy: 0,
        Mz: 0,
      });
      model.dirty = false;
      load.Fy = 42;
      expect(load.dirty).toBe(true);
      expect(model.dirty).toBe(true);
      expect(load.Fy).toBe(42);
      load.cleanDirty();
      expect(load.dirty).toBe(false);
    });
  });

  describe("UniformLoad", () => {
    // qx=2, qy=3, L=5
    const load = new UniformLoad(model, {
      elementID: element.id,
      loadCaseID: loadCase.id,
      qx: 2,
      qy: 3,
    });

    it("computes equivalent nodal forces for rigid element", () => {
      const f = load.getEquivalentNodalForces();
      expect(Array.from(f)).toEqual([
        5, // qx*L/2
        7.5, // qy*L/2
        6.25, // qy*L^2/12
        5,
        7.5,
        -6.25,
      ]);
    });

    it("computes internal forces along the span", () => {
      const atStart = load.getInternalForceContribution(0);
      expect(atStart.N).toBeCloseTo(5);
      expect(atStart.V).toBeCloseTo(7.5);
      expect(atStart.M).toBeCloseTo(6.25);

      const mid = load.getInternalForceContribution(2.5);
      expect(mid.N).toBeCloseTo(5 - 2 * 2.5);
      expect(mid.V).toBeCloseTo(7.5 - 3 * 2.5);
      expect(mid.M).toBeCloseTo(6.25 + 7.5 * 2.5 - (3 * 2.5 * 2.5) / 2);

      const atEnd = load.getInternalForceContribution(5);
      expect(atEnd.N).toBeCloseTo(5 - 2 * 5);
      expect(atEnd.V).toBeCloseTo(7.5 - 3 * 5);
      expect(atEnd.M).toBeCloseTo(6.25 + 7.5 * 5 - (3 * 25) / 2);
    });

    it("condenses nodal forces with hinge at node 1", () => {
      const hinged = new Element(model, {
        id: "element-hinge-uniform",
        nodeIDs: [nodeA.id, nodeB.id],
        materialID: material.id,
        crossectionID: crossection.id,
        hinges: [true, false],
      });
      model.elements.set(hinged.id, hinged);
      const hLoad = new UniformLoad(model, {
        elementID: hinged.id,
        loadCaseID: loadCase.id,
        qx: 0,
        qy: 3,
      });
      const f = hLoad.getEquivalentNodalForces();
      // propped cantilever: V1 = 3qL/8, V2 = 5qL/8, M2 = -qL^2/8
      expect(f[0]).toBeCloseTo(0);
      expect(f[1]).toBeCloseTo((3 * 3 * 5) / 8);
      expect(f[2]).toBeCloseTo(0);
      expect(f[4]).toBeCloseTo((5 * 3 * 5) / 8);
      expect(f[5]).toBeCloseTo(-(3 * 25) / 8);
    });

    it("round-trips through toData and marks dirty", () => {
      expect(load.toData()).toEqual({
        id: load.id,
        elementID: element.id,
        loadCaseID: loadCase.id,
        qx: 2,
        qy: 3,
      });
      model.dirty = false;
      load.qy = 5;
      expect(load.dirty).toBe(true);
      expect(model.dirty).toBe(true);
      expect(load.qy).toBe(5);
      load.cleanDirty();
      expect(load.dirty).toBe(false);
    });
  });

  describe("TrapezoidalLoad", () => {
    it("computes equivalent nodal forces for triangular transverse load", () => {
      // q1y=0, q2y=4, L=5: resultant = 10
      const load = new TrapezoidalLoad(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        q1x: 0,
        q1y: 0,
        q2x: 0,
        q2y: 4,
      });
      const f = load.getEquivalentNodalForces();
      expect(f[0]).toBeCloseTo(0);
      expect(f[1]).toBeCloseTo((4 * 5 * 3) / 20); // q2*L*3/20
      expect(f[2]).toBeCloseTo((4 * 25) / 30); // q2*L^2/30
      expect(f[4]).toBeCloseTo((4 * 5 * 7) / 20); // q2*L*7/20
      expect(f[5]).toBeCloseTo(-(4 * 25) / 20); // -q2*L^2/20
      expect(f[1]! + f[4]!).toBeCloseTo(10); // resultant
    });

    it("reduces to uniform load when q1 == q2", () => {
      const trapez = new TrapezoidalLoad(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        q1x: 2,
        q1y: 3,
        q2x: 2,
        q2y: 3,
      });
      const uniform = new UniformLoad(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        qx: 2,
        qy: 3,
      });
      expect(Array.from(trapez.getEquivalentNodalForces())).toEqual(
        Array.from(uniform.getEquivalentNodalForces())
      );
    });

    it("computes internal forces consistently", () => {
      const load = new TrapezoidalLoad(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        q1x: 0,
        q1y: 0,
        q2x: 0,
        q2y: 4,
      });
      // at x=0: V1 = 3, M1 = 10/3 (from equivalent force solution)
      const start = load.getInternalForceContribution(0);
      expect(start.V).toBeCloseTo(3);
      expect(start.M).toBeCloseTo(10 / 3);
      // equilibrium at x=L: V = V1 - resultant = 3 - 10 = -7, N = 0
      const end = load.getInternalForceContribution(5);
      expect(end.V).toBeCloseTo(-7);
      expect(end.N).toBeCloseTo(0);
    });
  });

  describe("PointLoadOnSpan", () => {
    it("computes equivalent nodal forces for centered transverse point load", () => {
      const load = new PointLoadOnSpan(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        position: 0.5,
        Fx: 0,
        Fy: 10,
        Mz: 0,
      });
      const f = load.getEquivalentNodalForces();
      expect(f[0]).toBeCloseTo(0);
      expect(f[1]).toBeCloseTo(5); // Fy/2
      expect(f[4]).toBeCloseTo(5); // Fy/2
      expect(f[2]).toBeCloseTo(6.25); // Fy*L/8
      expect(f[5]).toBeCloseTo(-6.25);
      expect(f[1]! + f[4]!).toBeCloseTo(10);
    });

    it("computes equivalent nodal forces for a centered point couple", () => {
      const load = new PointLoadOnSpan(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        position: 0.5,
        Fx: 0,
        Fy: 0,
        Mz: 10,
      });
      const f = load.getEquivalentNodalForces();
      expect(f[1]).toBeCloseTo(-3);
      expect(f[2]).toBeCloseTo(-2.5);
      expect(f[4]).toBeCloseTo(3);
      expect(f[5]).toBeCloseTo(-2.5);
    });

    it("applies step in internal forces at the load position", () => {
      const load = new PointLoadOnSpan(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        position: 0.4,
        Fx: 4,
        Fy: 10,
        Mz: 0,
      });
      const before = load.getInternalForceContribution(1); // a = 2
      const after = load.getInternalForceContribution(3); // > a
      expect(before.V - after.V).toBeCloseTo(10);
      expect(before.N - after.N).toBeCloseTo(4);
    });

    it("applies a moment jump but no shear/axial jump at a point couple", () => {
      const load = new PointLoadOnSpan(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        position: 0.5,
        Fx: 0,
        Fy: 0,
        Mz: 10,
      });
      const a = 0.5 * element.length;
      const before = load.getInternalForceContribution(a - 1e-9);
      const after = load.getInternalForceContribution(a);
      // a concentrated couple applies a moment discontinuity of magnitude Mz...
      expect(before.M - after.M).toBeCloseTo(10);
      // ...but leaves the shear and axial force continuous
      expect(after.V).toBeCloseTo(before.V);
      expect(after.N).toBeCloseTo(before.N);
    });

    it("round-trips through toData", () => {
      const load = new PointLoadOnSpan(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        position: 0.5,
        Fx: 1,
        Fy: 2,
        Mz: 3,
      });
      expect(load.toData()).toEqual({
        id: load.id,
        elementID: element.id,
        loadCaseID: loadCase.id,
        position: 0.5,
        Fx: 1,
        Fy: 2,
        Mz: 3,
      });
    });
  });

  describe("ThermalLoad", () => {
    it("computes equivalent nodal forces", () => {
      const load = new ThermalLoad(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        deltaT: 100,
        deltaTGradient: 10,
      });
      const fAxial = 210e9 * 0.01 * 1.2e-5 * 100;
      const fMoment = 210e9 * 8.333e-6 * 1.2e-5 * 10;
      const f = load.getEquivalentNodalForces();
      expect(f[0]).toBeCloseTo(-fAxial);
      expect(f[1]).toBeCloseTo(0);
      expect(f[2]).toBeCloseTo(-fMoment);
      expect(f[3]).toBeCloseTo(fAxial);
      expect(f[4]).toBeCloseTo(0);
      expect(f[5]).toBeCloseTo(fMoment);
    });

    it("computes constant internal forces along the span", () => {
      const load = new ThermalLoad(model, {
        elementID: element.id,
        loadCaseID: loadCase.id,
        deltaT: 100,
        deltaTGradient: 10,
      });
      const fAxial = 210e9 * 0.01 * 1.2e-5 * 100;
      const fMoment = 210e9 * 8.333e-6 * 1.2e-5 * 10;
      const start = load.getInternalForceContribution(0);
      const end = load.getInternalForceContribution(5);
      expect(start.N).toBeCloseTo(-fAxial);
      expect(end.N).toBeCloseTo(-fAxial);
      expect(start.M).toBeCloseTo(-fMoment);
      expect(end.M).toBeCloseTo(-fMoment);
    });
  });
});
