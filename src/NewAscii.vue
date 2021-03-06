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
          <h4>brightness: {{ brightness }}</h4>
          <vue-slider :min="-100" :max="100" v-model="brightness" />
        </div>
        <div>
          <h4>contrast: {{ contrast }}</h4>
          <vue-slider :interval="0.01" :min="0" :max="2" v-model="contrast" />
        </div>
        <div>
          <h4>scaling ratio: {{ scalingRatio }}</h4>
          <vue-slider
            :interval="0.01"
            :min="0.05"
            :max="0.5"
            v-model="scalingRatio"
          />
        </div>
        <div>
          <h4>ascii text</h4>
          <input type="text" v-model="asciiBase" />
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
import loader from "@assemblyscript/loader";

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
  asciiBase = "MEfptecoi;:,.   ";
  scalingRatio = 0.15;
  wasmExports: any = null;

  async mounted() {
    this.wasmExports = (
      await loader.instantiate(fetch("optimized.wasm"))
    ).exports;
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

  async startCameraStream(): Promise<void> {
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

        const FPS = 1;
        const FRAME_MIN_TIME = 1000 / 1000;

        const frameAvg = [0, 0, 0, 0, 0, 0, 0];

        let lastFrameTime = 0;
        const processVideo = () => {
          const delta = Date.now() - lastFrameTime;
          lastFrameTime = Date.now();
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
          try {
            // console.time("array manipulation");
            let begin = Date.now();
            // start processing.
            cap.read(src);
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
            cv.resize(
              dst,
              dst,
              new cv.Size(
                dst.cols * this.scalingRatio,
                dst.rows * this.scalingRatio
              ),
              cv.INTER_AREA
            );
            // cv.pyrDown(dst, dst);
            // cv.addWeighted(dst, 1, dst, 1.2, 0, dst);
            cv.convertScaleAbs(dst, dst, this.contrast, this.brightness);
            cv.flip(dst, dst, 1);
            if (!context) throw new Error();
            const LineheightfontSizeRatio = 0.7246;
            const magicNumber = 1000;
            const fontSize = magicNumber / dst.rows;
            const lineHeight = fontSize * LineheightfontSizeRatio;
            context.font = `${fontSize}pt Share Tech Mono`;
            context.fillStyle = "#000";

            // create ascii mapping
            let asciiMap = "";
            for (let i = 0; i < 256; i++) {
              const currentIndex = Math.round(
                (i / 255) * (this.asciiBase.length - 1)
              );
              asciiMap += this.asciiBase[currentIndex];
            }

            let newAsciiString = "";

            for (let i = 0; i < dst.rows; i++) {
              for (let j = 0; j < dst.cols; j++) {
                newAsciiString +=
                  asciiMap[clamp(dst.ucharPtr(i, j)[0], 0, 255)];
              }
              newAsciiString += "\n";
            }
            // const {
            //   computeAsciiString,
            //   add,
            //   Int32Array_ID,
            //   __newString,
            //   __getString,
            //   __newArray,
            // } = this.wasmExports;
            // const doComputeAsciiString = (
            //   cols: number,
            //   pixelArray: number[],
            //   brightness: number,
            //   contrast: number
            // ) => {
            //   const pixelArrayPtr = __newArray(Int32Array_ID, pixelArray);
            //   const asciiStrPtr = computeAsciiString(
            //     cols,
            //     pixelArrayPtr,
            //     brightness,
            //     contrast
            //   );
            //   const asciiStr = __getString(asciiStrPtr);
            //   return asciiStr;
            // };
            // newAsciiString = doComputeAsciiString(
            //   dst.cols,
            //   dst.data,
            //   this.brightness,
            //   this.contrast
            // );
            wrapText(context, newAsciiString, 0, 0, maxWidth, lineHeight);
            cv.imshow(canvas, dst);
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
  text = text.replace(/(\t)/g, "    "); // replace tabulation with 4 spaces
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

const extractModule = async (module: any) => {
  const {instance} = await module();
  return instance.exports;
};
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
