import { describe, it, expect } from "vitest";
import { SparseSolver } from "@arcora/core/solver/SparseSolver";

let solver: SparseSolver;

describe("SparseSolver", () => {
  it("should create a SparseSolver instance", () => {
    solver = new SparseSolver(4, 10);
    expect(solver).toBeInstanceOf(SparseSolver);
  });

  it("should set triplets and solve the system", () => {
    const rows = new Int32Array([0, 0, 1, 1, 1, 2, 2, 2, 3, 3]);
    const cols = new Int32Array([0, 1, 0, 1, 2, 1, 2, 3, 2, 3]);
    const vals = new Float64Array([4, 1, 1, 4, 1, 1, 4, 1, 1, 4]);
    const b = new Float64Array([1, 1, 1, 1]);

    solver.setTriplets(rows, cols, vals);
    solver.setB(b);
    solver.solve();

    const x = solver.x;
    expect(x.length).toBe(4);
    console.log("Solution x:", x);
  });

  it("should resize the solver and solve again", () => {
    solver.resize(5, 15);
    const rows = new Int32Array([0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4]);
    const cols = new Int32Array([0, 1, 0, 1, 2, 1, 2, 3, 2, 3, 4]);
    const vals = new Float64Array([4, 1, 1, 4, 1, 1, 4, 1, 1, 4, 5]);
    const b = new Float64Array([1, 1, 1, 1, 1]);

    solver.setTriplets(rows, cols, vals);
    solver.setB(b);
    solver.solve();

    const x = solver.x;
    expect(x.length).toBe(5);
    console.log("Solution x after resize:", x);
  });

  it("should destroy the solver", () => {
    solver.destroy();
    expect(() => solver.solve()).toThrow();
  });
});
