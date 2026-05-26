import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/core/infrastructure/config/api";

let sharedSocket: Socket | null = null;
let retainCount = 0;
let generation = 0;

function createSocket(): Socket {
  return io(getApiBaseUrl(), {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
}

export function retainAuthenticatedSocket() {
  if (!sharedSocket) {
    sharedSocket = createSocket();
    retainCount = 0;
    generation += 1;
  }

  retainCount += 1;

  const retainedGeneration = generation;
  let released = false;

  return {
    socket: sharedSocket,
    release: () => {
      if (released || retainedGeneration !== generation) {
        return;
      }

      released = true;
      retainCount = Math.max(0, retainCount - 1);

      if (retainCount === 0) {
        sharedSocket?.disconnect();
        sharedSocket = null;
      }
    },
  };
}
