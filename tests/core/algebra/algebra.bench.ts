import { describe, bench } from "vitest";

import * as ln from "@algebra";
import * as mathjs from "mathjs";

//all array of arrays
const matrixArray = [
  [1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30],
  [31, 32, 33, 34, 35, 36],
];

const vectorArray = [1, 2, 3, 4, 5, 6];

const matrixAln = new ln.Matrix(6, 6, matrixArray.flat());
const matrixMathjs = mathjs.matrix(matrixArray);

const vectorAln = new ln.Vector(6, vectorArray);
const vectorMathjs = mathjs.matrix(vectorArray);

describe("Matrix class", () => {
  bench("custom algebra", () => {
    const mappingMatrix = ln.Matrix.identity(6).setAt(3, 2, 2);
    const mat = mappingMatrix.transpose().multiply(matrixAln);
    const result = mat.vecMult(vectorAln);
  });

  bench("mathjs", () => {
    const mappingMatrix = mathjs.identity(6) as mathjs.Matrix;
    mappingMatrix.set([3, 2], 2);

    const mat = mathjs.multiply(mathjs.transpose(mappingMatrix), matrixMathjs);
    const result = mathjs.multiply(mat, vectorMathjs);
  });
});
