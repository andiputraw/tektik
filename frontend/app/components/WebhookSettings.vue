<template>
  <Card class="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Send real-time events to external URLs</CardDescription>
        </div>
        <Dialog v-model:open="showCreate">
          <DialogTrigger as-child>
            <Button size="sm">
              <Plus class="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Webhook</DialogTitle>
              <DialogDescription>Enter the URL and select events to trigger</DialogDescription>
            </DialogHeader>
            <form @submit.prevent="createWebhook" class="space-y-4">
              <div class="space-y-2">
                <Label for="webhook-url">Payload URL</Label>
                <Input id="webhook-url" v-model="newUrl" placeholder="https://api.example.com/webhook" required />
              </div>
              <div class="space-y-2">
                <Label>Events</Label>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center space-x-2">
                    <Checkbox id="event-all" :checked="selectedEvents.includes('*')" @update:checked="(v) => toggleEvent('*', v)" />
                    <Label for="event-all">All Events</Label>
                  </div>
                  <div class="flex items-center space-x-2" v-for="ev in availableEvents" :key="ev">
                    <Checkbox :id="'event-'+ev" :checked="selectedEvents.includes(ev)" @update:checked="(v) => toggleEvent(ev, v)" :disabled="selectedEvents.includes('*')" />
                    <Label :for="'event-'+ev">{{ ev }}</Label>
                  </div>
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <Button type="button" variant="outline" @click="showCreate = false">Cancel</Button>
                <Button type="submit" :disabled="creating || !newUrl">
                  <Loader2 v-if="creating" class="mr-2 h-4 w-4 animate-spin" />
                  Add Webhook
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-2">
        <div class="h-12 rounded bg-muted/50 animate-pulse" />
        <div class="h-12 rounded bg-muted/50 animate-pulse" />
      </div>
      <div v-else-if="webhooks.length === 0" class="text-center py-6 text-muted-foreground text-sm">
        No webhooks configured
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="hook in webhooks"
          :key="hook.id"
          class="flex items-center justify-between rounded-lg border border-border/50 p-3"
        >
          <div>
             <div class="flex items-center gap-2">
                <p class="font-medium text-sm truncate max-w-[300px]">{{ hook.url }}</p>
                <Badge variant="outline" class="text-[10px]">{{ hook.active ? 'Active' : 'Inactive' }}</Badge>
             </div>
             <p class="text-xs text-muted-foreground mt-1">
               {{ formatEvents(hook.events) }}
             </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-destructive"
            @click="deleteWebhook(hook.id)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Plus, Trash2, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
  projectId: string
}>()

const api = useApi()
const webhooks = ref<any[]>([])
const loading = ref(true)
const showCreate = ref(false)
const creating = ref(false)

// Form
const newUrl = ref('')
const selectedEvents = ref<string[]>(['*'])
const availableEvents = ['TASK_CREATED', 'TASK_UPDATED', 'TASK_MOVED', 'TASK_ASSIGNED', 'TASK_DELETED', 'COMMENT_CREATED']

function toggleEvent(event: string, checked: boolean) {
  if (event === '*') {
    if (checked) selectedEvents.value = ['*']
    else selectedEvents.value = []
    return
  }
  
  if (checked) {
    selectedEvents.value.push(event)
  } else {
    selectedEvents.value = selectedEvents.value.filter(e => e !== event)
  }
  
  // If manual selection, ensure * is removed
  if (selectedEvents.value.includes('*') && event !== '*') {
    selectedEvents.value = selectedEvents.value.filter(e => e !== '*')
  }
}

function formatEvents(eventsJson: string) {
  try {
    const events = JSON.parse(eventsJson)
    if (events.includes('*')) return 'All events'
    return events.join(', ')
  } catch {
    return 'Invalid configuration'
  }
}

async function loadWebhooks() {
  loading.value = true
  try {
    webhooks.value = await api.get(`/api/projects/${props.projectId}/webhooks`)
  } catch {
    toast.error('Failed to load webhooks')
  } finally {
    loading.value = false
  }
}

async function createWebhook() {
  creating.value = true
  try {
    const hook = await api.post(`/api/projects/${props.projectId}/webhooks`, {
      url: newUrl.value,
      events: selectedEvents.value
    })
    webhooks.value.push(hook)
    showCreate.value = false
    newUrl.value = ''
    selectedEvents.value = ['*']
    toast.success('Webhook added')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to add webhook')
  } finally {
    creating.value = false
  }
}

async function deleteWebhook(id: string) {
  if (!confirm('Delete this webhook?')) return
  try {
    await api.del(`/api/webhooks/${id}`) // Assuming global ID delete or project scoped?
    // Project scoped usually safer: /api/projects/:pid/webhooks/:wid
    // But our route structure might vary. Let's start with project scoped if possible.
    // Wait, I haven't implemented the *routes* for webhooks yet! 
    // I implemented Service and Repo, but not the Controller/Routes.
    
    // Changing delete logic in next step when implementing routes.
    // For now, I'll assume /api/webhooks/:id for deletion as global resource or specific route.
    // Let's stick to /api/projects/${props.projectId}/webhooks/${id} for consistency.
    await api.del(`/api/projects/${props.projectId}/webhooks/${id}`)
    
    webhooks.value = webhooks.value.filter(h => h.id !== id)
    toast.success('Webhook deleted')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to delete webhook')
  }
}

onMounted(loadWebhooks)
</script>
