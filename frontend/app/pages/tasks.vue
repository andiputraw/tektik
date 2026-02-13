<template>
  <div class="h-full flex flex-col p-6 max-w-6xl mx-auto w-full">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p class="text-muted-foreground mt-1">
          View and manage all tasks assigned to you across projects.
        </p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-muted/50 animate-pulse" />
    </div>

    <div v-else-if="tasks.length === 0" class="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
      <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <CheckSquare class="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-medium">No tasks assigned</h3>
      <p class="text-muted-foreground text-sm mt-1">
        Tasks assigned to you will appear here.
      </p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="(group, projectName) in groupedTasks" :key="projectName" class="space-y-3">
        <div class="flex items-center gap-2">
            <h2 class="font-semibold text-lg">{{ projectName }}</h2>
            <Badge variant="outline" class="text-xs">{{ group.length }}</Badge>
        </div>
        <div class="grid gap-3">
            <Card v-for="task in group" :key="task.id" 
                class="transition-colors hover:bg-muted/30 cursor-pointer"
                @click="navigateTo(`/projects/${task.projectId}`)">
                <CardContent class="p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="h-2 w-2 rounded-full" :class="getStatusColor(task.statusName)" />
                        <div>
                            <p class="font-medium">{{ task.title }}</p>
                            <p class="text-xs text-muted-foreground" v-if="task.description">
                                {{ task.description.length > 60 ? task.description.substring(0, 60) + '...' : task.description }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <Badge variant="secondary">{{ task.statusName }}</Badge>
                        <div class="flex items-center text-xs text-muted-foreground w-24 justify-end">
                            <Calendar class="mr-2 h-3 w-3" />
                            {{ task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date' }}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckSquare, Calendar } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const api = useApi()
const tasks = ref<any[]>([])
const loading = ref(true)

const groupedTasks = computed(() => {
    const groups: Record<string, any[]> = {}
    for (const task of tasks.value) {
        if (!groups[task.projectName]) {
            groups[task.projectName] = []
        }
        groups[task.projectName].push(task)
    }
    return groups
})

function getStatusColor(status: string) {
    status = status.toLowerCase()
    if (status.includes('done') || status.includes('complete')) return 'bg-green-500'
    if (status.includes('progress')) return 'bg-blue-500'
    if (status.includes('review')) return 'bg-yellow-500'
    return 'bg-slate-300'
}

async function loadTasks() {
    loading.value = true
    try {
        tasks.value = await api.get('/api/tasks')
    } catch {
        toast.error('Failed to load tasks')
    } finally {
        loading.value = false
    }
}

onMounted(loadTasks)
</script>
