<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ editing ? 'Edit Task' : 'New Task' }}</DialogTitle>
        <DialogDescription>{{ editing ? 'Update task details' : 'Add a new task to the board' }}</DialogDescription>
      </DialogHeader>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="task-title">Title</Label>
          <Input id="task-title" v-model="title" placeholder="Task title" required />
        </div>
        <div class="space-y-2">
          <Label for="task-desc">Description</Label>
          <Input id="task-desc" v-model="description" placeholder="Optional description" />
        </div>
        <div class="space-y-2">
          <Label for="task-due">Due date</Label>
          <Input id="task-due" v-model="dueDate" type="date" />
        </div>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="submitting">
            <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ editing ? 'Save' : 'Create' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  editing?: boolean
  initialTitle?: string
  initialDescription?: string
  initialDueDate?: string
}>()

const emit = defineEmits<{
  submit: [data: { title: string; description: string; dueDate: string }]
}>()

const title = ref(props.initialTitle || '')
const description = ref(props.initialDescription || '')
const dueDate = ref(props.initialDueDate || '')
const submitting = ref(false)

watch(() => props.initialTitle, (v) => { title.value = v || '' })
watch(() => props.initialDescription, (v) => { description.value = v || '' })
watch(() => props.initialDueDate, (v) => { dueDate.value = v || '' })

function handleSubmit() {
  emit('submit', {
    title: title.value,
    description: description.value,
    dueDate: dueDate.value,
  })
  if (!props.editing) {
    title.value = ''
    description.value = ''
    dueDate.value = ''
  }
}
</script>
