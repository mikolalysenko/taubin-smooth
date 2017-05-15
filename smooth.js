var pool = require('typedarray-pool')

function hypot (x, y, z) {
  return Math.sqrt(
    Math.pow(x, 2) +
    Math.pow(y, 2) +
    Math.pow(z, 2))
}

function accumulate (out, inp, w) {
  for (var i = 0; i < 3; ++i) {
    out[i] += inp[i] * w
  }
}

function dup (array) {
  var result = new Array(array.length)
  for (var i = 0; i < array.length; ++i) {
    result[i] = array[i].slice()
  }
  return result
}

function smoothStep (cells, positions, outAccum, trace, weight) {
  var i
  var numVerts = positions.length
  var numCells = cells.length

  for (i = 0; i < numVerts; ++i) {
    var ov = outAccum[i]
    ov[0] = ov[1] = ov[2] = 0
  }

  for (i = 0; i < numVerts; ++i) {
    trace[i] = 0
  }

  for (i = 0; i < numCells; ++i) {
    var cell = cells[i]
    var ia = cell[0]
    var ib = cell[1]
    var ic = cell[2]

    var a = positions[ia]
    var b = positions[ib]
    var c = positions[ic]

    var abx = a[0] - b[0]
    var aby = a[1] - b[1]
    var abz = a[2] - b[2]

    var bcx = b[0] - c[0]
    var bcy = b[1] - c[1]
    var bcz = b[2] - c[2]

    var cax = c[0] - a[0]
    var cay = c[1] - a[1]
    var caz = c[2] - a[2]

    var area = 0.5 * hypot(
      aby * caz - abz * cay,
      abz * cax - abx * caz,
      abx * cay - aby * cax)

    if (area < 1e-8) {
      continue
    }

    var w = -0.5 / area
    var wa = w * (abx * cax + aby * cay + abz * caz)
    var wb = w * (bcx * abx + bcy * aby + bcz * abz)
    var wc = w * (cax * bcx + cay * bcy + caz * bcz)

    trace[ia] += wb + wc
    trace[ib] += wc + wa
    trace[ic] += wa + wb

    var oa = outAccum[ia]
    var ob = outAccum[ib]
    var oc = outAccum[ic]

    accumulate(ob, c, wa)
    accumulate(oc, b, wa)
    accumulate(oc, a, wb)
    accumulate(oa, c, wb)
    accumulate(oa, b, wc)
    accumulate(ob, a, wc)
  }

  for (i = 0; i < numVerts; ++i) {
    var o = outAccum[i]
    var p = positions[i]
    var tr = trace[i]
    for (var j = 0; j < 3; ++j) {
      var x = p[j]
      o[j] = x + weight * (o[j] / tr - x)
    }
  }
}

module.exports = function taubinSmooth (cells, positions, _options) {
  var options = _options || {}
  var passBand = 'passBand' in options ? +options.passBand : 0.1
  var iters = ('iters' in options ? (options.iters | 0) : 10)

  var trace = pool.mallocDouble(positions.length)

  var pointA = dup(positions)
  var pointB = dup(positions)

  var A = -1
  var B = passBand
  var C = 2

  var discr = Math.sqrt(B * B - 4 * A * C)
  var r0 = (-B + discr) / (2 * A * C)
  var r1 = (-B - discr) / (2 * A * C)

  var lambda = Math.max(r0, r1)
  var mu = Math.min(r0, r1)

  for (var i = 0; i < iters; ++i) {
    smoothStep(cells, pointA, pointB, trace, lambda)
    smoothStep(cells, pointB, pointA, trace, mu)
  }

  pool.free(trace)

  return pointA
}
