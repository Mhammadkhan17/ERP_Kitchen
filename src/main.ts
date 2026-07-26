import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import router from './router'
import { KitchenPreset } from './plugins/primevue'
import 'primeicons/primeicons.css'
import 'virtual:uno.css'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin)
app.use(PrimeVue, { theme: { preset: KitchenPreset, options: { darkModeSelector: '' } } })
app.use(ConfirmationService)
app.use(ToastService)

app.mount('#app')
