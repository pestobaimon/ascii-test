import App from "./App.vue";
import {createApp} from "vue";
import router from "@/router/router";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

const app = createApp(App);
app.component("VueSlider", VueSlider);
app.use(router);
app.mount("#app");
