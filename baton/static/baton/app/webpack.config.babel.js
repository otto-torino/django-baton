import webpack from 'webpack'
import path from 'path'
import svgToMiniDataURI from 'mini-svg-data-uri'
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = env => {
  const webpackConfig = {
    mode: 'production',
    // this is needed to resolve imports from the js root
    resolve: {
      // always import from root (src and node_modules)
      modules: [
        path.join(__dirname, 'src'),
        'node_modules'
      ],
      extensions: ['.js']
    },
    // library entry point
    entry: './src/index.js',
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath: '/dist',
      filename: 'baton.min.js',
    },
    // this for creating source maps
    devtool: 'source-map'
  }

  webpackConfig.plugins = [
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      jquery: 'jquery'
    })
  ]

  if (env.NODE_ENV === 'development') {
    webpackConfig.plugins.push(
      new BundleAnalyzerPlugin(),
    )
  }

  webpackConfig.module = {
    rules: []
  }

  // js loaders
  webpackConfig.module.rules.push({
    test: /\.(js)$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    query: {
      presets: ['@babel/preset-env']
    }
  })

  // css loaders
  webpackConfig.module.rules.push({
    test: /\.scss/,
    loader: 'style-loader!css-loader!postcss-loader!sass-loader'
  }, {
    test: /\.sass/,
    loader: 'style-loader!css-loader!postcss-loader!sass-loader'
  })

  // File loaders
  webpackConfig.module.rules.push(
    {
      test: /\.(eot|woff|woff2|ttf|png|jpe?g|gif)(\?\S*)?$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: env.NODE_ENV === 'development' ? 5e6 : 1e4,
          publicPath: '/static/baton/app/dist/',
        }
      }
    },
    {
      test: /\.svg$/i,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: env.NODE_ENV === 'development' ? 5e6 : 1e4,
            publicPath: '/static/baton/app/dist/',
            generator: (content) => svgToMiniDataURI(content.toString()),
          },
        },
      ],
    },
  )

  return webpackConfig
}
