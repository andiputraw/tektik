<template>
  <div />
</template>

<script setup lang="ts">
const { isAuthenticated, loading } = useAuth()

watchEffect(() => {
  if (!loading.value) {
    navigateTo(isAuthenticated.value ? '/projects' : '/login')
  }
})
</script>
