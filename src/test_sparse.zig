const std = @import("std");
const csparse = @import("interop/csparse.zig");
const debug = @import("debug.zig");
const demo = @import("csparse_demo.zig");

fn createDemoMatrix() csparse.Error!*csparse.cs {
    const T = try csparse.spalloc(3, 3, 4, 1, 1);
    defer csparse.spfree(T);

    try csparse.entry(T, 0, 0, 4.0);
    try csparse.entry(T, 1, 1, 2.0);
    try csparse.entry(T, 1, 2, 1.0);
    try csparse.entry(T, 2, 2, 3.0);

    return csparse.compress(T);
}

pub fn solveDemoAxEqB(allocator: std.mem.Allocator) ![]f64 {
    const T = try csparse.spalloc(3, 3, 7, 1, 1);
    defer csparse.spfree(T); //free memory of T

    try csparse.entry(T, 0, 0, 4.0); //insert 4 to
    try csparse.entry(T, 0, 1, 1.0);
    try csparse.entry(T, 1, 0, 1.0);
    try csparse.entry(T, 1, 1, 3.0);
    try csparse.entry(T, 1, 2, 1.0);
    try csparse.entry(T, 2, 1, 1.0);
    try csparse.entry(T, 2, 2, 2.0);

    const A = try csparse.compress(T);
    defer csparse.spfree(A); //free memory of A

    const x = try allocator.dupe(f64, &[_]f64{ 6.0, 10.0, 8.0 });
    errdefer allocator.free(x);

    try csparse.cholsol(1, A, &x[0]); // modify x in-place to solve Ax=b
    return x;
}

// ---------------------------------------------------------
// Native Zig Tests
// ---------------------------------------------------------

test "csparse self-test runs natively" {
    const result = demo.csparse_self_test();
    try std.testing.expectEqual(@as(i32, 42), result);
}

// test "dense conversion is correct" {
//     const A = try createDemoMatrix();
//     defer csparse.spfree(A);

//     const dense = try csparse.toDense(std.testing.allocator, A);
//     defer std.testing.allocator.free(dense);

//     try std.testing.expectEqual(@as(usize, 9), dense.len);
//     try std.testing.expectEqual(@as(f64, 4.0), dense[0 * 3 + 0]);
//     try std.testing.expectEqual(@as(f64, 2.0), dense[1 * 3 + 1]);
//     try std.testing.expectEqual(@as(f64, 1.0), dense[1 * 3 + 2]);
//     try std.testing.expectEqual(@as(f64, 3.0), dense[2 * 3 + 2]);
//     try std.testing.expectEqual(@as(f64, 0.0), dense[0 * 3 + 1]);
//     try std.testing.expectEqual(@as(f64, 0.0), dense[0 * 3 + 2]);

//     std.debug.print("dense 3x3 demo matrix\n", .{});
//     debug.printDense(3, 3, dense);
// }

test "solve Ax=b returns expected x" {
    const x = try solveDemoAxEqB(std.testing.allocator);
    defer std.testing.allocator.free(x);

    try std.testing.expectEqual(@as(usize, 3), x.len);
    try std.testing.expectApproxEqAbs(@as(f64, 1.0), x[0], 1e-9);
    try std.testing.expectApproxEqAbs(@as(f64, 2.0), x[1], 1e-9);
    try std.testing.expectApproxEqAbs(@as(f64, 3.0), x[2], 1e-9);
}
