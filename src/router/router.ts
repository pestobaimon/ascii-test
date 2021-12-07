import {createRouter, createWebHistory, RouteRecordRaw} from "vue-router";
const NewAscii = () => import("../NewAscii.vue");
const PixiAscii = () => import("../PixiAscii.vue");

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "landing",
    component: NewAscii,
  },
  {
    path: "/new-ascii",
    name: "newAscii",
    component: NewAscii,
  },
  {
    path: "/pixi-ascii",
    name: "pixiAscii",
    component: PixiAscii,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
