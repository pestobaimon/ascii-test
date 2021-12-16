const fs = require("fs");
const loader = require("@assemblyscript/loader");
const imports = {
  /* imports go here */
};
// const wasmModule = loader.instantiate(fetch("/build/optimized.wasm"), imports);
const response = await fetch("/build/optimized.wasm", imports);
const buffer = await response.arrayBuffer();
const obj = await WebAssembly.instantiate(buffer);
module.exports = obj.instance.exports;
