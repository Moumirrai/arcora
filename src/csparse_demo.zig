const csparse = @import("interop/csparse.zig");

fn createDemoMatrix() csparse.Error!*csparse.cs {
    const T = try csparse.spalloc(3, 3, 4, 1, 1);
    defer csparse.spfree(T);

    try csparse.entry(T, 0, 0, 4.0);
    try csparse.entry(T, 1, 1, 2.0);
    try csparse.entry(T, 1, 2, 1.0);
    try csparse.entry(T, 2, 2, 3.0);

    return csparse.compress(T);
}

pub export fn csparse_self_test() i32 {
    const A = createDemoMatrix() catch return -1;
    defer csparse.spfree(A);

    const twice = csparse.add(A, A, 1.0, 1.0) catch return -2;
    defer csparse.spfree(twice);

    const transposed = csparse.transpose(A, 1) catch return -3;
    defer csparse.spfree(transposed);

    var b = [_]f64{ 1.0, 2.0, 3.0 };
    csparse.cholsol(1, A, &b[0]) catch return -4;

    return 42;
}
