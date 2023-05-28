const path = require("path");
const AwsSamPlugin = require("aws-sam-webpack-plugin");

const getEnvironment = (env) => {
    if (env.prod) {
        return 'prod';
    }
    if (env.dev) {
        return 'dev';
    }
    throw new Error('No valid Webpack environment set');
};

module.exports = (env) => {
    const environment = getEnvironment(env);
    const awsSamPlugin = new AwsSamPlugin({
        projects: {
            [environment]: `./template.${environment}.yaml`,
        },
        outFile: "index"
    });
    return {
        entry: () => awsSamPlugin.entry(),
        output: {
            filename: (chunkData) => awsSamPlugin.filename(chunkData),
            libraryTarget: "commonjs2",
            path: path.resolve("."),
        },
        devtool: "source-map",
        resolve: {
            extensions: [".ts", ".js"],
        },
        target: "node",
        externals: process.env.NODE_ENV === "development" ? [] : ["aws-sdk"],
        mode: process.env.NODE_ENV || "production",
        module: {
            rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
        },
        plugins: [awsSamPlugin],
    };
};
