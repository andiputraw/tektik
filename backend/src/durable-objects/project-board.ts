import { DurableObject } from "cloudflare:workers";

export class ProjectBoard extends DurableObject {
    private sessions: Set<WebSocket> = new Set();

    async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get("Upgrade");
        if (upgradeHeader === "websocket" || upgradeHeader?.toLowerCase() === "websocket") {
            const pair = new WebSocketPair();
            const client = pair[0];
            const server = pair[1];

            await this.handleSession(server);
            return new Response(null, { status: 101, webSocket: client });
        }

        if (request.method === "POST") {
            try {
                const data = await request.json();
                this.broadcast(data);
                return new Response("OK");
            } catch (e) {
                return new Response("Invalid JSON", { status: 400 });
            }
        }

        return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    async handleSession(webSocket: WebSocket) {
        // Accept the websocket connection
        webSocket.accept();
        this.sessions.add(webSocket);
        console.log("DO: Session accepted. Total sessions:", this.sessions.size);

        // Handle close
        webSocket.addEventListener("close", (evt) => {
            console.log("DO: Session closed", evt.code, evt.reason);
            this.sessions.delete(webSocket);
        });

        // Handle messages (if any need to be handled by server, usually broadbast)
        webSocket.addEventListener("message", async (msg) => {
            try {
                // If we receive a message, we might want to broadcast it to others
                // Or perform an action. For now, let's assume valid JSON broadcast.
                // We'll skip the sender.
                console.log("DO: Message received", msg.data);
                const data = JSON.parse(msg.data as string);
                this.broadcast(data, webSocket);
            } catch (err) {
                console.error("DO: Message Error", err);
                // Ignore invalid JSON
            }
        });
    }

    broadcast(message: any, exclude?: WebSocket) {
        const data = JSON.stringify(message);
        for (const session of this.sessions) {
            if (session !== exclude && session.readyState === WebSocket.OPEN) {
                try {
                    session.send(data);
                } catch (err) {
                    // removing dead session
                    this.sessions.delete(session);
                }
            }
        }
    }
}
