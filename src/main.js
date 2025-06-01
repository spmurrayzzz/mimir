import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from 'vue-query'
import App from './App.vue'
import router from './router'
import bridgePlugin from './plugins/bridge'
import './styles/main.css'

// Create the app instance
const app = createApp(App)

// Register plugins
app.use(createPinia())
app.use(router)
app.use(bridgePlugin)
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  },
})

// Mount the app
app.mount('#app')