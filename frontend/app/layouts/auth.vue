<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Tektik
        </h1>
        <p class="text-muted-foreground mt-2">Project Management</p>
      </div>
      <slot />
    </div>
    <Sonner position="bottom-right" :theme="'dark'" rich-colors />
  </div>
</template>
