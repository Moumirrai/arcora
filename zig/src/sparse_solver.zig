const std = @import("std");
const csparse = @import("interop/csparse.zig");

const builtin = @import("builtin");
const allocator = if (builtin.target.cpu.arch == .wasm32) std.heap.wasm_allocator else std.heap.page_allocator;
const max_systems = 128;

const SparseSystem = struct {
    n: u32, // shape (number of dofs)
    capacity: u32, // maximal preallocated number of non zero values
    nnz: u32, // number of non zero values

    rows: []i32,
    cols: []i32,
    vals: []f64,
    b: []f64,
    x: []f64,

    k_matrix: ?*csparse.cs = null,
    S: ?*csparse.css = null, // symbolic factorization
    N: ?*csparse.csn = null, // numeric factorization

    shape_dirty: bool = true,
};

var systems: [max_systems]?*SparseSystem = @splat(null);

// PUBLIC WASM API

export fn system_create(n: u32, capacity: u32) i32 {
    const sys = allocSystem(n, capacity) catch return -1;

    for (systems, 0..) |slot, i| {
        if (slot == null) {
            systems[i] = sys;
            return @intCast(i);
        }
    }

    freeSystemMemory(sys);
    return -1;
}

export fn system_resize(handle: i32, new_n: u32, new_capacity: u32) bool {
    const sys = getSystem(handle) orelse return false;

    if (new_n == sys.n and new_capacity == sys.capacity) return true;

    if (new_n != sys.n) {
        sys.b = resizeBuffer(f64, sys.b, new_n) catch return false;
        sys.x = resizeBuffer(f64, sys.x, new_n) catch return false;
        sys.n = new_n;
    }

    if (new_capacity != sys.capacity) {
        sys.rows = resizeBuffer(i32, sys.rows, new_capacity) catch return false;
        sys.cols = resizeBuffer(i32, sys.cols, new_capacity) catch return false;
        sys.vals = resizeBuffer(f64, sys.vals, new_capacity) catch return false;
        sys.capacity = new_capacity;
    }

    sys.nnz = 0;
    sys.shape_dirty = true;

    freeCSparseData(sys);

    return true;
}

export fn system_solve(handle: i32, k_dirty: bool, f_dirty: bool) bool {
    const sys = getSystem(handle) orelse return false;

    const _shape_dirty = sys.shape_dirty;
    const _k_dirty = _shape_dirty or k_dirty;
    const _f_dirty = _k_dirty or f_dirty;

    if (_k_dirty) {
        buildK(sys) catch return false;

        if (_shape_dirty) {
            ensureSymbolic(sys) catch return false;
            sys.shape_dirty = false;
        }

        refactorNumeric(sys) catch return false;
    }

    if (_f_dirty) {
        solveWithFactors(sys) catch return false;
    }

    return true;
}

export fn system_set_nnz(handle: i32, nnz: u32) bool {
    const sys = getSystem(handle) orelse return false;
    if (nnz > sys.capacity) return false;

    if (nnz != sys.nnz) {
        sys.nnz = nnz;
        sys.shape_dirty = true;
    }

    return true;
}

export fn system_destroy(handle: i32) bool {
    const sys = getSystem(handle) orelse return false;
    const idx: usize = @intCast(handle);

    freeCSparseData(sys);
    freeSystemMemory(sys);

    systems[idx] = null;
    return true;
}

export fn system_rows_ptr(handle: i32) usize {
    const sys = getSystem(handle) orelse return 0;
    return @intCast(@intFromPtr(sys.rows.ptr));
}

export fn system_cols_ptr(handle: i32) usize {
    const sys = getSystem(handle) orelse return 0;
    return @intCast(@intFromPtr(sys.cols.ptr));
}

export fn system_vals_ptr(handle: i32) usize {
    const sys = getSystem(handle) orelse return 0;
    return @intCast(@intFromPtr(sys.vals.ptr));
}

