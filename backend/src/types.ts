import type { AuthService } from "./services/auth.service";
import type { ProjectService } from "./services/project.service";
import type { MemberService } from "./services/member.service";
import type { TaskService } from "./services/task.service";
import type { StatusService } from "./services/status.service";
import type { CommentService } from "./services/comment.service";
import type { NotificationService } from "./services/notification.service";
import type { WebhookService } from "./services/webhook.service";

export type AppEnv = {
    Bindings: {
        DB: D1Database;
        JWT_SECRET: string;
        PROJECT_BOARD: DurableObjectNamespace;
    };
    Variables: {
        userId: string;
        authService: AuthService;
        projectService: ProjectService;
        memberService: MemberService;
        taskService: TaskService;
        statusService: StatusService;
        commentService: CommentService;
        notificationService: NotificationService;
        webhookService: WebhookService;
    };
};
