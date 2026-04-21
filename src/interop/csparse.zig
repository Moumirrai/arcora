const std = @import("std");

/// CSparse matrix representation.
///
/// A matrix is stored either as:
/// - Triplet (builder form): `nz >= 0`
/// - CSC (compressed sparse column): `nz == -1`
///
/// Row/column indices are 0-based.

pub const cs = extern struct {
    /// Allocated nonzero capacity for `i`/`p`/`x` storage.
    nzmax: i64,
    /// Number of rows.
    m: i64,
    /// Number of columns.
    n: i64,
    /// Triplet: column indices (size `nzmax`). CSC: column pointers (size `n+1`).
    p: [*c]i64,
    /// Row indices (size `nzmax`).
    i: [*c]i64,
    /// Numerical values (size `nzmax`), can be null for pattern-only matrices.
    x: [*c]f64,
    /// Triplet: current nnz (`>= 0`). CSC: always `-1`.
    nz: i64,
};

/// Symbolic factorization result (structure/ordering, no numeric factors).
pub const css = extern struct {
    /// Inverse permutation (fill reduction).
    pinv: [*c]i64,
    /// Column permutation for LU/QR paths.
    q: [*c]i64,
    /// Elimination tree parent array.
    parent: [*c]i64,
    /// Symbolic column pointers / counts.
    cp: [*c]i64,
    /// QR helper array.
    leftmost: [*c]i64,
    m2: i64,
    /// Predicted nnz(L).
    lnz: f64,
    /// Predicted nnz(U) or nnz(R).
    unz: f64,
};

/// Numeric factorization result.
pub const csn = extern struct {
    /// Lower factor.
    L: [*c]cs,
    /// Upper factor (unused for pure Cholesky).
    U: [*c]cs,
    pinv: [*c]i64,
    /// QR-specific workspace.
    B: [*c]f64,
};

/// Wrapper error set for CSparse operations.
pub const Error = error{
    OutOfMemory,
    OperationFailed,
    FactorizationFailed,
};

/// Raw CSparse allocation entrypoint.
///
/// - `m`: row count.
/// - `n`: column count.
/// - `nzmax`: initial nonzero capacity.
/// - `values`: `1` allocates numeric storage (`x`), `0` keeps pattern-only matrix.
/// - `triplet`: `1` creates triplet form (`nz >= 0`), `0` creates CSC form (`nz == -1`).
///
/// Returns null on failure.
pub extern fn cs_spalloc(m: i64, n: i64, nzmax: i64, values: i64, triplet: i64) ?*cs;

/// Raw CSparse free entrypoint.
///
/// Frees sparse matrix and its internal buffers.
/// Returns null for chaining, matching CSparse C API.
pub extern fn cs_spfree(A: ?*cs) ?*cs;

/// Raw CSparse resize entrypoint.
///
/// - `A`: matrix to resize.
/// - `nzmax`: new capacity; `<= 0` means "fit to current nnz".
///
/// Returns non-zero on success, zero on failure.
pub extern fn cs_sprealloc(A: ?*cs, nzmax: i64) i64;

/// Raw CSparse triplet insertion entrypoint.
///
/// Appends one entry `(i, j, x)` into triplet matrix `T`.
/// Returns non-zero on success, zero on failure.
pub extern fn cs_entry(T: ?*cs, i: i64, j: i64, x: f64) i64;

/// Raw CSparse conversion entrypoint.
///
/// Converts triplet matrix into CSC format.
/// Returns newly allocated matrix or null on failure.
pub extern fn cs_compress(T: ?*cs) ?*cs;

/// Raw CSparse add entrypoint.
///
/// Computes `alpha * A + beta * B` and returns newly allocated CSC matrix.
/// Returns null on failure.
pub extern fn cs_add(A: ?*cs, B: ?*cs, alpha: f64, beta: f64) ?*cs;

/// Raw CSparse transpose entrypoint.
///
/// - `values`: `1` transposes numeric values too, `0` transposes pattern only.
///
/// Returns newly allocated transposed matrix or null on failure.
pub extern fn cs_transpose(A: ?*cs, values: i64) ?*cs;

/// Raw CSparse symbolic analysis entrypoint.
///
/// - `order`: ordering mode (`0` natural, `1` AMD).
///
/// Returns symbolic factorization or null on failure.
pub extern fn cs_schol(order: i64, A: ?*cs) ?*css;

/// Raw CSparse symbolic free entrypoint.
pub extern fn cs_sfree(S: ?*css) ?*css;

/// Raw CSparse numeric factorization entrypoint.
///
/// Computes numeric Cholesky factorization using matrix `A` and symbolic `S`.
/// Returns numeric factorization or null on failure.
pub extern fn cs_chol(A: ?*cs, S: ?*css) ?*csn;

/// Raw CSparse numeric free entrypoint.
pub extern fn cs_nfree(N: ?*csn) ?*csn;

/// Raw CSparse solve entrypoint.
///
/// - `order`: ordering mode (`0` natural, `1` AMD).
/// - `A`: input matrix (CSC expected).
/// - `b`: in/out RHS vector; overwritten in-place with solution `x`.
///
/// Returns non-zero on success, zero on failure.
pub extern fn cs_cholsol(order: i64, A: ?*cs, b: [*c]f64) i64;

