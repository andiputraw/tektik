<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">Projects</h1>
        <p class="text-muted-foreground">Manage your projects and boards</p>
      </div>
      <Dialog v-model:open="showCreate">
        <DialogTrigger as-child>
          <Button>
            <Plus class="mr-2 h-4 w-4" />
            New Project
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Add a new project to your workspace</DialogDescription>
          </DialogHeader>
          <form @submit.prevent="createProject" class="space-y-4">
            <div class="space-y-2">
              <Label for="project-name">Name</Label>
              <Input id="project-name" v-model="newName" placeholder="My awesome project" required />
            </div>
            <div class="space-y-2">
              <Label for="project-desc">Description</Label>
              <Input id="project-desc" v-model="newDesc" placeholder="What's this project about?" />
            </div>
            <div class="flex justify-end gap-2">
              <Button type="button" variant="outline" @click="showCreate = false">Cancel</Button>
              <Button type="submit" :disabled="creating">
                <Loader2 v-if="creating" class="mr-2 h-4 w-4 animate-spin" />
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="h-40 rounded-xl bg-muted/50 animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-20">
      <div class="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <FolderKanban class="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-semibold">No projects yet</h3>
      <p class="text-muted-foreground mb-4">Create your first project to get started</p>
      <Button @click="showCreate = true">
        <Plus class="mr-2 h-4 w-4" />
        New Project
      </Button>
    </div>

    <!-- Project grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        @click="navigateTo(`/projects/${project.id}`)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, FolderKanban, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

interface Project {
  id: string
  name: string
  description: string
  color?: string
  ownerId: string
  archived: number
  createdAt: string
}

const api = useApi()
const projects = ref<Project[]>([])
const loading = ref(true)
const showCreate = ref(false)
const newName = ref('')
const newDesc = ref('')
const creating = ref(false)

async function loadProjects() {
  try {
    loading.value = true
    projects.value = await api.get<Project[]>('/api/projects')
  } catch {
    toast.error('Failed to load projects')
  } finally {
    loading.value = false
  }
}

async function createProject() {
  creating.value = true
  try {
    const project = await api.post<Project>('/api/projects', {
      name: newName.value,
      description: newDesc.value,
    })
    projects.value.push(project)
    showCreate.value = false
    newName.value = ''
    newDesc.value = ''
    toast.success('Project created!')
    navigateTo(`/projects/${project.id}`)
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to create project')
  } finally {
    creating.value = false
  }
}

onMounted(loadProjects)
</script>
