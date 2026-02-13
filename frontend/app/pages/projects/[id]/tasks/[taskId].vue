<template>
  <div class="max-w-2xl mx-auto">
    <!-- Back button -->
    <Button variant="ghost" size="sm" class="mb-4" @click="navigateTo(`/projects/${projectId}`)">
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to board
    </Button>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-10 w-2/3 rounded bg-muted/50 animate-pulse" />
      <div class="h-6 w-1/2 rounded bg-muted/50 animate-pulse" />
      <div class="h-32 rounded bg-muted/50 animate-pulse" />
    </div>

    <template v-else-if="task">
      <!-- Task header -->
      <Card class="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-xl">{{ task.title }}</CardTitle>
              <CardDescription v-if="task.description" class="mt-2">
                {{ task.description }}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon"><MoreHorizontal class="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="showEditDialog = true" class="cursor-pointer">
                  <Pencil class="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="deleteTask" class="text-destructive focus:text-destructive cursor-pointer">
                  <Trash2 class="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-4 text-sm">
            <!-- Assignee -->
            <div class="flex items-center gap-2">
              <UserCircle class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">Assignee:</span>
              <div class="flex items-center gap-2">
                <select
                  v-model="task.assigneeId"
                  class="bg-muted border border-border rounded px-2 py-1 text-sm"
                  @change="updateAssignee"
                >
                  <option :value="null">Unassigned</option>
                  <option v-for="m in members" :key="m.userId" :value="m.userId">
                    {{ m.userName }}
                  </option>
                </select>
              </div>
            </div>
            <!-- Due date -->
            <div v-if="task.dueDate" class="flex items-center gap-2">
              <Calendar class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">Due:</span>
              <span>{{ formatDate(task.dueDate) }}</span>
            </div>
            <!-- Status -->
            <div class="flex items-center gap-2">
              <CircleDot class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">Status:</span>
              <Badge variant="outline">{{ statusName }}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Comments -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Comments</h3>
        <CommentList :task-id="taskId" />
      </div>
    </template>

    <!-- Edit dialog -->
    <TaskDialog
      v-model:open="showEditDialog"
      :editing="true"
      :initial-title="task?.title"
      :initial-description="task?.description || ''"
      :initial-due-date="task?.dueDate || ''"
      @submit="handleEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, UserCircle, Calendar, CircleDot } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const projectId = route.params.id as string
const taskId = route.params.taskId as string

const api = useApi()
const task = ref<any>(null)
const members = ref<any[]>([])
const statuses = ref<any[]>([])
const loading = ref(true)
const showEditDialog = ref(false)

const statusName = computed(() => {
  const s = statuses.value.find(s => s.id === task.value?.statusId)
  return s?.name || 'Unknown'
})

async function loadTask() {
  loading.value = true
  try {
    const [t, m, s] = await Promise.all([
      api.get(`/api/tasks/${taskId}`),
      api.get(`/api/projects/${projectId}/members`),
      api.get(`/api/projects/${projectId}/statuses`),
    ])
    task.value = t
    members.value = m
    statuses.value = s
  } catch {
    toast.error('Task not found')
    navigateTo(`/projects/${projectId}`)
  } finally {
    loading.value = false
  }
}

async function updateAssignee() {
  try {
    await api.patch(`/api/tasks/${taskId}/assign`, {
      assigneeId: task.value.assigneeId || null,
    })
    toast.success('Assignee updated')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to update assignee')
  }
}

async function handleEdit(data: { title: string; description: string; dueDate: string }) {
  try {
    const updated = await api.put(`/api/tasks/${taskId}`, {
      title: data.title,
      description: data.description || undefined,
      dueDate: data.dueDate || null,
    })
    task.value = updated
    showEditDialog.value = false
    toast.success('Task updated')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to update task')
  }
}

async function deleteTask() {
  if (!confirm('Delete this task?')) return
  try {
    await api.del(`/api/tasks/${taskId}`)
    toast.success('Task deleted')
    navigateTo(`/projects/${projectId}`)
  } catch {
    toast.error('Failed to delete task')
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

onMounted(loadTask)
</script>
