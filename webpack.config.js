const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");
const config = {
	target: "node",

	entry: "./src/extension.js",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
	},
	devtool: process.env.NODE_ENV == "development" ? "source-map" : false,
	externals: {
		vscode: "commonjs vscode",
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	plugins: [new CleanWebpackPlugin()],
};

module.exports = config;