export fn system_b_ptr(handle: i32) usize {
    const sys = getSystem(handle) orelse return 0;
    return @intCast(@intFromPtr(sys.b.ptr));
}

export fn system_x_ptr(handle: i32) usize {
    const sys = getSystem(handle) orelse return 0;
    return @intCast(@intFromPtr(sys.x.ptr));
}

// INTERNAL FUNCTIONS

fn getSystem(handle: i32) ?*SparseSystem {
    if (handle < 0 or handle >= max_systems) return null;
    return systems[@intCast(handle)];
}

fn allocSystem(n: u32, capacity: u32) !*SparseSystem {
    const sys = try allocator.create(SparseSystem);
    errdefer allocator.destroy(sys);

    sys.rows = try allocator.alloc(i32, capacity);
    errdefer allocator.free(sys.rows);

    sys.cols = try allocator.alloc(i32, capacity);
    errdefer allocator.free(sys.cols);

    sys.vals = try allocator.alloc(f64, capacity);
    errdefer allocator.free(sys.vals);

    sys.b = try allocator.alloc(f64, n);
    errdefer allocator.free(sys.b);

    sys.x = try allocator.alloc(f64, n);
    errdefer allocator.free(sys.x);

    sys.* = .{
        .n = n,
        .capacity = capacity,
        .nnz = 0,
        .rows = sys.rows,
        .cols = sys.cols,
        .vals = sys.vals,
        .b = sys.b,
        .x = sys.x,
    };

    return sys;
}

fn buildK(sys: *SparseSystem) !void {
    if (sys.k_matrix) |oldK| {
        csparse.spfree(oldK);
        sys.k_matrix = null;
    }

    const T = try csparse.spalloc(@intCast(sys.n), @intCast(sys.n), @intCast(sys.nnz), 1, 1);
    defer csparse.spfree(T);

    var k: usize = 0;
    while (k < sys.nnz) : (k += 1) {
        try csparse.entry(T, sys.rows[k], sys.cols[k], sys.vals[k]);
    }

    sys.k_matrix = try csparse.compress(T);
}

fn ensureSymbolic(sys: *SparseSystem) !void {
    if (sys.S != null) return;
    const K = sys.k_matrix orelse return error.NoMatrix;
    sys.S = try csparse.schol(1, K); // order = 1: AMD
}

fn refactorNumeric(sys: *SparseSystem) !void {
    if (sys.N) |oldN| {
        csparse.nfree(oldN);
        sys.N = null;
    }
    const K = sys.k_matrix orelse return error.NoMatrix;
    const S = sys.S orelse return error.NoSymbolics;
    sys.N = try csparse.chol(K, S);
}

fn solveWithFactors(sys: *SparseSystem) !void {
    const S = sys.S orelse return error.NoSymbolic;
    const N = sys.N orelse return error.NoNumeric;

    const n = sys.n;

    const workspace = try allocator.alloc(f64, n);
    defer allocator.free(workspace);

    _ = csparse.ipvec(S.pinv, sys.b.ptr, workspace.ptr, @intCast(n));
    _ = try csparse.lsolve(N.L, workspace.ptr);
    _ = try csparse.ltsolve(N.L, workspace.ptr);
    _ = csparse.pvec(S.pinv, workspace.ptr, sys.x.ptr, @intCast(n));
}

fn freeSystemMemory(sys: *SparseSystem) void {
    allocator.free(sys.x);
    allocator.free(sys.b);
    allocator.free(sys.vals);
    allocator.free(sys.cols);
    allocator.free(sys.rows);
    allocator.destroy(sys);
}

fn freeCSparseData(sys: *SparseSystem) void {
    if (sys.N) |N| {
        csparse.nfree(N);
        sys.N = null;
    }
    if (sys.S) |S| {
        csparse.sfree(S);
        sys.S = null;
    }
    if (sys.k_matrix) |K| {
        csparse.spfree(K);
        sys.k_matrix = null;
    }
}

