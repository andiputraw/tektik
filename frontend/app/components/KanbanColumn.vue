<template>
  <div class="flex flex-col min-w-[280px] max-w-[320px] w-full shrink-0">
    <!-- Column header -->
    <div class="flex items-center justify-between mb-3 px-1">
      <div class="flex items-center gap-2">
        <div class="h-2.5 w-2.5 rounded-full" :class="dotColor" />
        <h3 class="text-sm font-semibold">{{ status.name }}</h3>
        <span class="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
          {{ tasks.length }}
        </span>
      </div>
      <Button variant="ghost" size="icon" class="h-6 w-6" @click="$emit('addTask')">
        <Plus class="h-3.5 w-3.5" />
      </Button>
    </div>

    <!-- Draggable task list -->
    <div class="flex-1 rounded-xl bg-muted/30 border border-border/30 p-2 min-h-[200px]">
      <draggable
        :list="tasks"
        group="kanban"
        item-key="id"
        :animation="200"
        ghost-class="opacity-30"
        drag-class="rotate-2"
        class="space-y-2 min-h-[180px]"
        @change="handleChange"
      >
        <template #item="{ element }">
          <TaskCard
            :task="element"
            @click="$emit('openTask', element)"
          />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { Plus } from 'lucide-vue-next'

const props = defineProps<{
  status: { id: string; name: string; position: number }
  tasks: any[]
  columnIndex: number
}>()

const emit = defineEmits<{
  addTask: []
  openTask: [task: any]
  taskMoved: [task: any, statusId: string, position: number]
}>()

const dotColors = [
  'bg-blue-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500',
]
const dotColor = computed(() => dotColors[props.columnIndex % dotColors.length])

function handleChange(evt: any) {
  if (evt.added) {
    emit('taskMoved', evt.added.element, props.status.id, evt.added.newIndex)
  }
  if (evt.moved) {
    emit('taskMoved', evt.moved.element, props.status.id, evt.moved.newIndex)
  }
}
</script>
