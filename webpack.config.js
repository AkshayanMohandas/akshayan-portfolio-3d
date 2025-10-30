const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: {
    app: ['@babel/polyfill', './src/app.js'],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env'],
        },
      },
      // Shaders
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader'],
      },
    ],
  },
  plugins: [new CompressionPlugin()],
  devServer: {
    contentBase: path.join(__dirname, ''),
    compress: true,
    watchContentBase: true,
    port: 8080,
    host: '0.0.0.0',
    disableHostCheck: true,
    // Prevent page auto-refreshes due to editor/git touching files
    liveReload: false,
    hot: false,
    watchOptions: {
      ignored: [/node_modules/, /\.git/, /build/],
      aggregateTimeout: 300,
      poll: undefined,
    },
  },
  node: {
    fs: 'empty',
  },
};
