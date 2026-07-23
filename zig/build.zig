const std = @import("std");

const csparse_files = &[_][]const u8{
    "vendor/csparse/cs_add.c",
    "vendor/csparse/cs_amd.c",
    "vendor/csparse/cs_chol.c",
    "vendor/csparse/cs_cholsol.c",
    "vendor/csparse/cs_compress.c",
    "vendor/csparse/cs_counts.c",
    "vendor/csparse/cs_cumsum.c",
    "vendor/csparse/cs_dupl.c",
    "vendor/csparse/cs_entry.c",
    "vendor/csparse/cs_ereach.c",
    "vendor/csparse/cs_etree.c",
    "vendor/csparse/cs_fkeep.c",
    "vendor/csparse/cs_gaxpy.c",
    "vendor/csparse/cs_ipvec.c",
    "vendor/csparse/cs_leaf.c",
    "vendor/csparse/cs_lsolve.c",
    "vendor/csparse/cs_ltsolve.c",
    "vendor/csparse/cs_malloc.c",
    "vendor/csparse/cs_multiply.c",
    "vendor/csparse/cs_pinv.c",
    "vendor/csparse/cs_post.c",
    "vendor/csparse/cs_pvec.c",
    "vendor/csparse/cs_scatter.c",
    "vendor/csparse/cs_schol.c",
    "vendor/csparse/cs_symperm.c",
    "vendor/csparse/cs_tdfs.c",
    "vendor/csparse/cs_transpose.c",
    "vendor/csparse/cs_util.c",
};

const cflags = &[_][]const u8{"-O2"};

fn addCsparse(b: *std.Build, module: *std.Build.Module) void {
    module.addIncludePath(b.path("vendor/csparse"));
    module.addCSourceFiles(.{
        .files = csparse_files,
        .flags = cflags,
    });
}

pub fn build(b: *std.Build) void {
    // -----------------------------------------------------------------
    // Wasm library build
    // -----------------------------------------------------------------
    const wasm_target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag = .freestanding,
    });

    // Defaults to ReleaseSmall but can be overridden with -Doptimize=Debug etc.
    const optimize = .ReleaseSmall;

    const lib = b.addExecutable(.{
        .name = "arcora",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/root.zig"),
            .target = wasm_target,
            .optimize = optimize,
        }),
    });

    addCsparse(b, lib.root_module);

    lib.rdynamic = true;
    lib.entry = .disabled;

    const install_wasm = b.addInstallFileWithDir(
        lib.getEmittedBin(),
        .prefix,
        "arcora.wasm",
    );

    b.getInstallStep().dependOn(&install_wasm.step);

    // -----------------------------------------------------------------
    // Native Testing
    // -----------------------------------------------------------------
    const test_target = b.resolveTargetQuery(.{
        .cpu_arch = .x86_64,
        .os_tag = .linux,
        .abi = .musl,
    });

    // Tests always run in Debug so safety checks (bounds, overflow, etc.)
    // stay on regardless of what the wasm build's optimize mode is set to.
    const test_optimize: std.builtin.OptimizeMode = .Debug;

    const main_tests = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/root.zig"),
            .target = test_target,
            .optimize = test_optimize,
        }),
    });

    addCsparse(b, main_tests.root_module);

    // Native builds must link to the host's standard C library
    main_tests.root_module.link_libc = true;

    const run_main_tests = b.addRunArtifact(main_tests);

    const test_step = b.step("test", "Run unit tests natively");
    test_step.dependOn(&run_main_tests.step);
}
