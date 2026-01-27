import {
  identity,
  multiply,
  transpose,
  Matrix,
  matrix,
  random,
  lusolve,
} from "mathjs";

function circleArea(radius: number): number {
  if (radius < 0) {
    throw new Error("Radius cannot be negative");
  }
  return Math.PI * radius * radius;
}

function test(size: number) {
  const a = identity(size, size, "sparse") as Matrix;

  // add 100 random numbers to random positions (only lower triangular for lsolve optimization)
  for (let k = 0; k < size; k++) {
    const i = Math.floor(Math.random() * size);
    const j = Math.floor(Math.random() * size);
    const value = random();
    a.set([i, j], value);
  }

  const d = transpose(a);
  // create random vector
  const v = matrix(random([size, 1]));
  const b = multiply(d, v);
  // solve d * X = b
  const X = lusolve(d, b);

  //log x to verify

  return X;
}

export { circleArea, test };
