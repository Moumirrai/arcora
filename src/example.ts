function circleArea(radius: number): number {
  if (radius < 0) {
    throw new Error('Radius cannot be negative');
  }
  return Math.PI * radius * radius;
}

export { circleArea };
