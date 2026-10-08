(function (global) {
  'use strict';
  global.CoinPusherToken = {
    weightedType: function (weights) {
      var roll = Math.random() * (weights.normal + weights.gem + weights.star);
      if (roll < weights.normal) return 'normal';
      if (roll < weights.normal + weights.gem) return 'gem';
      return 'star';
    },
    value: function (type, config) { return config.token.values[type] || 1; }
  };
}(window));
