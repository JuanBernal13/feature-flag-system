import type http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { type ConfigChangedEvent, type Environment } from "@flagship/shared";

interface ClientSubscription {
  projectKey: string;
  environment: Environment;
}

export class RealtimeHub {
  private readonly clients = new Map<WebSocket, ClientSubscription>();

  attach(server: http.Server): void {
    const websocketServer = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

      if (url.pathname !== "/stream") {
        return;
      }

      const projectKey = url.searchParams.get("projectKey");
      const environment = url.searchParams.get("environment") as Environment | null;

      if (!projectKey || !environment) {
        socket.destroy();
        return;
      }

      websocketServer.handleUpgrade(request, socket, head, (client) => {
        this.clients.set(client, { projectKey, environment });
        client.send(
          JSON.stringify({
            type: "connected",
            projectKey,
            environment,
            connectedAt: new Date().toISOString()
          })
        );
        client.on("close", () => this.clients.delete(client));
      });
    });
  }

  broadcast(event: ConfigChangedEvent): void {
    for (const [client, subscription] of this.clients.entries()) {
      if (
        client.readyState === WebSocket.OPEN &&
        subscription.projectKey === event.projectKey &&
        subscription.environment === event.environment
      ) {
        client.send(JSON.stringify(event));
      }
    }
  }
}
