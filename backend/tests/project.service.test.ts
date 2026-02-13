import { describe, it, expect, vi } from "vitest";
import { ProjectService } from "../src/services/project.service";
import {
    mockProjectRepo, mockMemberRepo, mockStatusRepo,
    fakeProject, fakeOwnerMember, fakeRegularMember,
} from "./helpers";

describe("ProjectService", () => {
    describe("createProject", () => {
        it("should create project, add owner as member, and create 3 default statuses", async () => {
            const projectRepo = mockProjectRepo();
            const memberRepo = mockMemberRepo();
            const statusRepo = mockStatusRepo();
            const service = new ProjectService(projectRepo, memberRepo, statusRepo);

            await service.createProject("My Project", "desc", "user-1");

            expect(projectRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: "My Project", ownerId: "user-1", archived: 0 })
            );
            expect(memberRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ userId: "user-1", role: "owner" })
            );
            expect(statusRepo.create).toHaveBeenCalledTimes(3);
            const statusNames = (statusRepo.create as any).mock.calls.map((c: any) => c[0].name);
            expect(statusNames).toEqual(["To Do", "In Progress", "Done"]);
        });
    });

    describe("getProject", () => {
        it("should return project when user is a member", async () => {
            const projectRepo = mockProjectRepo({
                findById: vi.fn().mockResolvedValue(fakeProject),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = new ProjectService(projectRepo, memberRepo, mockStatusRepo());

            const result = await service.getProject("proj-1", "user-1");
            expect(result).toEqual(fakeProject);
        });

        it("should throw when project does not exist", async () => {
            const service = new ProjectService(mockProjectRepo(), mockMemberRepo(), mockStatusRepo());

            await expect(service.getProject("nonexistent", "user-1"))
                .rejects.toThrow("Project not found");
        });

        it("should throw when user is not a member", async () => {
            const projectRepo = mockProjectRepo({
                findById: vi.fn().mockResolvedValue(fakeProject),
            });
            const service = new ProjectService(projectRepo, mockMemberRepo(), mockStatusRepo());

            await expect(service.getProject("proj-1", "stranger"))
                .rejects.toThrow("Not a member of this project");
        });
    });

    describe("deleteProject", () => {
        it("should allow owner to delete", async () => {
            const projectRepo = mockProjectRepo();
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = new ProjectService(projectRepo, memberRepo, mockStatusRepo());

            await service.deleteProject("proj-1", "user-1");
            expect(projectRepo.delete).toHaveBeenCalledWith("proj-1");
        });

        it("should reject non-owner from deleting", async () => {
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeRegularMember),
            });
            const service = new ProjectService(mockProjectRepo(), memberRepo, mockStatusRepo());

            await expect(service.deleteProject("proj-1", "user-2"))
                .rejects.toThrow("Only project owner can do this");
        });

        it("should reject non-member from deleting", async () => {
            const service = new ProjectService(mockProjectRepo(), mockMemberRepo(), mockStatusRepo());

            await expect(service.deleteProject("proj-1", "stranger"))
                .rejects.toThrow("Only project owner can do this");
        });
    });

    describe("updateProject", () => {
        it("should allow member to update", async () => {
            const projectRepo = mockProjectRepo({
                update: vi.fn().mockResolvedValue({ ...fakeProject, name: "Updated" }),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeRegularMember),
            });
            const service = new ProjectService(projectRepo, memberRepo, mockStatusRepo());

            const result = await service.updateProject("proj-1", "user-2", { name: "Updated" });
            expect(result.name).toBe("Updated");
        });

        it("should reject non-member from updating", async () => {
            const service = new ProjectService(mockProjectRepo(), mockMemberRepo(), mockStatusRepo());

            await expect(service.updateProject("proj-1", "stranger", { name: "x" }))
                .rejects.toThrow("Not a member of this project");
        });
    });
});
