<template>
  <div
    class="group relative rounded-xl border border-border/50 bg-card/50 p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
    @click.stop="$emit('click')"
  >
    <div class="flex items-start justify-between gap-2">
      <h4 class="text-sm font-medium leading-snug line-clamp-2">{{ task.title }}</h4>
    </div>
    <p v-if="task.description" class="mt-1 text-xs text-muted-foreground line-clamp-2">
      {{ task.description }}
    </p>
    <div class="mt-2 flex items-center gap-2 flex-wrap">
      <Badge v-if="task.dueDate" variant="outline" class="text-[10px] gap-1 h-5">
        <Calendar class="h-3 w-3" />
        {{ formatDate(task.dueDate) }}
      </Badge>
      <div class="flex-1" />
      <Avatar v-if="task.assigneeId" class="h-5 w-5">
        <AvatarFallback class="bg-primary/20 text-primary text-[8px] font-medium">
          {{ task.assigneeId.slice(0, 2).toUpperCase() }}
        </AvatarFallback>
      </Avatar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'

defineProps<{
  task: {
    id: string
    projectId: string
    statusId: string
    assigneeId: string | null
    title: string
    description: string | null
    dueDate: string | null
    position: number
    createdAt: string
  }
}>()

defineEmits<{
  click: []
}>()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
