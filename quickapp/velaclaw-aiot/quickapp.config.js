// AIoT toolkit / Rspack configuration.
//
// The simulator enforces a 1 MiB limit on each physical page JavaScript file.
// Development/watch builds may otherwise emit a large base64 inline source map
// into every page bundle, making a sub-1-MiB executable bundle exceed that
// physical-file limit. Keep source maps useful for debugging, but emit them as
// separate .map files instead of embedding them in the page JavaScript.
module.exports = {
  postHook: function (config) {
    if (!config || config.mode === 'production') return
    config.devtool = 'source-map'
  }
}
