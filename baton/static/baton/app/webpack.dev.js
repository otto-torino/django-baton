const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: "development",
  output: {
    ...common.output,
    publicPath: "http://localhost:8080/static/baton/app/dist/",
  },
  plugins: [...common.plugins, new BundleAnalyzerPlugin()],
  // this for creating source maps
  devtool: "eval-source-map",
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "*", // allow CORS on fonts
    },
  },
});
