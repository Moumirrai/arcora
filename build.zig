const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag = .freestanding,
    });
    const optimize = .ReleaseSmall;

    const lib = b.addExecutable(.{
        .name = "arcora",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/root.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });

    // CSparse configuration
    lib.root_module.addIncludePath(b.path("vendor/csparse"));

    const cflags = &[_][]const u8{"-O2"};

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

    lib.root_module.addCSourceFiles(.{
        .files = csparse_files,
        .flags = cflags,
    });

    lib.rdynamic = true;
    lib.entry = .disabled;
    b.installArtifact(lib);

    // -----------------------------------------------------------------
    // Native Testing
    // -----------------------------------------------------------------

    // For running native tests, we resolve to the host machine's target
    const test_target = b.resolveTargetQuery(.{});

    const main_tests = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/test_sparse.zig"),
            .target = test_target,
            .optimize = optimize,
        }),
    });

    // Add C include path and source files for the test binary
    main_tests.root_module.addIncludePath(b.path("vendor/csparse"));
    main_tests.root_module.addCSourceFiles(.{
        .files = csparse_files,
        .flags = cflags,
    });

    // Native builds must link to the host's standard C library
    main_tests.root_module.link_libc = true;

    const run_main_tests = b.addRunArtifact(main_tests);

    const test_step = b.step("test-zig", "Run unit tests natively");
    test_step.dependOn(&run_main_tests.step);
}
