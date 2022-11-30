/*********
 * made by Matthias Hurrle (@atzedent)
 */

/** @type {HTMLCanvasElement} */
const canvas = window.canvas
const gl = canvas.getContext("webgl2")
const dpr = Math.max(1, .5 * window.devicePixelRatio)

const vertexSource = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in vec2 position;

void main(void) {
    gl_Position = vec4(position, 0., 1.);
}
`
const fragmentSource = `#version 300 es
/*********
* made by Matthias Hurrle (@atzedent)
*/
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

out vec4 fragColor;

uniform vec2 resolution;
uniform float time;
uniform float volume;
uniform sampler2D texFFT; 

#define T mod(time, 200.)
#define S smoothstep
#define syl(a, b) length(a)-b

mat3 rotX(float a) {
    float s = sin(a), c = cos(a);
    
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c,-s),
        vec3(0, s, c)
    );
}

mat3 rotY(float a) {
    float s = sin(a), c = cos(a);
    
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s,0, c)
    );
}

mat3 rotZ(float a) {
    float s = sin(a), c = cos(a);
    
    return mat3(
        vec3(c, s, 0),
        vec3(-s,c, 0),
        vec3(0, 0, 1)
    );
}

float box(vec3 p, vec3 s, float r) {
    p = abs(p)-s;
    
    return length(max(vec3(0), p))+
        min(.0, max(max(p.x, p.y), p.z))-r;
}

float oct(vec3 p, float s) {
    p = abs(p);
    
    return (p.x+p.y+p.z-s)*(1./sqrt(3.));
}

float rod(vec3 p, float h, float r) {
    p.y -= clamp(p.y, .0, h);
    
    return syl(p, r);
}

float smin(float a, float b, float k) {
    float h = clamp(
        (b-a)/k,
        .0,
        1.
    );
    
    return mix(b, a, h)-k*h*(1.-h);
}

vec3 smin(vec3 a, vec3 b, float k) {
    vec3 h = clamp(
        (b-a)/k,
        .0,
        1.
    );
    
    return mix(b, a, h)-k*h*(1.-h);
}

float rnd(float a) {
    return fract(sin(a*711.457)*113.789);
}

float curve(float a, float b) {
    a /= b;
    
    return mix(
        rnd(floor(a)),
        rnd(floor(a)+1.),
        pow(S(.0, 1., fract(a)), b)
    );
}

float tick(float t, float e) {
    return floor(t)+pow(S(.0, 1., fract(t)), e);
}

float map(vec3 p) {
    float i = .0, e = 1.;
    
    for(; i<3.; i++) {
        p *= 
        rotX(tick(T, 2.))*
        rotY(1.-7.*sin(texture(texFFT, vec2(0)).r))*
        rotZ(T);
        
        p = smin(p, -p, -3.);
        p -= vec3(
            .2*i*sin(texture(texFFT, vec2(0)).r),
            2.+2.*texture(texFFT, vec2(0)).r,
            .8
        )*e;
        
        e *= .7;
    }
    float d = smin(box(p, vec3(.5), .125), oct(p, 1.8), 3.);
    float rod = rod(p, 4.+texture(texFFT, vec2(.5)).r, .025);
    d = max(d, -rod);
    d = smin(d, rod, .5);
    
    return d;
}

vec3 norm(vec3 p) {
    vec2 e = vec2(1e-3, 0);
    float d = map(p);
    vec3 n = d - vec3(
        map(p-e.xyy),
        map(p-e.yxy),
        map(p-e.yyx)
    );
    
    return normalize(n);
}

vec3 dir(vec2 uv, vec3 ro, vec3 target, float zoom) {
    vec3 up = vec3(0,1,0),
    f = normalize(target-ro),
    r = normalize(cross(up, f)),
    u = cross(f, r),
    c = f*zoom,
    i = c+uv.x*r+uv.y*u,
    d = normalize(i);
    
    return d;
}

