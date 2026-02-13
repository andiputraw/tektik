<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { fetchUser } = useAuth()

onMounted(() => {
  fetchUser()
})
</script>
