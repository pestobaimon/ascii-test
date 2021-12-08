<template>
  <div class="container">
    <span style="font-family: 'Share Tech Mono', monospace">&nbsp;</span>
    <div>
      <video
        class="camera"
        width="480"
        height="720"
        ref="camera"
        autoplay
      ></video>
      <canvas
        class="source-canvas"
        width="480"
        height="720"
        ref="canvas"
      ></canvas>
      <canvas
        class="ascii-canvas"
        width="480"
        height="720"
        ref="asciiCanvas"
      ></canvas>
      <!-- <pre ref="preText" class="ascii">{{ asciiString }}</pre> -->
      <div class="slider">
        <div>
          <h4>brightness</h4>
          <vue-slider :min="-100" :max="100" v-model="brightness" />
        </div>
        <div>
          <h4>contrast</h4>
          <vue-slider :interval="0.01" :min="0" :max="2" v-model="contrast" />
        </div>
        <div>
          <h4>FPS: {{ fps }}</h4>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
declare global {
  interface Window {
    constraints: any;
  }
}
import {Options, Vue} from "vue-class-component";
import cv from "@techstark/opencv-js";

@Options({
  props: {
    msg: String,
  },
})
export default class NewAscii extends Vue {
  msg!: string;
  declare $refs: {
    input: HTMLInputElement;
    camera: HTMLVideoElement;
    canvas: HTMLCanvasElement;
    asciiCanvas: HTMLCanvasElement;
    // preText: HTMLPreElement;
  };
  isCameraOpen = false;
  videoHeight = 720;
  videoWidth = 480;
  asciiString = "";
  brightness = 0;
  contrast = 1;
  fps = "";

  mounted() {
    this.startCameraStream();
  }

  toggleCamera(): void {
    if (this.isCameraOpen) {
      this.isCameraOpen = false;
      this.stopCameraStream();
    } else {
      this.isCameraOpen = true;
      this.startCameraStream();
    }
  }

  startCameraStream(): void {
    // create ascii mapping
    const letters = "MEfptecoi;:,.   ";
    // const letters = "APLertnoj:,.   ";
    let asciiMap = "";
    for (let i = 0; i < 256; i++) {
      const currentIndex = Math.round((i / 255) * (letters.length - 1));
      asciiMap += letters[currentIndex];
    }
    const constraints = {
      video: {
        width: this.videoWidth,
        height: this.videoHeight,
        facingMode: "user",
        frameRate: {ideal: 60},
      },
      audio: false,
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        const camera = this.$refs.camera;
        const canvas = this.$refs.canvas;
        camera.srcObject = stream;
        camera.play();

        let src = new cv.Mat(this.videoHeight, this.videoWidth, cv.CV_8UC4);
        let dst = new cv.Mat(this.videoHeight, this.videoWidth, cv.CV_8UC1);
        let cap = new cv.VideoCapture(camera);

        const context = this.$refs.asciiCanvas.getContext("2d");
        const maxWidth = 999999;
        const lineHeight = 6.7;

        const FPS = 10000;
        const FRAME_MIN_TIME = 1000 / FPS;

        const frameAvg = [0, 0, 0, 0, 0, 0, 0];

        let lastFrameTime = 0;
        const processVideo = () => {
          const delta = Date.now() - lastFrameTime;
          if (delta < FRAME_MIN_TIME) {
            //skip the frame if the call is too early
            requestAnimationFrame(processVideo);
            return; // return as there is nothing to do
          }
          frameAvg.push(delta);
          frameAvg.shift();
          const deltaSum = frameAvg.reduce((a, b) => a + b, 0);
          this.fps = (1000 / (deltaSum / frameAvg.length)).toPrecision(4);
          this.$refs.asciiCanvas.width = 480;
          this.$refs.asciiCanvas.height = 720;
          if (!context) throw new Error();
          context.font = "9.2pt Share Tech Mono";
          context.fillStyle = "#000";
          try {
            // console.time("array manipulation");
            let begin = Date.now();
            // start processing.
            cap.read(src);
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
            cv.resize(
              dst,
              dst,
              new cv.Size(dst.cols * 0.15, dst.rows * 0.15),
              cv.INTER_AREA
            );
            // cv.pyrDown(dst, dst);
            // cv.addWeighted(dst, 1, dst, 1.2, 0, dst);
            cv.convertScaleAbs(dst, dst, this.contrast, this.brightness);
            cv.flip(dst, dst, 1);
            let newAsciiString = "";
            for (let i = 0; i < dst.rows; i++) {
              for (let j = 0; j < dst.cols; j++) {
                // this.asciiArray[i][j] =
                //   asciiMap[clamp(dst.ucharPtr(i, j) - 20, 0, 255)];
                // dst.ucharPtr(i, j)[0] = clamp(dst.ucharPtr(i, j) - 20, 0, 255);
                // if (stop < 5000) {
                //   const rgba = dst.ucharPtr(i, j);
                //   console.log(
                //     `r= ${rgba[0]}, g= ${rgba[1]}, b=${rgba[2]}, a=${rgba[3]}`
                //   );
                //   console.log(rgba);
                //   stop++;
                // }
                newAsciiString +=
                  asciiMap[clamp(dst.ucharPtr(i, j)[0], 0, 255)];
              }
              newAsciiString += "\n";
            }
            wrapText(context, newAsciiString, 0, 0, maxWidth, lineHeight);
            this.asciiString = newAsciiString;
            cv.imshow(canvas, dst);
            // schedule the next one.
            lastFrameTime = Date.now();
            requestAnimationFrame(processVideo);
          } catch (err) {
            console.error(err);
          }
          // console.timeEnd("array manipulation");
        };

        // schedule the first one.
        requestAnimationFrame(processVideo);
      })
      .catch(function (err) {
        console.log("An error occurred! " + err);
      });
  }

  stopCameraStream(): void {
    let tracks = (this.$refs.camera.srcObject as MediaStream).getTracks();
    tracks.forEach((track) => {
      track.stop();
    });
  }
}
// Clamp number between two values with the following line:
const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  //manage carriage return
  text = text.replace(/(\r\n|\n\r|\r|\n)/g, "\n");
  //manage tabulation
  text = text.replace(/(\t)/g, "    "); // I use 4 spaces for tabulation, but you can use anything you want
  //array of lines
  var sections = text.split("\n");

  for (let s = 0, len = sections.length; s < len; s++) {
    var words = sections[s].split(" ");
    var line = "";

    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + " ";
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth) {
        context.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);

    //new line for new section of the text
    y += lineHeight;
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap");
.container {
  display: flex;
  justify-content: center;
}
.camera {
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
}
.ascii {
  font-size: 12px;
  line-height: 6.67px;
  width: 480px;
  margin: 0;
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
}
.ascii-canvas {
}
.row-list {
  display: grid;
  list-style-type: none;
  font-size: 10px;
  margin: 0;
}
.source-canvas {
}
.slider {
  width: 300px;
}
</style>
