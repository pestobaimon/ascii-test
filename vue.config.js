const path = require("path");
const ROOT = path.resolve(__dirname);
const express = require("express");

function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [ROOT].concat(args));
}

module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule("wasm")
      .test("/.wasm$/")
      .use("wasm-loader")
      .loader("wasm-loader");
  },
};
