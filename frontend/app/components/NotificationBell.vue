<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="ghost" size="icon" class="relative" @click="loadNotifications">
        <Bell class="h-5 w-5" />
        <span
          v-if="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-pulse"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-80 p-0">
      <div class="flex items-center justify-between border-b border-border p-3">
        <h4 class="text-sm font-semibold">Notifications</h4>
        <Button
          v-if="unreadCount > 0"
          variant="ghost"
          size="sm"
          class="text-xs h-7"
          @click="markAllRead"
        >
          Mark all read
        </Button>
      </div>
      <ScrollArea class="max-h-72">
        <div v-if="notifications.length === 0" class="p-6 text-center text-sm text-muted-foreground">
          No notifications yet
        </div>
        <div v-else>
          <div
            v-for="notif in notifications"
            :key="notif.id"
            class="flex items-start gap-3 border-b border-border/50 p-3 transition-colors hover:bg-muted/50 cursor-pointer"
            :class="{ 'bg-primary/5': !notif.read }"
            @click="markRead(notif)"
          >
            <div class="mt-0.5 h-2 w-2 rounded-full shrink-0" :class="notif.read ? 'bg-transparent' : 'bg-primary'" />
            <div class="flex-1 min-w-0">
              <p class="text-sm leading-snug">{{ notif.message }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ formatTime(notif.createdAt) }}</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { Bell } from 'lucide-vue-next'

interface Notification {
  id: string
  userId: string
  type: string
  message: string
  data: string | null
  read: number
  createdAt: string
}

const api = useApi()
const notifications = ref<Notification[]>([])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

async function loadNotifications() {
  try {
    notifications.value = await api.get<Notification[]>('/api/notifications')
  } catch {
    // silently fail
  }
}

async function markRead(notif: Notification) {
  if (notif.read) return
  try {
    await api.patch(`/api/notifications/${notif.id}/read`)
    notif.read = 1
  } catch {
    // ignore
  }
}

async function markAllRead() {
  try {
    await api.patch('/api/notifications/read-all')
    notifications.value.forEach(n => (n.read = 1))
  } catch {
    // ignore
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

// Load on initial mount
onMounted(loadNotifications)
// Poll every 30s
const interval = setInterval(loadNotifications, 30000)
onUnmounted(() => clearInterval(interval))
</script>
