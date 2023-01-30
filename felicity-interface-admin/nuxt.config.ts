// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

export default defineNuxtConfig({
    modules: [
        '@nuxtjs/tailwindcss',
        '@pinia/nuxt',
      ],
      vite: {
        plugins: [
          Components({
            // add option {resolveIcons: true} as parameter for resolving problem with icons
            resolvers: [AntDesignVueResolver({resolveIcons: true})],
          }),
        ],
        ssr: {
          noExternal: ['moment', 'compute-scroll-into-view', 'ant-design-vue','@ant-design/icons-vue'],
        },  
      },
})
