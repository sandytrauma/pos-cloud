import Pusher from "pusher";

let pusherServerInstance: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (pusherServerInstance) return pusherServerInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

  if (appId && key && secret) {
    pusherServerInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
    return pusherServerInstance;
  }

  return null;
}

/**
 * Broadcasts order lifecycle events to kitchen display channels.
 */
export async function triggerOrderEvent(event: "order:created" | "order:status_updated", data: any) {
  try {
    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger("kds-channel", event, data);
    }
  } catch (err) {
    console.warn("Pusher Event Dispatch Notice:", err);
  }
}
