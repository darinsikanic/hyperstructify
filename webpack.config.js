const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  target: 'node',
  entry: './index.js',
  output: {
    path: __dirname+'/dist',
    filename: 'hyperstructify.js',
    libraryTarget: 'commonjs'
  },
  plugins: [ new webpack.DefinePlugin({ 'global.GENTLY': false }) ],
  externals: [ nodeExternals({
    whitelist: ['hyper/component', 'hyper/notify', 'hyper/decorate', 'react']
  })],
  module: {
    rules: [
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test:/\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      // {
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   use: ['babel-loader', 'eslint-loader']
      // }
    ]
  }
}
