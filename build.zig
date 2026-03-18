const std = @import("std");

pub fn build(b: *std.Build) void {
    const lib = b.addExecutable(.{
        .name = "arcora",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/root.zig"),
            .target = b.resolveTargetQuery(.{
                .cpu_arch = .wasm32,
                .os_tag = .freestanding,
            }),
            .optimize = .ReleaseSmall,
        }),
    });

    lib.rdynamic = true;
    lib.entry = .disabled;
    b.installArtifact(lib);
}
