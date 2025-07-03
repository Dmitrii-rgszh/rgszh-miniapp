// craco.config.js

const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// исправили: теперь берём default-экспорт
const purgecss = require("@fullhuman/postcss-purgecss").default;

const purgecssPlugin = purgecss({
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  safelist: [
    // оставляем в бандле ваши классы TelegramPolls.css
    /^telegram-/,
    /^subtle-dot/,
    "pi-wrapper",
    "pi-fly"
  ],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
});

module.exports = {
  style: {
    postcss: {
      plugins: [
        // включаем PurgeCSS только в production
        ...(process.env.NODE_ENV === "production" ? [purgecssPlugin] : []),
      ],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      if (
        webpackConfig.optimization &&
        webpackConfig.optimization.minimizer
      ) {
        webpackConfig.optimization.minimizer =
          webpackConfig.optimization.minimizer.filter(
            (plugin) => plugin.constructor.name !== "CssMinimizerPlugin"
          );
      }
      return webpackConfig;
    },
  },
};