void main(void) {
  vec2 uv = (
        gl_FragCoord.xy -.5 * resolution.xy
    ) / min(resolution.x, resolution.y);

    vec3 col = vec3(0),
    ro = vec3(0, 0, -12);
    ro *= rotX(T)*rotY(T);
    vec3 rd = dir(uv, ro, vec3(0), 1.),
    p = ro;
    
    float i = .0, at = .0;
    
    for(; i<80.; i++) {
        float d = map(p);
        
        if(d<5e-2) {
        vec3 n = norm(p),
        l = normalize(ro);
        
        float fres = max(.0, dot(l, n));
        col += max(.0, dot(l, n))*fres;
        
        break;
        }
        
        if(d>20.) break;
        
        p += rd*d;
        at += .3*(.3/d);
    }

    float prog = curve(T, 5.) * 10.;
  float preanim = floor(mod(prog-.5, 4.));

  if (preanim == .0 || preanim == 2.) {
    prog -= length(uv) * 0.2;
  } else if (preanim == 1. || preanim == 3.) {
    prog -= min(abs(uv.x), abs(uv.y)) * 0.2;
  }

  float anim = mod(prog, 4.);
  float scene = floor(anim);
  float t = .25*T;

    if (scene == .0 || scene == 2. || volume < .001) {
        col += vec3(sin(T+1.), cos(T+2.), sin(T+3.))*at*.1+i/20.; 
        col += -vec3(1)*step(texture(texFFT, abs(uv)).r, uv.y*.5+.5);
    } else if (scene == 1. || scene == 3.) {
        col = max(-col, -vec3(sin(T+1.), cos(T+2.), sin(T+3.))*at*.1+i/20.);
        col += vec3(1)*step(texture(texFFT, abs(uv)).r, uv.y*.5+.5);
    }
    
    fragColor = vec4(col, 1.);
}
`
let time
let buffer
let program
let resolution
let tex
let texFFT
let volume
let vertices = []
let touching = false

class Player {
    constructor(urls) {
        this.idx = 0
        this.urls = urls
        this.audio = new Audio()
        this.audio.src = urls[this.idx]
        this.audio.crossOrigin = 'anonymous'
        this.audio.loop = false
        this.audio.onended = () => this.next()

        this.initialized = false
    }
    setup() {
        this.audioCtx = new window.AudioContext()
        this.analyser = this.audioCtx.createAnalyser()

        this.analyser.minDecibels = -90
        this.analyser.maxDecibels = -10
        this.analyser.smoothingTimeConstant = 0.85
        this.analyser.fftSize = 256
        this.bufferLength = this.analyser.frequencyBinCount
        this.dataArray = new Uint8Array(this.bufferLength)

        this.audioSource = this.audioCtx.createMediaElementSource(this.audio)
        this.audioSource.connect(this.analyser)
        this.audioSource.connect(this.audioCtx.destination)

        this.audioCtx.resume()
        this.audio.play()

        this.initialized = true
    }
    next() {
        this.idx = (this.idx+1)%this.urls.length
        this.audio.src = this.urls[this.idx]
        this.audio.play()
    }
    resume() {
        this.audio.play()
    }
    pause() {
        this.audio.pause()
    }
    getSamples() {
        this.analyser.getByteTimeDomainData(this.dataArray)

        // Values in 'dataArray' are 8 bit, (0-255). 
        // Normalize values to [-1, 1]
        return [...this.dataArray].map(e => e / 128 - 1)
    }
    getVolume() {
        const normSamples = this.getSamples()

        let sum = 0
        for (let s of normSamples) {
            sum += s * s
        }

        let volume = Math.sqrt(sum / normSamples.length)

        return volume
    }
    getFFT() {
        this.analyser.getByteFrequencyData(this.dataArray);

        return this.dataArray
    }
}

let player;

function closeDialog() {
    player.setup()
    window.dialog.close()
}

function resize() {
    const { innerWidth: width, innerHeight: height } = window

    canvas.width = width * dpr
    canvas.height = height * dpr

    gl.viewport(0, 0, width * dpr, height * dpr)
}

function compile(shader, source) {
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
    }
}

function setupAudioTexture() {
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,            // level
        gl.LUMINANCE, // internal format
        128,          // width
        1,            // height
        0,            // border
        gl.LUMINANCE, // format
        gl.UNSIGNED_BYTE,  // type
        null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

}

function setup() {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    const fs = gl.createShader(gl.FRAGMENT_SHADER)

    program = gl.createProgram()

    compile(vs, vertexSource)
    compile(fs, fragmentSource)

    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
    }

    setupAudioTexture()
    vertices = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]

    buffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

    const position = gl.getAttribLocation(program, "position")

    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    time = gl.getUniformLocation(program, "time")
    resolution = gl.getUniformLocation(program, "resolution")
    texFFT = gl.getUniformLocation(program, "texFFT")
    volume = gl.getUniformLocation(program, "volume")
}

function updateAudioTexture() {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,            // level
        0,            // x
        0,            // y
        player.bufferLength,    // width
        1,            // height
        gl.LUMINANCE, // format
        gl.UNSIGNED_BYTE,  // type
        player.getFFT());

}

function draw(now) {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    if (player.initialized) {
        updateAudioTexture();
        gl.uniform1i(texFFT, tex);
    }

    gl.uniform1f(time, now * 0.001)
    gl.uniform2f(resolution, canvas.width, canvas.height)
    gl.uniform1f(volume, player.initialized ? player.getVolume() : 0)
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length * 0.5)
}

function loop(now) {
    draw(now)
    requestAnimationFrame(loop)
}

function init() {
    setup()
    resize()
    loop(0)
}

document.body.onload = init
window.onresize = resize
paused = false;
canvas.onpointerdown = e => {
    paused ? player.resume() : player.pause()
    paused = !paused
}

player = new Player([
    "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/5.mp3",
    "https://twgljs.org/examples/sounds/DOCTOR%20VOX%20-%20Level%20Up.mp3",
    "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/3.mp3",
    "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/2.mp3",
    "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/1.mp3",
    "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/4.mp3"
  ])