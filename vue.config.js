const webpack = require('webpack');

module.exports = {
  configureWebpack: {
    plugins: [new webpack.EnvironmentPlugin(['APP_ENV'])],
  },
  chainWebpack: (config) => {
    config.resolve.alias.set('vue', '@vue/compat');
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap((options) => {
        return {
          ...options,
          compilerOptions: {
            compatConfig: {
              MODE: 3,
            },
          },
        };
      });
  },
  devServer: {
    host: 'localhost',
  },
};
