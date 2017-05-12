var calcLaplacian = require('mesh-laplacian')

function smoothStep (cells, positions, weight) {
  var result = new Array(positions.length)
  var trace = new Array(positions.length)
  for (var i = 0; i < positions.length; ++i) {
    result[i] = positions[i].slice()
    trace[i] = 0
  }

  var lap = calcLaplacian(cells, positions)
  for (var n = 0; n < lap.length; ++n) {
    var L = lap[n]
    if (L[1] === L[0]) {
      trace[L[0]] -= L[2]
    }
  }

  for (var j = 0; j < lap.length; ++j) {
    var e = lap[j]
    var p0 = result[e[0]]
    var q1 = positions[e[1]]
    var w = weight * e[2] / trace[e[0]]

    for (var k = 0; k < p0.length; ++k) {
      p0[k] += w * q1[k]
    }
  }

  return result
}

module.exports = function taubinSmooth (cells, positions, _options) {
  var options = _options || {}
  var passBand = 'passBand' in options ? +options.passBand : 0.1
  var iters = 2 * ('iters' in options ? (options.iters | 0) : 10)

  var A = -1
  var B = passBand
  var C = 2

  var discr = Math.sqrt(B * B - 4 * A * C)
  var r0 = (-B + discr) / (2 * A * C)
  var r1 = (-B - discr) / (2 * A * C)

  var lambda = Math.max(r0, r1)
  var mu = Math.min(r0, r1)

  var p = positions
  for (var i = 0; i < iters; ++i) {
    p = smoothStep(cells, p, i % 2 === 0 ? lambda : mu)
  }

  return p
}
