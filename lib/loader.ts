async function loadWasmBytes(): Promise<BufferSource> {
    if (typeof window !== "undefined") {
        // browser
        const response = await fetch(new URL("../zig-out/bin/arcora.wasm", import.meta.url));
        return response.arrayBuffer();
    } else {
        // node / bun
        const { readFileSync } = await import("fs");
        return readFileSync(new URL("../zig-out/bin/arcora.wasm", import.meta.url));
    }
}

export async function loadWasm() {
    const bytes = await loadWasmBytes();
    return WebAssembly.instantiate(bytes);
}