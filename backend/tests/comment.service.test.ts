import { describe, it, expect, vi } from "vitest";
import { CommentService } from "../src/services/comment.service";
import {
    mockCommentRepo, mockTaskRepo, mockMemberRepo,
    fakeTask, fakeComment, fakeOwnerMember,
} from "./helpers";

describe("CommentService", () => {
    describe("createComment", () => {
        it("should create comment when user is a project member", async () => {
            const commentRepo = mockCommentRepo();
            const taskRepo = mockTaskRepo({
                findById: vi.fn().mockResolvedValue(fakeTask),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = new CommentService(commentRepo, taskRepo, memberRepo);

            await service.createComment("task-1", "user-1", "Great work!");

            expect(commentRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    taskId: "task-1",
                    authorId: "user-1",
                    content: "Great work!",
                })
            );
        });

        it("should reject when task does not exist", async () => {
            const service = new CommentService(mockCommentRepo(), mockTaskRepo(), mockMemberRepo());

            await expect(service.createComment("nonexistent", "user-1", "text"))
                .rejects.toThrow("Task not found");
        });
    });

    describe("updateComment", () => {
        it("should update own comment", async () => {
            const commentRepo = mockCommentRepo({
                findById: vi.fn().mockResolvedValue(fakeComment),
                update: vi.fn().mockResolvedValue({ ...fakeComment, content: "Updated" }),
            });
            const service = new CommentService(commentRepo, mockTaskRepo(), mockMemberRepo());

            const result = await service.updateComment("comment-1", "user-1", "Updated");
            expect(result.content).toBe("Updated");
        });

        it("should reject editing another user's comment", async () => {
            const commentRepo = mockCommentRepo({
                findById: vi.fn().mockResolvedValue(fakeComment),
            });
            const service = new CommentService(commentRepo, mockTaskRepo(), mockMemberRepo());

            await expect(service.updateComment("comment-1", "user-2", "Hack"))
                .rejects.toThrow("Can only edit your own comments");
        });
    });

    describe("deleteComment", () => {
        it("should delete own comment", async () => {
            const commentRepo = mockCommentRepo({
                findById: vi.fn().mockResolvedValue(fakeComment),
            });
            const service = new CommentService(commentRepo, mockTaskRepo(), mockMemberRepo());

            await service.deleteComment("comment-1", "user-1");
            expect(commentRepo.delete).toHaveBeenCalledWith("comment-1");
        });

        it("should reject deleting another user's comment", async () => {
            const commentRepo = mockCommentRepo({
                findById: vi.fn().mockResolvedValue(fakeComment),
            });
            const service = new CommentService(commentRepo, mockTaskRepo(), mockMemberRepo());

            await expect(service.deleteComment("comment-1", "user-2"))
                .rejects.toThrow("Can only delete your own comments");
        });
    });
});
