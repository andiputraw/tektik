/**
 * WebSocket composable for real-time updates.
 * Connects to the project's Durable Object.
 */
import { useAuth } from "./useAuth";

export function useWebSocket(projectId: string) {
    const { user } = useAuth();
    const config = useRuntimeConfig();
    const socket = ref<WebSocket | null>(null);
    const isConnected = ref(false);

    // Store message handlers
    const handlers = new Set<(data: any) => void>();

    const connect = () => {
        console.log("useWebSocket: connect() called", { user: user.value, projectId });
        if (!user.value) {
            console.log("useWebSocket: User not ready, skipping connect");
            return;
        }

        // Construct WS URL using apiBase
        const apiBase = config.public.apiBase as string;
        let wsUrl = apiBase.replace("http", "ws"); // http -> ws, https -> wss
        if (wsUrl.endsWith("/")) wsUrl = wsUrl.slice(0, -1);

        const url = `${wsUrl}/api/projects/${projectId}/ws`;
        console.log("useWebSocket: Connecting to", url);

        try {
            socket.value = new WebSocket(url);
        } catch (e) {
            console.error("useWebSocket: Failed to create WebSocket", e);
            return;
        }

        socket.value.onopen = () => {
            isConnected.value = true;
            console.log("WS Connected");
        };

        socket.value.onclose = (ev) => {
            isConnected.value = false;
            console.log("WS Disconnected", ev.code, ev.reason);
            // Reconnect logic could go here
        };

        socket.value.onerror = (ev) => {
            console.error("WS Error", ev);
        };

        socket.value.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WS Message received", data);
                handlers.forEach(handler => handler(data));
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };
    };

    const send = (data: any) => {
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
            socket.value.send(JSON.stringify(data));
        }
    };

    const onMessage = (handler: (data: any) => void) => {
        handlers.add(handler);
        return () => handlers.delete(handler);
    };

    const disconnect = () => {
        if (socket.value) {
            socket.value.close();
        }
    };

    onMounted(() => {
        console.log("useWebSocket: mounted");
        if (user.value) {
            connect();
        }
    });

    watch(user, (newUser) => {
        console.log("useWebSocket: user changed", newUser);
        if (newUser) {
            connect();
        } else {
            disconnect();
        }
    });

    onUnmounted(() => {
        disconnect();
    });

    return {
        isConnected,
        send,
        onMessage
    };
}
