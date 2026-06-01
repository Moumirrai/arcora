import { area, Iy } from "@arcora/cross_section_module/zk";
import { describe, it, expect } from "vitest";

describe("cross_zk", () => {
    it("calculate an area", () => {
        const A = area(12, 2)
        expect(A).toBe(24)
    });
    it("calculate an moment of inertia", () => {
        const I = Iy(12, 2)
        expect(I).toBe(8)
    });
});

