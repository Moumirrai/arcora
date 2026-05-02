import { describe, bench } from "vitest";

import * as ln from "@algebra";
import * as mathjs from "mathjs";

describe("Matrix class", () => {
  bench("custom linalg", () => {
    const matrixA = new ln.Matrix(6, 6, [
      [4, 2, 3, 1, 5, 6],
      [1, 5, 6, 4, 2, 3],
      [6, 4, 2, 3, 1, 5],
      [3, 1, 5, 6, 4, 2],
      [2, 3, 1, 5, 6, 4],
      [5, 6, 4, 2, 3, 1],
    ]);

    const matrixB = new ln.Matrix(6, 6);

    matrixB.setAt(0, 2, 8).setAt(1, 4, 7);

    const matrixC = matrixA.add(matrixB);
    const matrixD = matrixA.multiply(matrixC);
    matrixD.transpose();
  });

  bench("mathjs linalg", () => {
    const matrixA = mathjs.matrix([
      [4, 2, 3, 1, 5, 6],
      [1, 5, 6, 4, 2, 3],
      [6, 4, 2, 3, 1, 5],
      [3, 1, 5, 6, 4, 2],
      [2, 3, 1, 5, 6, 4],
      [5, 6, 4, 2, 3, 1],
    ]);

    let matrixB = mathjs.matrix(mathjs.zeros(6, 6));

    matrixB = mathjs.subset(matrixB, mathjs.index(0, 2), 8);

    matrixB = mathjs.subset(matrixB, mathjs.index(1, 4), 7);

    const matrixC = mathjs.add(matrixA, matrixB);

    const matrixD = mathjs.multiply(matrixA, matrixC);

    mathjs.transpose(matrixD);
  });
});

/* describe("Matrix - value access", () => {
  const testingMatrix: ln.Matrix = new ln.Matrix(6, 6, [
    [4, 2, 3, 1, 5, 6],
    [1, 5, 6, 4, 2, 3],
    [6, 4, 2, 3, 1, 5],
    [3, 1, 5, 6, 4, 2],
    [2, 3, 1, 5, 6, 4],
    [5, 6, 4, 2, 3, 1],
  ]);

  bench("get value at index with safe helper method", () => {
    const row1col4 = testingMatrix.at(0, 3);
    const row2col5 = testingMatrix.at(1, 4);
    const row3col6 = testingMatrix.at(2, 5);
  });

  bench("get value at from raw data", () => {
    const row1col4 = testingMatrix.data[0 * 6 + 3];
    const row2col5 = testingMatrix.data[1 * 6 + 4];
    const row3col6 = testingMatrix.data[2 * 6 + 5];
  });
}); */
