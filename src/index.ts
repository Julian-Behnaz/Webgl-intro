import vertSrc from './vert.glsl';
import fragSrc from './frag.glsl';


import * as Stats from "stats.js"
let stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
stats.dom.style.left = "auto";
stats.dom.style.right = "0";
stats.dom.style.top = "50px";
document.body.appendChild(stats.dom);

const canvas = document.querySelector("#main") as HTMLCanvasElement;

const gl = canvas.getContext("webgl2");
if(!gl){
    // No webgl support in this browser session
    // TODO: explain.
}

enum ShaderType {
    Vertex = gl.VERTEX_SHADER,
    Fragment = gl.FRAGMENT_SHADER
}

const vertexShader = createShader(gl, ShaderType.Vertex, vertSrc);
const fragmentShader = createShader(gl, ShaderType.Fragment, fragSrc);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
// const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
const translationAttributeLocation= gl.getAttribLocation(program,"a_translation");
const timeUniformLocation= gl.getUniformLocation(program, "u_time");


const numTriangles = 1000;

const colorBuffer = gl.createBuffer();
{
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    
    const color = new Float32Array(numTriangles * 3);
    for (let i = 0; i < numTriangles; i++) {
        color[i*3] = Math.random();
        color[i*3+1] = Math.random();
        color[i*3+2] = Math.random();
    }
    gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW);
    
}

const positionBuffer = gl.createBuffer();
{
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // // WebGL Context:
    // {
    //     ARRAY_BUFFER = positionBuffer
    // }
    
    // three 2d points
    const positionsAndColors = [ //xy rgb, xy rgb, xy rgb, xy rgb, xy rgb
        /* pos */0, 0.9,  /* color */  1,0,0, //0.2,0.7,0.5,
        /* pos */0, 0.5, /* color */ 0,1,0,//0.1,0,0.9,
        /* pos */0.1, 0, /* color */ 0,0,1 //0.0,0.9,1.0,
      ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsAndColors), gl.STATIC_DRAW);
}

const translationBuffer= gl.createBuffer();
{
    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);

    // const translation = [];
    // for (let i = 0; i < 3; i++) {
    //     translation.push(Math.random()); translation.push(Math.random());
    // }
    // console.log(translation);
    const translations = new Float32Array(numTriangles * 2); // float translations[numTriangles * 2];
    for (let i = 0; i < numTriangles; i++) {
        translations[i*2] = Math.random()*2-1;
        translations[i*2+1] = Math.random()*2-1;
    }
    gl.bufferData(gl.ARRAY_BUFFER,translations, gl.STATIC_DRAW);
}

const vao = gl.createVertexArray();
{
    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(positionAttributeLocation);
    // gl.enableVertexAttribArray(colorAttributeLocation);
    gl.enableVertexAttribArray(translationAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    {
        const size = 2;          // 2 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 5*4;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);
        // Automatically binds whatever gl.ARRAY_BUFFER is (positionBuffer in this case) to the positionAttributeLocation
    }
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // {
    //     const size = 3;          // 2 components per iteration
    //     const type = gl.FLOAT;   // the data is 32bit floats
    //     const normalize = false; // don't normalize the data
    //     const stride = 3*4;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    //     const offset = 0;        // start at the beginning of the buffer
    //     gl.vertexAttribPointer(
    //         colorAttributeLocation, size, type, normalize, stride, offset);
    //     // Automatically binds whatever gl.ARRAY_BUFFER is (colorBuffer in this case) to the colorAttributeLocation
    //     gl.vertexAttribDivisor(colorAttributeLocation, 1);
    // }
    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
    {
        const size = 2;          // 2 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            translationAttributeLocation, size, type, normalize, stride, offset);
        // Automatically binds whatever gl.ARRAY_BUFFER is (translationBuffer in this case) to the colorAttributeLocation
        gl.vertexAttribDivisor(translationAttributeLocation, 1);
    }
}


function drawNow(time: number) {
    stats.begin();

    resize(canvas);
    
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    gl.uniform1f(timeUniformLocation, time);
    // console.log(time);
    
    gl.bindVertexArray(vao);
    {
        const primitiveType = gl.TRIANGLES;
        const offset = 0;
        const count = 3; // How often to execute the vertex shader
        // gl.drawArrays(primitiveType, offset, count);
        gl.drawArraysInstanced(gl.TRIANGLES,/* offset */0, /* verts per instance */3, /* instances */numTriangles);
    }

    gl.flush();

    stats.end();

    window.requestAnimationFrame(drawNow);
}

window.requestAnimationFrame(drawNow);







function createShader(
        gl: WebGL2RenderingContext,
        type: ShaderType,
        source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.error(`Shader compile failed ${ShaderType[type]}:`,gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}

function createProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader): WebGLProgram | null {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
   
    console.error("Program compile failed:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  /* from https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html */
function resize(canvas: HTMLCanvasElement) {
    var cssToRealPixels = window.devicePixelRatio || 1;
  
    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    var displayWidth  = Math.floor(canvas.clientWidth  * cssToRealPixels);
    var displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);
  
    // Check if the canvas is not the same size.
    if (canvas.width  !== displayWidth ||
        canvas.height !== displayHeight) {
  
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
}