<template>
  <div class="min-h-screen bg-background">
    <AppNavbar />
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
    <Sonner position="bottom-right" :theme="'dark'" rich-colors />
  </div>
</template>
