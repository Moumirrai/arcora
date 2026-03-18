import { describe, it, expect } from "vitest";
import { add } from "../../lib/index";

describe("add", () => {
    it("adds two positive numbers", () => {
        expect(add(3, 4.8)).toBe(7);
    });

    it("adds negative numbers", () => {
        expect(add(-3, -4)).toBe(-7);
    });

    it("adds zero", () => {
        expect(add(0, 5)).toBe(5);
    });
});