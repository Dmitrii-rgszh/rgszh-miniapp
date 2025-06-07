module.exports = function override(config, env) {
  // Отключаем CssMinimizerPlugin
  const cssMinimizerPluginIndex = config.optimization.minimizer.findIndex(
    (plugin) => plugin.constructor.name === 'CssMinimizerPlugin'
  );
  if (cssMinimizerPluginIndex !== -1) {
    config.optimization.minimizer.splice(cssMinimizerPluginIndex, 1);
  }

  return config;
};