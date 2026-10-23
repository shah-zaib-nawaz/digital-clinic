import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { notificationBus } from '@/lib/notification-bus';

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  let isClosed = false;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let onNotification: ((data: any) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial handshake packet
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId, connectedAt: new Date().toISOString() })}\n\n`)
      );

      // 2. Real-time event listener for this user
      onNotification = (data: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('Error enqueuing SSE message:', err);
        }
      };

      notificationBus.on(`notification:${userId}`, onNotification);

      // 3. Heartbeat ping every 25 seconds to keep intermediary proxies open
      heartbeatTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 25000);

      // 4. Request abort handler (client disconnected or navigated away)
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (onNotification) {
          notificationBus.off(`notification:${userId}`, onNotification);
        }
        try {
          controller.close();
        } catch {
          // Stream already closed or aborted
        }
      });
    },
    cancel() {
      isClosed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (onNotification) {
        notificationBus.off(`notification:${userId}`, onNotification);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
