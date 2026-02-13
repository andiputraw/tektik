<template>
  <div>
    <Card class="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle class="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
            />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <Button type="submit" class="w-full" :disabled="submitting">
            <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
            Sign in
          </Button>

          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div id="google-btn" class="flex justify-center min-h-[40px]"></div>
        </form>
      </CardContent>
      <CardFooter class="justify-center">
        <p class="text-sm text-muted-foreground">
          Don't have an account?
          <NuxtLink to="/register" class="text-primary hover:underline font-medium">
            Register
          </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const { login, loginWithProvider } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

useHead({
  script: [
    {
      src: 'https://accounts.google.com/gsi/client',
      async: true,
      defer: true
    }
  ]
})

async function handleLogin() {
  error.value = ''
  submitting.value = true
  try {
    await login(email.value, password.value)
    navigateTo('/projects')
  } catch (err: any) {
    error.value = err?.data?.error || err?.message || 'Login failed'
  } finally {
    submitting.value = false
  }
}

const handleGoogleLogin = async (response: any) => {
  error.value = ''
  submitting.value = true
  try {
    await loginWithProvider('google', { idToken: response.credential })
    navigateTo('/projects')
  } catch (err: any) {
    error.value = err?.data?.error || err?.message || 'Login failed'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // TODO: Replace with actual Google Client ID from env
  const googleClientId = "YOUR_GOOGLE_CLIENT_ID" 
  
  if ((window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleLogin
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("google-btn"),
        { theme: "outline", size: "large", width: 350, type: "standard" } // width is pixels or "100%" (but "100%" needs string)
      );
  }
})
</script>
