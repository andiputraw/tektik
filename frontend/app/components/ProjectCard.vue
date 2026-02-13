<template>
  <Card
    class="group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    :style="{ borderLeft: `4px solid ${project.color || '#3b82f6'}` }"
  >
    <CardHeader class="pb-2">
      <div class="flex items-start justify-between">
        <div 
          class="h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
          :style="{ backgroundColor: (project.color || '#3b82f6') + '20' }"
        >
          <FolderKanban class="h-5 w-5" :style="{ color: project.color || '#3b82f6' }" />
        </div>
      </div>
      <CardTitle class="text-base mt-3">{{ project.name }}</CardTitle>
      <CardDescription v-if="project.description" class="line-clamp-2">
        {{ project.description }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar class="h-3 w-3" />
        <span>Created {{ formatDate(project.createdAt) }}</span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { FolderKanban, Calendar } from 'lucide-vue-next'

defineProps<{
  project: {
    id: string
    name: string
    description: string
    color?: string
    ownerId: string
    archived: number
    createdAt: string
  }
}>()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>
