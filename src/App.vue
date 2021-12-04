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
  webcamSprite: PIXI.Sprite | null = null;

  bw = true;
  contrast = 1.0;
  brightness = 1.5;
  asciiSize = 6;
  container: PIXI.Container | null = null;

  colorMatrixBrightness = new PIXI.filters.ColorMatrixFilter();
  colorMatrixContrast = new PIXI.filters.ColorMatrixFilter();
  colorMatrixBW: ColorMatrixFilter = new PIXI.filters.ColorMatrixFilter();
  asciiFilter = new AsciiFilter(6);

  mounted(): void {
    this.pixiApp = new PIXI.Application({
      width: 480,
      height: 720,
      backgroundColor: 0x282828,
      resolution: window.devicePixelRatio || 1,
    });

    const constraints = {
      video: {width: 480, height: 720, facingMode: "user"},
      audio: false,
    };
    console.log(constraints);
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
    this.webcamSprite = new PIXI.Sprite(texture);
    this.webcamSprite.width = 480;
    this.webcamSprite.height = 720;
    this.container.addChild(this.webcamSprite);
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
  }

  bwOn(): void {
    if (!this.container) throw new Error();
    this.container.filters = [
      this.colorMatrixBrightness,
      this.colorMatrixContrast,
      this.asciiFilter,
      this.colorMatrixBW,
    ];
  }

  bwOff(): void {
    if (!this.container) throw new Error();
    this.container.filters = [
      this.colorMatrixBrightness,
      this.colorMatrixContrast,
      this.asciiFilter,
    ];
  }

  incBrightness(): void {
    this.brightness += 0.1;
    this.colorMatrixBrightness.brightness(this.brightness, false);
  }

  decBrightness(): void {
    this.brightness -= 0.1;
    this.colorMatrixBrightness.brightness(this.brightness, false);
  }

  incContrast(): void {
    this.contrast += 0.1;
    this.colorMatrixContrast.contrast(this.contrast, false);
  }

  decContrast(): void {
    this.contrast -= 0.1;
    this.colorMatrixContrast.contrast(this.contrast, false);
  }

  incAscii(): void {
    this.asciiSize += 1;
    this.asciiFilter.size = this.asciiSize;
  }

  decAscii(): void {
    this.asciiSize -= 1;
    this.asciiFilter.size = this.asciiSize;
  }

  toggleAscii(): void {
    this.asciiFilter.enabled = !this.asciiFilter.enabled;
  }
}
</script>

<style>
body {
  margin: 0;
}
.camera-canvas {
  background: black;
  color: white;
  min-height: 100vh;
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
