<script setup lang="ts">
    import { useAuthStore } from '~~/store/auth';

    definePageMeta({
        middleware: 'auth'
    })

    const { login } = useAuthStore()
    const router = useRouter()
    const authError = ref(false)

    interface FormState {
        username: string;
        password: string;
    }

    const formState = reactive<FormState>({
        username: '',
        password: '',
    });

    const onFinish = (values: any) => {
        authError.value = false;
        if(login(values.username, values.password)){
            router.push({ name: 'index' })
        } else {
            authError.value = true;
        }
    };
  
    
</script>

<template>
    <div class="flex items-center justify-center h-screen">
        <section class="w-96 flex flex-col items-center justify-center">
            <div class="mb-2">
                <a-typography-title class="" :level="3">Felicity Interface</a-typography-title>
            </div>
            
            <a-typography-text v-show="authError" class="mb-2" type="danger">Incorrect credentials exe</a-typography-text>

            <a-form
                :model="formState"
                name="basic"
                :label-col="{ span: 8 }"
                :wrapper-col="{ span: 16 }"
                autocomplete="off"
                
                @finish="onFinish"
                >
                <a-form-item
                    label="Username"
                    name="username"
                    :rules="[{ required: true, message: 'Please input your username!' }]"
                >
                    <a-input v-model:value="formState.username" />
                </a-form-item>
            
                <a-form-item
                    label="Password"
                    name="password"
                    :rules="[{ required: true, message: 'Please input your password!' }]"
                >
                    <a-input-password v-model:value="formState.password" />
                </a-form-item>
            
                <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                    <a-button type="primary" html-type="submit">Submit</a-button>
                </a-form-item>
            </a-form>
        </section>
    </div>
  </template>
