<template>
  <div class="camera-canvas">
    <video ref="liveView" class="live-view" autoplay v-show="false"></video>
    <div class="container" ref="ascii"></div>
    <div class="control-menu" ref="controlMenu">
      <div class="control">
        <button v-on:click="bwOn">on</button>
        <div>bw</div>
        <button v-on:click="bwOff">off</button>
      </div>
      <div class="control">
        <button v-on:click="incBrightness">+</button>
        <div>brightness : {{ brightness.toString().slice(0, 3) }}</div>
        <button v-on:click="decBrightness">-</button>
      </div>
      <div class="control">
        <button v-on:click="incContrast">+</button>
        <div>contrast : {{ contrast.toString().slice(0, 3) }}</div>
        <button v-on:click="decContrast">-</button>
      </div>
      <div class="control">
        <button v-on:click="incAscii">+</button>
        <div>ascii size : {{ asciiSize.toString().slice(0, 3) }}</div>
        <button v-on:click="decAscii">-</button>
        <button v-on:click="toggleAscii">toggle</button>
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
import * as PIXI from "pixi.js";
import {ColorMatrixFilter} from "@pixi/filter-color-matrix";
import {AsciiFilter} from "@pixi/filter-ascii";

@Options({
  props: {
    msg: String,
  },
})
export default class Camera extends Vue {
  msg!: string;
  declare $refs: {
    camera: HTMLVideoElement;
    ascii: HTMLDivElement;
    liveView: HTMLVideoElement;
    controlMenu: HTMLDivElement;
  };
  isCameraOpen = false;
  scaleFactor = 1.0;
  stream: MediaStream | null = null;

  width: number | null = null;
  height: number | null = null;
  ratio = 16 / 9;

  pixiApp: PIXI.Application | null = null;

  bw = true;
  contrast = 1.0;
  brightness = 1.5;
  asciiSize = 6;
  container: PIXI.Container | null = null;

  colorMatrixBrightness = new PIXI.filters.ColorMatrixFilter();
  colorMatrixContrast = new PIXI.filters.ColorMatrixFilter();
  colorMatrixBW: ColorMatrixFilter = new PIXI.filters.ColorMatrixFilter();
  asciiFilter = new AsciiFilter(6);

  mounted() {
    this.width = window.innerWidth;
    this.height = window.innerHeight - this.$refs.controlMenu.clientHeight;
    this.pixiApp = new PIXI.Application({
      width: this.width,
      height: this.height,
      backgroundColor: 0x282828,
      resolution: window.devicePixelRatio || 1,
    });

    const constraints = {
      video: {width: this.width, height: this.height, facingMode: "user"},
      audio: false,
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        const liveView = this.$refs.liveView;
        liveView.srcObject = this.stream = stream;
      })
      .catch(function (err) {
        console.log("An error occurred! " + err);
      });
    this.$refs.ascii.appendChild(this.pixiApp.view);
    this.container = new PIXI.Container();
    const texture = PIXI.Texture.from(this.$refs.liveView);
    const webcam = new PIXI.Sprite(texture);
    webcam.width = this.pixiApp.view.width;
    webcam.height = this.pixiApp.view.height;
    this.container.addChild(webcam);

    this.colorMatrixBW.blackAndWhite(this.bw);
    this.colorMatrixBrightness.brightness(this.brightness, true);
    this.colorMatrixContrast.contrast(this.contrast, false);
    this.container.filters = [
      this.colorMatrixBrightness,
      this.colorMatrixContrast,
      this.asciiFilter,
      this.colorMatrixBW,
    ];
    this.pixiApp.stage.addChild(this.container);
    window.onresize = this.resize;
  }

  resize() {
    // let w;
    // let h;
    // if (window.innerWidth / window.innerHeight >= this.ratio) {
    //   w = window.innerHeight * this.ratio;
    //   h = window.innerHeight;
    // } else {
    //   w = window.innerWidth;
    //   h = window.innerWidth / this.ratio;
    // }
    if (!this.pixiApp) throw new Error();
    this.pixiApp.renderer.view.style.width = window.innerWidth + "px";
    this.pixiApp.renderer.view.style.height =
      window.innerHeight - this.$refs.controlMenu.clientHeight + "px";
  }

  bwOn() {
    this.container!.filters = [
      this.colorMatrixBrightness,
      this.colorMatrixContrast,
      this.asciiFilter,
      this.colorMatrixBW,
    ];
  }

  bwOff() {
    this.container!.filters = [
      this.colorMatrixBrightness,
      this.colorMatrixContrast,
      this.asciiFilter,
    ];
  }

  incBrightness() {
    this.brightness += 0.1;
    this.colorMatrixBrightness.brightness(this.brightness, false);
  }

  decBrightness() {
    this.brightness -= 0.1;
    this.colorMatrixBrightness.brightness(this.brightness, false);
  }

  incContrast() {
    this.contrast += 0.1;
    this.colorMatrixContrast.contrast(this.contrast, false);
  }

  decContrast() {
    this.contrast -= 0.1;
    this.colorMatrixContrast.contrast(this.contrast, false);
  }

  incAscii() {
    this.asciiSize += 1;
    this.asciiFilter.size = this.asciiSize;
  }

  decAscii() {
    this.asciiSize -= 1;
    this.asciiFilter.size = this.asciiSize;
  }

  toggleAscii() {
    this.asciiFilter.enabled = !this.asciiFilter.enabled;
  }
}
</script>

<style>
body {
  margin: 0;
  overflow: hidden; /* Hide scrollbars */
}
.camera-canvas {
  background: black;
  color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.3em;
}
.row-list {
  display: grid;
  list-style-type: none;
  font-size: 10px;
  margin: 0;
}
.control {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.control > button {
  margin: 10px;
}
</style>
