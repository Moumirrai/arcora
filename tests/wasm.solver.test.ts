import { describe, it, expect } from "vitest";
import * as math from "mathjs";
import {
  systemCreate,
  systemDestroy,
  systemRowsPtr,
  systemColsPtr,
  systemValsPtr,
  systemBPtr,
  systemXPtr,
  systemSetNnz,
  systemSolve,
  memory,
} from "@arcora/wasm";

type Triplet = [number, number, number];

function generateBandedSPD(
  n: number,
  bandwidth: number
): {
  triplets: Triplet[];
  mjsMatrix: math.Matrix;
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

  return {
    triplets,
    mjsMatrix: math.sparse(dense) as math.Matrix,
  };
}

function solveWithMathJs(matrix: math.Matrix, rhs: Float64Array): number[] {
  const rhsColumn = math.matrix(Array.from(rhs, (v) => [v]));
  const x = math.lusolve(matrix, rhsColumn) as
    | math.Matrix
    | number[]
    | number[][];

  const raw =
    typeof (x as math.Matrix).toArray === "function"
      ? ((x as math.Matrix).toArray() as number[] | number[][])
      : x;

  if (!Array.isArray(raw)) {
    throw new Error("math.lusolve returned unexpected result type");
  }

  if (raw.length === 0) return [];

  if (Array.isArray(raw[0])) {
    return (raw as number[][]).map((r) => r[0]!);
  }

  return raw as number[];
}

describe("WASM sparse solver correctness", () => {
  it("matches math.js lusolve across multiple RHS vectors", () => {
    const N = 30;
    const BANDWIDTH = 4;
    const RHS_COUNT = 6;

    const { triplets, mjsMatrix } = generateBandedSPD(N, BANDWIDTH);

    const rhsVectors = Array.from({ length: RHS_COUNT }, (_, r) => {
      const v = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        v[i] = Math.sin((i + 1) * (r + 1) * 0.123) + Math.cos((i + 3) * 0.37);
      }
      return v;
    });

    const handle = systemCreate(N, triplets.length);
    expect(handle).toBeGreaterThanOrEqual(0);

    try {
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

      triplets.forEach(([r, c, v], i) => {
        rows[i] = r;
        cols[i] = c;
        vals[i] = v;
      });

      expect(systemSetNnz(handle, triplets.length)).toBeTruthy();

      const absTol = 1e-8;
      const relTol = 1e-7;

      rhsVectors.forEach((rhs, i) => {
        const b = new Float64Array(memory.buffer, systemBPtr(handle), N);
        b.set(rhs);

        const success = systemSolve(handle, i === 0, true, true);
        expect(success).toBeTruthy();

        const x = new Float64Array(memory.buffer, systemXPtr(handle), N);
        const xMath = solveWithMathJs(mjsMatrix, rhs);

        for (let j = 0; j < N; j++) {
          const a = x[j]!;
          const bVal = xMath[j]!;

          if (!Number.isFinite(a) || !Number.isFinite(bVal)) {
            throw new Error(
              `Non-finite value at rhs=${i}, idx=${j}: wasm=${a}, mathjs=${bVal}, xMath.length=${xMath.length}`
            );
          }

          const diff = Math.abs(a - bVal);
          const scale = Math.max(1, Math.abs(a), Math.abs(bVal));
          expect(diff).toBeLessThanOrEqual(absTol + relTol * scale);
        }
      });
    } finally {
      expect(systemDestroy(handle)).toBeTruthy();
    }
  });
});
