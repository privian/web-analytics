const path = require('path');

const mode = process.env.NODE_ENV || 'development';

module.exports = {
  entry: {
    'dist/script.min': ['./src/analytics.ts'],
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts'],
    mainFields: ['browser', 'module', 'main'],
  },
  output: {
    path: __dirname,
    filename: '[name].js',
    chunkFilename: '[name].[id].js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode,
  plugins: [],
  performance: {
    hints: false,
  },
  devtool: 'source-map',
  devServer: {
    allowedHosts: 'all',
    proxy: {
      '/api/submit': {
        bypass: (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              console.log('[submit]: ', body);
              res.send(201);
            });
          }
        },
      },
    },
    static: [
      {
        directory: path.join(__dirname, 'dev'),
      },
    ],
    hot: true,
    host: '0.0.0.0',
    port: 3003,
  },
};
