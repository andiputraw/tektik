<template>
  <nav class="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Logo -->
      <div class="flex items-center gap-8">
        <NuxtLink to="/projects" class="flex items-center gap-2 group">
          <div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110">
            T
          </div>
          <span class="text-lg font-semibold hidden sm:inline bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Tektik
          </span>
        </NuxtLink>
        <div class="hidden md:flex items-center gap-6">
            <NuxtLink to="/projects" class="text-sm font-medium transition-colors hover:text-primary text-muted-foreground" active-class="!text-primary font-bold">Projects</NuxtLink>
            <NuxtLink to="/tasks" class="text-sm font-medium transition-colors hover:text-primary text-muted-foreground" active-class="!text-primary font-bold">My Tasks</NuxtLink>
        </div>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <NotificationBell />

        <!-- User dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="relative rounded-full">
              <Avatar class="h-8 w-8">
                <AvatarFallback class="bg-primary/20 text-primary text-xs font-medium">
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>
              <div class="flex flex-col">
                <span>{{ user?.name }}</span>
                <span class="text-xs text-muted-foreground font-normal">{{ user?.email }}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="logout" class="text-destructive focus:text-destructive cursor-pointer">
              <LogOut class="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

const { user, logout } = useAuth()

const userInitials = computed(() => {
  if (!user.value) return '?'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>
