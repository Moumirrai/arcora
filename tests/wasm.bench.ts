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
} from "wasm";

// ── Generator ──────────────────────────────────────────────────────────────

const N = 20; // matrix size — change to 500, 1000, 2000 etc.
const B_COUNT = 5; // number of pre-generated RHS vectors
const BANDWIDTH = 4; // sparsity: each row connects to ±BANDWIDTH neighbors

type Triplet = [number, number, number];

function generateBandedSPD(
  n: number,
  bandwidth: number
): {
  triplets: Triplet[];
  mjsMatrix: Matrix;
} {
  const triplets: Triplet[] = [];
  // Build dense first to accumulate correctly
  const dense: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    let diag = 0;
    for (let k = 1; k <= bandwidth; k++) {
      if (i + k < n) {
        dense[i]![i + k] = -1;
        dense[i + k]![i] = -1;
        diag += 2;
      }
    }
    dense[i]![i] = diag + 1;
  }

  // Extract triplets from dense for WASM
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = dense[i]![j]!;
      if (v !== 0) triplets.push([i, j, v]);
    }
  }

  const mjsMatrix = math.sparse(dense) as Matrix;

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
systemSolve(handle, true, true, true);

// math.js: pre-build matrix once, lusolve re-factorizes each call
const mjsRhs = rhsVectors.map((v) => Array.from(v));

// ── Benchmarks ─────────────────────────────────────────────────────────────

let idx = 0;

describe(`Sparse solve n=${N}`, () => {
  bench("WASM Cholesky (f_dirty only)", () => {
    const b = new Float64Array(memory.buffer, systemBPtr(handle), N);
    b.set(rhsVectors[idx % B_COUNT]!);
    systemSolve(handle, false, false, true);
    idx++;
  });

  bench("math.js lusolve (sparse)", () => {
    math.lusolve(mjsMatrix, mjsRhs[idx % B_COUNT]!);
    idx++;
  });
});
