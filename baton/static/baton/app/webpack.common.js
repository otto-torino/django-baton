const webpack = require("webpack");
const path = require("path");

module.exports = {
  resolve: {
    // always import from root (src and node_modules)
    modules: [path.join(__dirname, "src"), "node_modules"],
    extensions: [".js"],
  },
  // library entry point
  entry: "./src/index.js",
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: "/static/baton/app/dist/",
    filename: "baton.min.js",
    clean: true,
  },
  plugins: [
    new webpack.ProvidePlugin({
      jQuery: "jquery",
      $: "jquery",
    }),
    new webpack.DefinePlugin({
      BATON_REVISION: JSON.stringify(process.env.BATON_REVISION),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env"],
        },
      },
      {
        test: /\.scss/,
        use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
      },
      {
        test: /\.sass/,
        use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
      },
      {
        test: /\.(svg|eot|woff|woff2|ttf|png|jpe?g|gif)(\?\S*)?$/,
        type: "asset/resource",
      },
    ],
  },
};
