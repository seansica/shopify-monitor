module.exports = {
    plugins: [
        "@babel/proposal-class-properties",
        [
            "@babel/plugin-transform-runtime",
            {
                regenerator: true,
            },
        ],
    ],
    presets: ["@babel/env", "@babel/typescript"],
};
