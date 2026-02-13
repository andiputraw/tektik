<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="navigateTo('/projects')">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <div v-if="project?.color" class="h-6 w-1.5 rounded-full mr-2" :style="{ backgroundColor: project.color }" />
          <h1 class="text-2xl font-bold">{{ project?.name || 'Loading...' }}</h1>
        </div>
        <p v-if="project?.description" class="text-muted-foreground ml-10">
          {{ project.description }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative w-40 md:w-60">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input v-model="searchQuery" placeholder="Search tasks..." class="pl-8 h-9" />
        </div>
        
        <Select v-model="assigneeFilter">
            <SelectTrigger class="w-[140px] h-9">
                <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="me">Assigned to Me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <DropdownMenuSeparator />
                <SelectItem v-for="member in members" :key="member.userId" :value="member.userId">
                    {{ member.userName }}
                </SelectItem>
            </SelectContent>
        </Select>

        <Button variant="outline" size="sm" @click="navigateTo(`/projects/${projectId}/settings`)">
          <Settings class="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingBoard" class="flex gap-4 overflow-x-auto pb-4">
      <div v-for="i in 3" :key="i" class="min-w-[280px] h-64 rounded-xl bg-muted/50 animate-pulse" />
    </div>

    <!-- Kanban Board -->
    <div v-else class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
      <KanbanColumn
        v-for="(status, idx) in statuses"
        :key="status.id"
        :status="status"
        :tasks="tasksByStatus[status.id] || []"
        :column-index="idx"
        @add-task="openCreateTask(status.id)"
        @open-task="openTask"
        @task-moved="handleTaskMoved"
      />
    </div>

    <!-- Create task dialog -->
    <TaskDialog
      v-model:open="showCreateTask"
      @submit="handleCreateTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Settings, Search } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { user } = useAuth()

const route = useRoute()
const projectId = route.params.id as string

interface Status { id: string; name: string; position: number; projectId: string }
interface Task {
  id: string; projectId: string; statusId: string; assigneeId: string | null;
  title: string; description: string | null; dueDate: string | null;
  title: string; description: string | null; dueDate: string | null;
  position: number; createdAt: string
}

const { onMessage } = useWebSocket(projectId)
onMessage(() => {
  // Silent refresh to avoid flashing
  loadBoard(true)
})

const api = useApi()
const project = ref<any>(null)
const statuses = ref<Status[]>([])
const tasks = ref<Task[]>([])
const members = ref<any[]>([]) // Add members
const loadingBoard = ref(true)
const showCreateTask = ref(false)
const createStatusId = ref('')

const searchQuery = ref('')
const assigneeFilter = ref('all')

const tasksByStatus = computed(() => {
  const map: Record<string, Task[]> = {}
  for (const s of statuses.value) {
    map[s.id] = []
  }
  
  // Filter tasks
  const validTasks = tasks.value.filter(t => {
      // Search
      if (searchQuery.value && !t.title.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
      
      // Assignee
      if (assigneeFilter.value === 'me') return t.assigneeId === user.value?.id
      if (assigneeFilter.value === 'unassigned') return !t.assigneeId
      if (assigneeFilter.value !== 'all' && t.assigneeId !== assigneeFilter.value) return false
      
      return true
  })

  for (const t of validTasks) {
    if (map[t.statusId]) {
      map[t.statusId].push(t)
    }
  }
  // Sort by position within each column
  for (const key in map) {
    map[key].sort((a, b) => a.position - b.position)
  }
  return map
})

async function loadBoard(silent = false) {
  if (!silent) loadingBoard.value = true
  try {
    const [p, s, t, m] = await Promise.all([
      api.get(`/api/projects/${projectId}`),
      api.get<Status[]>(`/api/projects/${projectId}/statuses`),
      api.get<Task[]>(`/api/projects/${projectId}/tasks`),
      api.get<any[]>(`/api/projects/${projectId}/members`),
    ])
    project.value = p
    statuses.value = s.sort((a: Status, b: Status) => a.position - b.position)
    tasks.value = t
    members.value = m
  } catch {
    toast.error('Failed to load board')
    if (!silent) navigateTo('/projects')
  } finally {
    if (!silent) loadingBoard.value = false
  }
}

function openCreateTask(statusId: string) {
  createStatusId.value = statusId
  showCreateTask.value = true
}

async function handleCreateTask(data: { title: string; description: string; dueDate: string }) {
  try {
    const task = await api.post<Task>(`/api/projects/${projectId}/tasks`, {
      title: data.title,
      description: data.description || undefined,
      statusId: createStatusId.value,
      dueDate: data.dueDate || undefined,
    })
    tasks.value.push(task)
    showCreateTask.value = false
    toast.success('Task created')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to create task')
  }
}

function openTask(task: Task) {
  navigateTo(`/projects/${projectId}/tasks/${task.id}`)
}

async function handleTaskMoved(task: Task, newStatusId: string, position: number) {
  // Update locally first for instant feedback
  const oldStatusId = task.statusId
  task.statusId = newStatusId
  task.position = position

  try {
    await api.patch(`/api/tasks/${task.id}/status`, {
      statusId: newStatusId,
      position,
    })
  } catch {
    // Revert on failure
    task.statusId = oldStatusId
    toast.error('Failed to move task')
    await loadBoard()
  }
}

onMounted(loadBoard)
</script>
