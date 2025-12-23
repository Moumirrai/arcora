import { describe, it, expect } from "vitest";

import { circleArea } from "../src/example";

describe("circleArea", () => {
    it("calculates the area of a circle given a positive radius", () => {
        expect(circleArea(1)).toBeCloseTo(Math.PI);
        expect(circleArea(2)).toBeCloseTo(4 * Math.PI);
        expect(circleArea(0)).toBeCloseTo(0);
    });

    it("throws an error for negative radius", () => {
        expect(() => circleArea(-1)).toThrow("Radius cannot be negative");
    });
});