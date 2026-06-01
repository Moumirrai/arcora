export function area(b: number, h: number): number {
  const A: number = b * h;
  return A;
}

export function Iy(b: number, h: number): number {
  const I: number = 1/12 * b * h ** 3;
  return I;
}

