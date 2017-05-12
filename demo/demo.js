const regl = require('regl')()
const camera = require('regl-camera')(regl, {
  center: [0, 2.5, 0]
})
const smooth = require('../smooth')
const calcNormals = require('angle-normals')
const bunny = require('bunny')

const params = {
  passBand: 0.1,
  iters: 0
}

const verts = regl.buffer(bunny.positions)
const normals = regl.buffer(calcNormals(bunny.cells, bunny.positions))

require('control-panel')([
  { type: 'range', label: 'passBand', min: 0, max: 1, step: 0.01, initial: params.passBand },
  { type: 'range', label: 'iters', min: 0, max: 50, initial: params.iters, step: 1 }
]).on('input', (data) => {
  Object.assign(params, data)
  const smoothPosition = smooth(bunny.cells, bunny.positions, params)
  verts(smoothPosition)
  normals(calcNormals(bunny.cells, smoothPosition))
})

const drawBunny = regl({
  attributes: {
    position: verts,
    normal: normals
  },

  elements: bunny.cells,

  vert: `
  precision highp float;
  attribute vec3 position, normal;
  uniform mat4 projection, view;
  varying vec3 vNormal;
  void main () {
    vNormal = normal;
    gl_Position = projection * view * vec4(position, 1);
  }
  `,

  frag: `
  precision highp float;
  varying vec3 vNormal;
  void main () {
    gl_FragColor = vec4(vNormal, 1);
  }
  `
})

regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1],
    depth: 1
  })

  camera(() => {
    drawBunny()
  })
})
