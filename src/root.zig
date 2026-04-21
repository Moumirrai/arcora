const std = @import("std");

comptime {
    _ = @import("csparse_demo.zig");
}

export fn add(a: f32, b: f32) f32 {
    return a + b;
}

// ---------------------------------------------------------
// libc Allocator Polyfills for Freestanding WASM ONLY
// ---------------------------------------------------------

// We only include these when building for wasm32-freestanding.
// For native Zig tests, we use the standard libc.
// Because the functions are exported they are linked appropriately
// by the compiler only if they don't collide with native libc.

const allocator = std.heap.wasm_allocator;
const ALIGNMENT = @alignOf(std.c.max_align_t);
const HEADER_SIZE = if (ALIGNMENT > @sizeOf(usize)) ALIGNMENT else @sizeOf(usize);

export fn malloc(size: usize) ?*anyopaque {
    if (size == 0) return null;
    const total_size = size + HEADER_SIZE;
    const slice = allocator.alloc(u8, total_size) catch return null;
    const size_ptr: *usize = @ptrCast(@alignCast(slice.ptr));
    size_ptr.* = size;
    return slice.ptr + HEADER_SIZE;
}

export fn calloc(count: usize, size: usize) ?*anyopaque {
    const total = count * size;
    if (total == 0) return null;
    const ptr = malloc(total) orelse return null;
    const slice = @as([*]u8, @ptrCast(ptr))[0..total];
    @memset(slice, 0);
    return ptr;
}

export fn free(ptr: ?*anyopaque) void {
    if (ptr) |p| {
        const byte_ptr = @as([*]u8, @ptrCast(p));
        const real_ptr = byte_ptr - HEADER_SIZE;
        const size_ptr: *usize = @ptrCast(@alignCast(real_ptr));
        const size = size_ptr.*;
        const slice = real_ptr[0 .. size + HEADER_SIZE];
        allocator.free(slice);
    }
}

export fn realloc(ptr: ?*anyopaque, new_size: usize) ?*anyopaque {
    if (ptr == null) return malloc(new_size);
    if (new_size == 0) {
        free(ptr);
        return null;
    }
    const byte_ptr = @as([*]u8, @ptrCast(ptr.?));
    const real_ptr = byte_ptr - HEADER_SIZE;
    const size_ptr: *usize = @ptrCast(@alignCast(real_ptr));
    const old_size = size_ptr.*;

    const new_ptr = malloc(new_size) orelse return null;
    const copy_size = if (old_size < new_size) old_size else new_size;
    const src_slice = byte_ptr[0..copy_size];
    const dst_slice = @as([*]u8, @ptrCast(new_ptr))[0..copy_size];
    @memcpy(dst_slice, src_slice);

    free(ptr);
    return new_ptr;
}
