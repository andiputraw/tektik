import { describe, it, expect, vi } from "vitest";
import { MemberService } from "../src/services/member.service";
import {
    mockMemberRepo, mockUserRepo, mockNotificationRepo,
    fakeUser, fakeUser2, fakeOwnerMember, fakeRegularMember,
} from "./helpers";

describe("MemberService", () => {
    describe("inviteMember", () => {
        it("should add member and create notification when owner invites", async () => {
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn()
                    .mockResolvedValueOnce(fakeOwnerMember) // assertOwnership for inviter
                    .mockResolvedValueOnce(undefined),       // check target not already member
            });
            const userRepo = mockUserRepo({
                findByEmail: vi.fn().mockResolvedValue(fakeUser2),
                findById: vi.fn().mockResolvedValue(fakeUser),
            });
            const notificationRepo = mockNotificationRepo();
            const service = new MemberService(memberRepo, userRepo, notificationRepo);

            await service.inviteMember("proj-1", "user-1", "other@example.com");

            expect(memberRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ userId: "user-2", role: "member" })
            );
            expect(notificationRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: "user-2",
                    type: "project_invite",
                })
            );
        });

        it("should reject when inviter is not owner", async () => {
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeRegularMember),
            });
            const service = new MemberService(memberRepo, mockUserRepo(), mockNotificationRepo());

            await expect(service.inviteMember("proj-1", "user-2", "new@example.com"))
                .rejects.toThrow("Only project owner can do this");
        });

        it("should reject when target user does not exist", async () => {
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = new MemberService(memberRepo, mockUserRepo(), mockNotificationRepo());

            await expect(service.inviteMember("proj-1", "user-1", "ghost@example.com"))
                .rejects.toThrow("User not found");
        });

        it("should reject when target is already a member", async () => {
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn()
                    .mockResolvedValueOnce(fakeOwnerMember)    // assertOwnership
                    .mockResolvedValueOnce(fakeRegularMember), // already exists
            });
            const userRepo = mockUserRepo({
                findByEmail: vi.fn().mockResolvedValue(fakeUser2),
            });
            const service = new MemberService(memberRepo, userRepo, mockNotificationRepo());

            await expect(service.inviteMember("proj-1", "user-1", "other@example.com"))
                .rejects.toThrow("User is already a member");
        });
    });

    describe("removeMember", () => {
        it("should allow owner to remove another member", async () => {
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = new MemberService(memberRepo, mockUserRepo(), mockNotificationRepo());

            await service.removeMember("proj-1", "user-1", "user-2");
            expect(memberRepo.deleteByUserAndProject).toHaveBeenCalledWith("user-2", "proj-1");
        });

        it("should prevent owner from removing themselves", async () => {
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = new MemberService(memberRepo, mockUserRepo(), mockNotificationRepo());

            await expect(service.removeMember("proj-1", "user-1", "user-1"))
                .rejects.toThrow("Cannot remove yourself as owner");
        });

        it("should reject non-owner from removing", async () => {
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeRegularMember),
            });
            const service = new MemberService(memberRepo, mockUserRepo(), mockNotificationRepo());

            await expect(service.removeMember("proj-1", "user-2", "user-1"))
                .rejects.toThrow("Only project owner can do this");
        });
    });
});
