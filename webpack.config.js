const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    app: [
      './test/index.ts'
    ]
  },
  resolve: {
    extensions: ['.js', '.ts'],
    modules: [
      './src',
      './node_modules',
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'ts-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './test/index.html',
      inject: 'body',
    }),
  ],
  devServer: {
    port: '12347',
    contentBase: './build',
    watchContentBase: true,
    stats: { colors: true },
  },
};
