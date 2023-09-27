import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({ authenicated: true }),
    getters: {
        isAuthenticated: (state) => state.authenicated,
    },
    actions: {
      login(username: string, password: string): boolean {
        if (username && password && username === password && username === "admin") {
            this.authenicated = true;
            return true;
        } else {
            return false;
        }
      },
      logout() {
        this.authenicated = false;
      },
    },
})