// craco.config.js
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (
        webpackConfig.optimization &&
        webpackConfig.optimization.minimizer
      ) {
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          (plugin) => plugin.constructor.name !== "CssMinimizerPlugin"
        );
      }
      return webpackConfig;
    },
  },
};