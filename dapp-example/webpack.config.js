const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: "./app.js",
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [{
      loader: 'babel-loader',
      test: /\.js$|jsx/,
      exclude: /node_modules/
    }]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "./index.html", to: "index.html" },
      ],
    }),
  ],
  devServer: { contentBase: path.join(__dirname, "dist"), compress: true },
};