/// Safe wrapper for `cs_spalloc`.
///
/// - `m`: row count.
/// - `n`: column count.
/// - `nzmax`: initial nonzero capacity.
/// - `values`: `1` allocates numeric storage (`x`), `0` pattern-only matrix.
/// - `triplet`: `1` triplet form (for `entry`), `0` CSC form.
///
/// Returns `error.OutOfMemory` on failure.
pub fn spalloc(m: i64, n: i64, nzmax: i64, values: i64, triplet: i64) Error!*cs {
    return cs_spalloc(m, n, nzmax, values, triplet) orelse error.OutOfMemory;
}

/// Safe wrapper for `cs_spfree`.
///
/// Frees sparse matrix and its internal buffers.
pub fn spfree(A: ?*cs) void {
    _ = cs_spfree(A);
}

/// Safe wrapper for `cs_sprealloc`.
///
/// - `A`: matrix to resize.
/// - `nzmax`: target capacity, `<= 0` means fit to current nnz.
///
/// Returns `error.OperationFailed` on failure.
pub fn sprealloc(A: *cs, nzmax: i64) Error!void {
    if (cs_sprealloc(A, nzmax) == 0) return error.OperationFailed;
}

/// Safe wrapper for `cs_entry`.
///
/// Appends one triplet entry `(i, j, x)`.
/// Returns `error.OperationFailed` on failure.
pub fn entry(T: *cs, i: i64, j: i64, x: f64) Error!void {
    if (cs_entry(T, i, j, x) == 0) return error.OperationFailed;
}

/// Safe wrapper for `cs_compress`.
///
/// Converts triplet matrix into CSC and returns newly allocated matrix.
/// Returns `error.OperationFailed` on failure.
pub fn compress(T: *cs) Error!*cs {
    return cs_compress(T) orelse error.OperationFailed;
}

/// Safe wrapper for `cs_add`.
///
/// Computes `alpha * A + beta * B` and returns newly allocated matrix.
/// Returns `error.OperationFailed` on failure.
pub fn add(A: *cs, B: *cs, alpha: f64, beta: f64) Error!*cs {
    return cs_add(A, B, alpha, beta) orelse error.OperationFailed;
}

/// Safe wrapper for `cs_transpose`.
///
/// - `values`: `1` transposes values too, `0` pattern-only transpose.
///
/// Returns newly allocated transposed matrix.
/// Returns `error.OperationFailed` on failure.
pub fn transpose(A: *cs, values: i64) Error!*cs {
    return cs_transpose(A, values) orelse error.OperationFailed;
}

/// Safe wrapper for `cs_schol`.
///
/// - `order`: ordering mode (`0` natural, `1` AMD).
///
/// Returns symbolic factorization.
/// Returns `error.OperationFailed` on failure.
pub fn schol(order: i64, A: *cs) Error!*css {
    return cs_schol(order, A) orelse error.OperationFailed;
}

/// Safe wrapper for `cs_sfree`.
pub fn sfree(S: ?*css) void {
    _ = cs_sfree(S);
}

/// Safe wrapper for `cs_chol`.
///
/// Returns numeric factorization.
/// Returns `error.OperationFailed` on failure.
pub fn chol(A: *cs, S: *css) Error!*csn {
    return cs_chol(A, S) orelse error.OperationFailed;
}

/// Safe wrapper for `cs_nfree`.
pub fn nfree(N: ?*csn) void {
    _ = cs_nfree(N);
}

/// Safe wrapper for `cs_cholsol`.
///
/// - `order`: ordering mode (`0` natural, `1` AMD).
/// - `A`: input matrix in CSC format.
/// - `b`: in/out RHS vector; overwritten in-place with solution `x`.
///
/// Returns `error.FactorizationFailed` on solve failure.
pub fn cholsol(order: i64, A: *cs, b: [*c]f64) Error!void {
    if (cs_cholsol(order, A, b) == 0) return error.FactorizationFailed;
}

/// Converts CSparse matrix to a row-major dense vector of length `m*n`.
///
/// - `allocator`: allocator used for output buffer.
/// - `A`: input sparse matrix (triplet or CSC).
///
/// Caller owns and must free the returned slice with the same allocator.
pub fn toDense(allocator: std.mem.Allocator, A: *const cs) ![]f64 {
    const rows: usize = @intCast(A.m);
    const cols: usize = @intCast(A.n);
    const dense = try allocator.alloc(f64, rows * cols);
    @memset(dense, 0.0);

    if (A.nz >= 0) {
        // Triplet format
        const nz: usize = @intCast(A.nz);
        var k: usize = 0;
        while (k < nz) : (k += 1) {
            const row: usize = @intCast(A.i[k]);
            const col: usize = @intCast(A.p[k]);
            dense[row * cols + col] += A.x[k];
        }
    } else {
        // Compressed-column format (CSC)
        var j: usize = 0;
        while (j < cols) : (j += 1) {
            const start: usize = @intCast(A.p[j]);
            const end: usize = @intCast(A.p[j + 1]);
            var idx = start;
            while (idx < end) : (idx += 1) {
                const row: usize = @intCast(A.i[idx]);
                dense[row * cols + j] = A.x[idx];
            }
        }
    }

    return dense;
}
