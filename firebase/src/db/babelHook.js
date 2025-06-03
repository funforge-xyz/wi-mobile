// eslint-disable-next-line import/no-extraneous-dependencies
require('@babel/register')({
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '10',
        },
      },
    ],
  ],
  ignore: ['node_modules', 'package.json', 'package.lock.json'],
  sourceMaps: true,
  plugins: []
});

module.exports = require('./pgConfig');
