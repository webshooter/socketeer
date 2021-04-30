module.exports = (api) => {
  api.cache(false);
  return {
    presets: [[
      "@babel/preset-env",
      { targets: { node: true }, modules: "cjs" },
    ]],
    plugins: [
      ["@babel/plugin-syntax-optional-chaining"],
      ["@babel/plugin-proposal-class-properties"],
    ],
  };
};
