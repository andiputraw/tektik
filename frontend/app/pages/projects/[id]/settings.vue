<template>
  <div class="max-w-2xl mx-auto">
    <!-- Back button -->
    <Button variant="ghost" size="sm" class="mb-4" @click="navigateTo(`/projects/${projectId}`)">
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to board
    </Button>

    <div v-if="loading" class="space-y-4">
      <div class="h-10 w-2/3 rounded bg-muted/50 animate-pulse" />
      <div class="h-32 rounded bg-muted/50 animate-pulse" />
    </div>

    <template v-else-if="project">
      <!-- Project settings -->
      <Card class="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="project-name">Name</Label>
            <div class="flex gap-2">
              <Input id="project-name" v-model="projectName" class="flex-1" />
              <Button size="sm" @click="updateProject" :disabled="projectName === project.name">
                Save
              </Button>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="project-desc">Description</Label>
            <div class="flex gap-2">
              <Input id="project-desc" v-model="projectDesc" class="flex-1" />
              <Button size="sm" @click="updateProject" :disabled="projectDesc === project.description">
                Save
              </Button>
            </div>
          </div>
          
          <div class="space-y-4 pt-4 border-t border-border/50">
            <Label for="project-color">Project Color</Label>
            <div class="flex gap-4 items-center">
               <div class="relative w-12 h-12 rounded-lg border border-border overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                 <Input id="project-color" v-model="projectColor" type="color" class="absolute inset-0 w-[150%] h-[150%] p-0 -m-[25%] cursor-pointer opacity-0" />
                 <div class="w-full h-full" :style="{ backgroundColor: projectColor }"></div>
               </div>
               <Input v-model="projectColor" class="w-32 font-mono" placeholder="#000000" />
               <Button size="sm" @click="updateProject" :disabled="projectColor === project.color">
                  Save Color
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Members -->
      <Card class="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Members</CardTitle>
            <Dialog v-model:open="showInvite">
              <DialogTrigger as-child>
                <Button size="sm">
                  <UserPlus class="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Member</DialogTitle>
                  <DialogDescription>Enter the email of the user you want to invite</DialogDescription>
                </DialogHeader>
                <form @submit.prevent="inviteMember" class="space-y-4">
                  <div class="space-y-2">
                    <Label for="invite-email">Email</Label>
                    <Input id="invite-email" v-model="inviteEmail" type="email" placeholder="user@example.com" required />
                  </div>
                  <div class="flex justify-end gap-2">
                    <Button type="button" variant="outline" @click="showInvite = false">Cancel</Button>
                    <Button type="submit" :disabled="inviting">
                      <Loader2 v-if="inviting" class="mr-2 h-4 w-4 animate-spin" />
                      Send Invite
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div
              v-for="member in members"
              :key="member.id"
              class="flex items-center justify-between rounded-lg border border-border/50 p-3"
            >
              <div class="flex items-center gap-3">
                <Avatar class="h-8 w-8">
                  <AvatarFallback class="bg-primary/20 text-primary text-xs">
                    {{ (member.userName || '?').slice(0, 2).toUpperCase() }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p class="text-sm font-medium">{{ member.userName }}</p>
                  <p class="text-xs text-muted-foreground">{{ member.userEmail }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="member.role === 'owner' ? 'default' : 'secondary'" class="text-xs">
                  {{ member.role }}
                </Badge>
                <Button
                  v-if="member.role !== 'owner' && isOwner"
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 text-destructive"
                  @click="removeMember(member.userId)"
                >
                  <X class="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Webhooks -->
      <WebhookSettings v-if="isOwner" :project-id="projectId" />

      <!-- Danger zone -->
      <Card v-if="isOwner" class="border-destructive/30 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle class="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium">Delete Project</p>
              <p class="text-xs text-muted-foreground">This action cannot be undone</p>
            </div>
            <Button variant="destructive" size="sm" @click="deleteProject">
              <Trash2 class="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, UserPlus, X, Trash2, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import WebhookSettings from '~/components/WebhookSettings.vue'

const route = useRoute()
const projectId = route.params.id as string
const { user } = useAuth()

const api = useApi()
const project = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const projectName = ref('')
const projectDesc = ref('')
const projectColor = ref('#000000')
const showInvite = ref(false)
const inviteEmail = ref('')
const inviting = ref(false)

const isOwner = computed(() => project.value?.ownerId === user.value?.id)

async function loadSettings() {
  loading.value = true
  try {
    const [p, m] = await Promise.all([
      api.get(`/api/projects/${projectId}`),
      api.get(`/api/projects/${projectId}/members`),
    ])
    project.value = p
    members.value = m
    projectName.value = p.name
    projectDesc.value = p.description || ''
    projectColor.value = p.color || '#3b82f6'
  } catch {
    toast.error('Failed to load settings')
    navigateTo('/projects')
  } finally {
    loading.value = false
  }
}

async function updateProject() {
  try {
    const updated = await api.put(`/api/projects/${projectId}`, {
      name: projectName.value,
      description: projectDesc.value,
      color: projectColor.value,
    })
    project.value = updated
    toast.success('Project updated')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to update')
  }
}

async function inviteMember() {
  inviting.value = true
  try {
    await api.post(`/api/projects/${projectId}/members`, {
      email: inviteEmail.value,
    })
    showInvite.value = false
    inviteEmail.value = ''
    toast.success('Invitation sent!')
    const m = await api.get(`/api/projects/${projectId}/members`)
    members.value = m
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to invite')
  } finally {
    inviting.value = false
  }
}

async function removeMember(userId: string) {
  if (!confirm('Remove this member?')) return
  try {
    await api.del(`/api/projects/${projectId}/members/${userId}`)
    members.value = members.value.filter(m => m.userId !== userId)
    toast.success('Member removed')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to remove member')
  }
}

async function deleteProject() {
  if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return
  try {
    await api.del(`/api/projects/${projectId}`)
    toast.success('Project deleted')
    navigateTo('/projects')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to delete')
  }
}

onMounted(loadSettings)
</script>
