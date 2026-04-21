const std = @import("std");
const csparse = @import("interop/csparse.zig");

pub fn printVector(values: []const f64) void {
    std.debug.print("[", .{});
    for (values, 0..) |value, idx| {
        if (idx != 0) std.debug.print(", ", .{});
        std.debug.print("{d:.6}", .{value});
    }
    std.debug.print("]\n", .{});
}

pub fn printDense(rows: usize, cols: usize, dense: []const f64) void {
    if (rows * cols != dense.len) {
        std.debug.print("invalid dense shape: rows={d} cols={d} len={d}\n", .{ rows, cols, dense.len });
        return;
    }

    var i: usize = 0;
    while (i < rows) : (i += 1) {
        var j: usize = 0;
        while (j < cols) : (j += 1) {
            std.debug.print("{d:>9.4}", .{dense[i * cols + j]});
        }
        std.debug.print("\n", .{});
    }
}

pub fn printSparseAsDense(allocator: std.mem.Allocator, A: *const csparse.cs) !void {
    const dense = try csparse.toDense(allocator, A);
    defer allocator.free(dense);
    const rows: usize = @intCast(A.m);
    const cols: usize = @intCast(A.n);
    printDense(rows, cols, dense);
}
