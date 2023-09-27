import { useAuthStore } from "~~/store/auth"

export default defineNuxtRouteMiddleware((to, from) => {
    const { isAuthenticated } = useAuthStore()

    if(to.name === 'index' && !isAuthenticated) {
        return navigateTo('/auth')
    }
    
    if (to.name === 'auth' && isAuthenticated) {
      return navigateTo('/')
    }
  })