// this will not copy original data into new slice because its invalid anyway after shape change
fn resizeBuffer(comptime T: type, old_slice: []T, new_size: u32) ![]T {
    if (allocator.resize(old_slice, new_size)) {
        return old_slice.ptr[0..new_size];
    }
    const new_slice = try allocator.alloc(T, new_size);
    allocator.free(old_slice);
    return new_slice;
}

const testing = std.testing;

test "sparse_solver_native: create and destroy" {
    const handle = system_create(4, 12);
    try testing.expect(handle >= 0);
    try testing.expect(system_destroy(handle));
}

test "sparse_solver_native: create returns -1 when full" {
    var created: usize = 0;
    var handles: [max_systems]i32 = undefined;

    while (created < max_systems) {
        const h = system_create(1, 1);
        if (h < 0) break;
        handles[created] = h;
        created += 1;
    }
    try testing.expectEqual(max_systems, created);

    const overflow = system_create(1, 1);
    try testing.expectEqual(@as(i32, -1), overflow);

    for (handles[0..created]) |h| _ = system_destroy(h);
}

test "sparse_solver_native: set_nnz" {
    const handle = system_create(4, 12);
    defer _ = system_destroy(handle);

    try testing.expect(system_set_nnz(handle, 5));
    try testing.expect(!system_set_nnz(handle, 50)); // exceeds capacity
}

test "sparse_solver_native: resize" {
    const handle = system_create(4, 12);
    defer _ = system_destroy(handle);

    try testing.expect(system_resize(handle, 6, 20));
    try testing.expect(system_resize(handle, 6, 20)); // no-op, same dims

    // new_n < 0 is unreachable since params are u32, but test shape change
    try testing.expect(system_resize(handle, 3, 20));
}

test "sparse_solver_native: solve small system" {
    const handle = system_create(4, 10);
    defer _ = system_destroy(handle);

    // K = [4 1 0 0; 1 4 1 0; 0 1 4 1; 0 0 1 4]
    const rows = [_]i32{ 0, 0, 1, 1, 1, 2, 2, 2, 3, 3 };
    const cols = [_]i32{ 0, 1, 0, 1, 2, 1, 2, 3, 2, 3 };
    const vals = [_]f64{ 4, 1, 1, 4, 1, 1, 4, 1, 1, 4 };

    @memcpy(@as([*]i32, @ptrFromInt(system_rows_ptr(handle)))[0..10], &rows);
    @memcpy(@as([*]i32, @ptrFromInt(system_cols_ptr(handle)))[0..10], &cols);
    @memcpy(@as([*]f64, @ptrFromInt(system_vals_ptr(handle)))[0..10], &vals);

    try testing.expect(system_set_nnz(handle, 10));

    // b = [1 1 1 1]
    @memset(@as([*]f64, @ptrFromInt(system_b_ptr(handle)))[0..4], 1.0);

    try testing.expect(system_solve(handle, true, true));

    const x = @as([*]const f64, @ptrFromInt(system_x_ptr(handle)))[0..4];

    // Expected solution: [4/19, 3/19, 3/19, 4/19]
    const expected = [_]f64{ 4.0 / 19.0, 3.0 / 19.0, 3.0 / 19.0, 4.0 / 19.0 };
    for (x, &expected) |xi, ei| {
        try testing.expectApproxEqAbs(ei, xi, 1e-10);
    }
}

test "sparse_solver_native: invalid handle returns false" {
    try testing.expect(!system_destroy(-1));
    try testing.expect(!system_destroy(200));
    try testing.expect(!system_set_nnz(-1, 0));
    try testing.expect(!system_solve(-1, true, true));
    try testing.expectEqual(@as(usize, 0), system_rows_ptr(-1));
    try testing.expectEqual(@as(usize, 0), system_x_ptr(-1));
}
