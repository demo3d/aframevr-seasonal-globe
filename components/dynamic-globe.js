

AFRAME.registerComponent('dynamic-globe', {
  schema: {
    texturesPath: {default: 'marble'},
    months: {default: [...Array(12)].map((_,i) => i+1) },
    activeMonth: {default: 1},
    textureExtension: {default: 'jpg'},
    radius: {default: 1},
    autoMode: {default: true},
    transitionDur: {default: 1000},  // transition between two textures in milliseconds
  },

  init: function () {
    this.elapsed = 0
    this.actualMonth = this.data.activeMonth - 1
    this.loader = new THREE.TextureLoader()
  },

  update: function () { 
    this.load()
  },

  load: function () {
    var data = this.data;

    const promises = []

    data.months.forEach(month => {

      promises.push(new Promise((resolve, reject) => {

        this.loader
          .load(
            `data/${data.texturesPath}/${month}.${data.textureExtension}`,
            texture => resolve(texture), 
            xhr => {}, 
            err => reject(err)
            )

      }))
    })


    Promise.all(promises)
      .then(textures => this.generate(textures))
  },

  generate: function(textures) {

    var data = this.data;
    var el = this.el;
    this.textures = textures


    this.uniforms = {
      ratio: {
        value: 0
      },
      diffuseSourceA: {
        value: textures[this.actualMonth]
      },
      diffuseSourceB: {
        value: textures[(this.actualMonth + 1) % data.months.length]
      }
    }


        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: VS,
            fragmentShader: FS,
            //side: THREE.BackSide
            side: THREE.DoubleSide
        });


        //const material = new THREE.MeshNormalMaterial();

        const geometry = new THREE.SphereGeometry(data.radius, 64, 32)

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0)
        mesh.scale.set(1, 1, 1)

        mesh.material.needsUpdate = true

        this.el.setObject3D('mesh', mesh)

      el.emit('dynamic-globe-generated');
  },

  tick: function(time, timeDelta) {

    if (!this.uniforms) return;

    const data = this.data

    const zn = this.data.months.length

    this.elapsed += timeDelta

    if (data.autoMode) {
      if (this.elapsed >= data.transitionDur) {
        
        this.actualMonth = ( this.actualMonth + 1 ) % zn;
        this.elapsed = 0
        console.log("Change !")
      }
    }


    this.uniforms[ "ratio" ].value = THREE.Math.clamp( this.elapsed/data.transitionDur, 0.0, 1.0 )

    this.uniforms[ "diffuseSourceA" ].value = this.textures[ this.actualMonth ]
    this.uniforms[ "diffuseSourceB" ].value = this.textures[ ( this.actualMonth + 1 ) % zn ]
  }
});


const VS = `
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vfUv;
void main()
{
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
    vNormal = normalize( normalMatrix * normal );
    vUv = vec2(1.-uv.s, uv.t);
    //vUv = uv;
}
`

const FS = `
uniform sampler2D diffuseSourceA;
uniform sampler2D diffuseSourceB;
uniform sampler2D mask;

uniform float ratio;

varying vec3 vNormal;
varying vec2 vUv;
void main() 
{

  vec4 texelA = texture2D( diffuseSourceA, vUv );
  vec4 texelB = texture2D( diffuseSourceB, vUv );
  //vec4 texelM = texture2D( mask, vUv );

  gl_FragColor = mix( texelA, texelB, ratio );
}
`