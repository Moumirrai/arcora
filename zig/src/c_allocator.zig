const std = @import("std");
const builtin = @import("builtin");

comptime {
    if (builtin.target.cpu.arch != .wasm32) {
        @compileError("c_allocator is only for wasm32-freestanding targets");
    }
}

const allocator = std.heap.wasm_allocator;
const max_align = @alignOf(std.c.max_align_t);
const HEADER_SIZE = max_align;

comptime {
    if (@sizeOf(usize) > HEADER_SIZE) {
        @compileError("usize exceeds max_align_t alignment");
    }
}

export fn malloc(size: usize) ?*anyopaque {
    if (size == 0) return null;

    const total = size + HEADER_SIZE;
    const slice = allocator.alignedAlloc(u8, .of(std.c.max_align_t), total) catch return null;

    const size_ptr: *usize = @ptrCast(slice.ptr);
    size_ptr.* = size;

    return slice.ptr + HEADER_SIZE;
}

export fn calloc(count: usize, size: usize) ?*anyopaque {
    const total = count * size;
    if (total == 0) return null;

    const ptr = malloc(total) orelse return null;

    const payload = @as([*]u8, @ptrCast(ptr))[0..total];
    @memset(payload, 0);

    return ptr;
}

export fn free(ptr: ?*anyopaque) void {
    const p = ptr orelse return;

    const byte_ptr: [*]u8 = @ptrCast(p);
    const header_ptr = byte_ptr - HEADER_SIZE;
    const size_ptr: *usize = @ptrCast(@alignCast(header_ptr));
    const size = size_ptr.*;

    const slice: []align(max_align) u8 = @alignCast(header_ptr[0 .. size + HEADER_SIZE]);
    allocator.free(slice);
}

export fn realloc(ptr: ?*anyopaque, new_size: usize) ?*anyopaque {
    if (ptr == null) return malloc(new_size);
    if (new_size == 0) {
        free(ptr);
        return null;
    }

    const byte_ptr: [*]u8 = @ptrCast(ptr.?);
    const header_ptr = byte_ptr - HEADER_SIZE;
    const size_ptr: *usize = @ptrCast(@alignCast(header_ptr));
    const old_size = size_ptr.*;

    const old_total = old_size + HEADER_SIZE;
    const new_total = new_size + HEADER_SIZE;

    const old_slice: []align(max_align) u8 = @alignCast(header_ptr[0..old_total]);

    //try to use fast zig resize, so we dont have to copy memory
    if (allocator.resize(old_slice, new_total)) {
        size_ptr.* = new_size;
        return ptr;
    }

    const new_ptr = malloc(new_size) orelse return null;

    const copy_size = if (old_size < new_size) old_size else new_size;
    const src: [*]const u8 = @ptrCast(ptr);
    const dst: [*]u8 = @ptrCast(new_ptr);
    @memcpy(dst[0..copy_size], src[0..copy_size]);

    free(ptr);
    return new_ptr;
}
