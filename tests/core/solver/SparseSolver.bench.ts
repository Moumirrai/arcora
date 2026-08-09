import { describe, bench } from "vitest";
import { SparseSolver } from "@arcora/core/solver/SparseSolver";

// ── Generator ──────────────────────────────────────────────────────────────

const N = 50; // matrix size
const B_COUNT = 5; // number of pregenerated vectors
const BANDWIDTH = 6; // sparsity

type Triplet = [number, number, number];

function generateBandedSPD(
  n: number,
  bandwidth: number
): {
  triplets: Triplet[];
  rows: Int32Array;
  cols: Int32Array;
  vals: Float64Array;
} {
  const dense: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    dense[i]![i] = 1;
  }

  for (let i = 0; i < n; i++) {
    for (let k = 1; k <= bandwidth; k++) {
      const j = i + k;
      if (j < n) {
        dense[i]![j] = -1;
        dense[j]![i] = -1;
        dense[i]![i]! += 1;
        dense[j]![j]! += 1;
      }
    }
  }

  const triplets: Triplet[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = dense[i]![j]!;
      if (v !== 0) triplets.push([i, j, v]);
    }
  }

  const rows = new Int32Array(triplets.length);
  const cols = new Int32Array(triplets.length);
  const vals = new Float64Array(triplets.length);
  triplets.forEach(([r, c, v], i) => {
    rows[i] = r;
    cols[i] = c;
    vals[i] = v;
  });

  return {
    triplets,
    rows,
    cols,
    vals,
  };
}

function generateRhsVectors(n: number, count: number): Float64Array[] {
  return Array.from({ length: count }, () => {
    const v = new Float64Array(n);
    for (let i = 0; i < n; i++) v[i] = Math.random() * 10;
    return v;
  });
}

// ── Setup (runs BEFORE benchmarks) ────────────────────────────────────────

const { rows, cols, vals } = generateBandedSPD(N, BANDWIDTH);
const rhsVectors = generateRhsVectors(N, B_COUNT);

const solver = new SparseSolver(N, rows.length);
solver.setTriplets(rows, cols, vals);
solver.setB(rhsVectors[0]!);
solver.solve();


// ── Benchmarks ─────────────────────────────────────────────────────────────

let idx = 0;

describe(`SparseSolver solve n=${N}`, () => {
  bench("SparseSolver (f_dirty only)", () => {
    solver.setB(rhsVectors[idx % B_COUNT]!);
    solver.solve(false);
    idx++;
  });

  bench("SparseSolver (full K rebuild)", () => {
    solver.setTriplets(rows, cols, vals);
    solver.setB(rhsVectors[idx % B_COUNT]!);
    solver.solve();
    idx++;
  });
});
