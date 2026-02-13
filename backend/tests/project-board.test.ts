
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the cloudflare:workers module BEFORE importing the component
vi.mock("cloudflare:workers", () => {
    return {
        DurableObject: class {
            state: any;
            env: any;
            constructor(state: any, env: any) {
                this.state = state;
                this.env = env;
            }
        },
        DurableObjectState: class { },
    };
});

import { ProjectBoard } from "../src/durable-objects/project-board";

// Mock WebSocket
class MockWebSocket {
    // Standard WebSocket constants
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState: number = MockWebSocket.OPEN;

    // Using simple mock functions
    accept = vi.fn();
    send = vi.fn();
    close = vi.fn();
    addEventListener = vi.fn();

    // To satisfy TS structure for testing purposes, adding other properties as needed
    binaryType = "blob";
    bufferedAmount = 0;
    extensions = "";
    protocol = "";
    url = "";
    onclose = null;
    onerror = null;
    onmessage = null;
    onopen = null;
    dispatchEvent = vi.fn();
    removeEventListener = vi.fn();
}

// Global WebSocket Patch
global.WebSocket = MockWebSocket as any;

// Mock WebSocketPair
class MockWebSocketPair {
    0: MockWebSocket;
    1: MockWebSocket;

    constructor() {
        this[0] = new MockWebSocket();
        this[1] = new MockWebSocket();
    }
}
global.WebSocketPair = MockWebSocketPair as any;

describe("ProjectBoard Durable Object", () => {
    let projectBoard: ProjectBoard;
    let storage: any; // Mock storage

    beforeEach(() => {
        // Mock DurableObject State/Storage
        storage = {
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            list: vi.fn(),
        };
        // @ts-ignore - Partial mock of DurableObjectState
        projectBoard = new ProjectBoard({ storage } as any, {} as any);
    });

    it("should broadcast messages to connected sessions", async () => {
        const clientWS = new MockWebSocket();
        (projectBoard as any).sessions.add(clientWS);

        const message = { type: "task_updated", payload: { id: "1", status: "done" } };
        projectBoard.broadcast(message);

        expect(clientWS.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it("should not broadcast to closed sessions", async () => {
        const clientWS = new MockWebSocket();
        clientWS.readyState = MockWebSocket.CLOSED;
        (projectBoard as any).sessions.add(clientWS);

        const message = { type: "ping" };
        projectBoard.broadcast(message);

        expect(clientWS.send).not.toHaveBeenCalled();
    });

    it("should exclude specific socket from broadcast if requested", async () => {
        const client1 = new MockWebSocket();
        const client2 = new MockWebSocket();
        (projectBoard as any).sessions.add(client1);
        (projectBoard as any).sessions.add(client2);

        const message = { type: "update" };
        projectBoard.broadcast(message, client1 as any);

        expect(client1.send).not.toHaveBeenCalled();
        expect(client2.send).toHaveBeenCalled();
    });
});
