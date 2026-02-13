<template>
  <div>
    <!-- Add comment form -->
    <form @submit.prevent="addComment" class="mb-4">
      <div class="flex gap-2">
        <Input
          v-model="newComment"
          placeholder="Write a comment..."
          class="flex-1"
          required
        />
        <Button type="submit" size="sm" :disabled="!newComment.trim() || submitting">
          <Send class="h-4 w-4" />
        </Button>
      </div>
    </form>

    <!-- Comments list -->
    <div v-if="comments.length === 0" class="text-center text-sm text-muted-foreground py-8">
      No comments yet. Be the first to comment.
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="group rounded-lg border border-border/50 bg-muted/30 p-3"
      >
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <Avatar class="h-6 w-6">
              <AvatarFallback class="bg-primary/20 text-primary text-[10px]">
                {{ (comment.authorName || '?').slice(0, 2).toUpperCase() }}
              </AvatarFallback>
            </Avatar>
            <span class="text-sm font-medium">{{ comment.authorName || 'Unknown' }}</span>
            <span class="text-xs text-muted-foreground">{{ formatTime(comment.createdAt) }}</span>
          </div>
          <div v-if="comment.authorId === currentUserId" class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button variant="ghost" size="icon" class="h-6 w-6" @click="startEdit(comment)">
              <Pencil class="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" class="h-6 w-6 text-destructive" @click="deleteComment(comment.id)">
              <Trash2 class="h-3 w-3" />
            </Button>
          </div>
        </div>
        <!-- Edit mode -->
        <div v-if="editingId === comment.id" class="flex gap-2 mt-1">
          <Input v-model="editContent" class="flex-1 text-sm" @keyup.escape="editingId = ''" />
          <Button size="sm" @click="saveEdit(comment.id)">Save</Button>
          <Button size="sm" variant="ghost" @click="editingId = ''">Cancel</Button>
        </div>
        <p v-else class="text-sm text-foreground/90 ml-8">{{ comment.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Send, Pencil, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{ taskId: string }>()

interface Comment {
  id: string
  taskId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string
  authorName?: string
}

const api = useApi()
const { user } = useAuth()
const comments = ref<Comment[]>([])
const newComment = ref('')
const submitting = ref(false)
const editingId = ref('')
const editContent = ref('')

const currentUserId = computed(() => user.value?.id || '')

async function loadComments() {
  try {
    comments.value = await api.get<Comment[]>(`/api/tasks/${props.taskId}/comments`)
  } catch {
    // silent
  }
}

async function addComment() {
  if (!newComment.value.trim()) return
  submitting.value = true
  try {
    const c = await api.post<Comment>(`/api/tasks/${props.taskId}/comments`, {
      content: newComment.value,
    })
    comments.value.push(c)
    newComment.value = ''
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to add comment')
  } finally {
    submitting.value = false
  }
}

function startEdit(comment: Comment) {
  editingId.value = comment.id
  editContent.value = comment.content
}

async function saveEdit(commentId: string) {
  try {
    const updated = await api.put<Comment>(`/api/comments/${commentId}`, {
      content: editContent.value,
    })
    const idx = comments.value.findIndex(c => c.id === commentId)
    if (idx !== -1) comments.value[idx] = updated
    editingId.value = ''
    toast.success('Comment updated')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to update comment')
  }
}

async function deleteComment(commentId: string) {
  try {
    await api.del(`/api/comments/${commentId}`)
    comments.value = comments.value.filter(c => c.id !== commentId)
    toast.success('Comment deleted')
  } catch (err: any) {
    toast.error(err?.data?.error || 'Failed to delete comment')
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(loadComments)
</script>
