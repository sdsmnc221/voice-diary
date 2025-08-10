import tailwindcss from "@tailwindcss/vite";
import Components from "unplugin-vue-components/vite";
import MotionResolver from "motion-v/resolver";
import tsconfigPaths from "vite-tsconfig-paths";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["motion-v/nuxt", "shadcn-nuxt"],
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      Components({
        dts: true,
        resolvers: [MotionResolver()],
      }),
    ],
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
});
