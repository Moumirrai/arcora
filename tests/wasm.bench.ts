import { describe, bench } from "vitest";
import * as math from "mathjs";
import {
  systemCreate,
  systemRowsPtr,
  systemColsPtr,
  systemValsPtr,
  systemBPtr,
  systemXPtr,
  systemSetNnz,
  systemSolve,
  memory,
} from "@arcora/wasm";

// ── Generator ──────────────────────────────────────────────────────────────

const N = 500; // matrix size — change to 500, 1000, 2000 etc.
const B_COUNT = 5; // number of pre-generated RHS vectors
const BANDWIDTH = 6; // sparsity: each row connects to ±BANDWIDTH neighbors

type Triplet = [number, number, number];

function generateBandedSPD(
  n: number,
  bandwidth: number
): {
  triplets: Triplet[];
  mjsMatrix: math.Matrix;
} {
  const triplets: Triplet[] = [];
  // Build dense first to accumulate correctly
  const dense: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  // Start from identity-like shift to keep matrix strictly positive on diagonal
  for (let i = 0; i < n; i++) {
    dense[i]![i] = 1;
  }

  // Add symmetric band edges and increase both endpoint diagonals.
  // This keeps A symmetric and diagonally dominant (SPD for this construction).
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

  // Extract triplets from dense for WASM
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = dense[i]![j]!;
      if (v !== 0) triplets.push([i, j, v]);
    }
  }

  const mjsMatrix = math.sparse(dense) as math.Matrix;

  return { triplets, mjsMatrix };
}

function generateRhsVectors(n: number, count: number): Float64Array[] {
  return Array.from({ length: count }, () => {
    const v = new Float64Array(n);
    for (let i = 0; i < n; i++) v[i] = Math.random() * 10;
    return v;
  });
}

// ── Setup (runs BEFORE benchmarks) ────────────────────────────────────────

const { triplets, mjsMatrix } = generateBandedSPD(N, BANDWIDTH);
const rhsVectors = generateRhsVectors(N, B_COUNT);

// WASM setup
const handle = systemCreate(N, triplets.length);
const rows = new Int32Array(
  memory.buffer,
  systemRowsPtr(handle),
  triplets.length
);
const cols = new Int32Array(
  memory.buffer,
  systemColsPtr(handle),
  triplets.length
);
const vals = new Float64Array(
  memory.buffer,
  systemValsPtr(handle),
  triplets.length
);

systemSetNnz(handle, triplets.length);
triplets.forEach(([r, c, v], i) => {
  rows[i] = r;
  cols[i] = c;
  vals[i] = v;
});

// First solve to factorize K (shape+k dirty)
const b0 = new Float64Array(memory.buffer, systemBPtr(handle), N);
b0.set(rhsVectors[0]!);
systemSolve(handle, true, true);

// math.js: pre-build matrix once, lusolve re-factorizes each call
const mjsRhs = rhsVectors.map((v) => Array.from(v));

// ── Benchmarks ─────────────────────────────────────────────────────────────

let idx = 0;

describe(`Sparse solve n=${N}`, () => {
  bench("WASM Cholesky (f_dirty only)", () => {
    const b = new Float64Array(memory.buffer, systemBPtr(handle), N);
    b.set(rhsVectors[idx % B_COUNT]!);
    systemSolve(handle, false, true);
    idx++;
  });

  bench("math.js lusolve (sparse)", () => {
    math.lusolve(mjsMatrix, mjsRhs[idx % B_COUNT]!);
    idx++;
  });
});
