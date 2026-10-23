'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  CalendarCheck,
  CalendarX,
  Clock,
  BellRing,
  FileText,
  Star,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  listNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/actions/notification.actions';
import { NotificationLean, NotificationType } from '@/models/Notification';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'BOOKING_CONFIRMED':
      return <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    case 'BOOKING_CANCELLED':
      return <CalendarX className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
    case 'BOOKING_RESCHEDULED':
      return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    case 'REMINDER':
      return <BellRing className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    case 'VISIT_NOTE_READY':
      return <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    case 'REVIEW_APPROVED':
      return <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
}

function formatRelativeTime(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationLean[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load initial notifications
  const loadNotifications = React.useCallback(async () => {
    try {
      const res = await listNotificationsAction({ limit: 25 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();

    // Setup SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data) as NotificationLean;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Audio feedback & Toast notification
          toast.info(newNotif.title, {
            description: newNotif.message,
            duration: 5000,
          });
        } catch (err) {
          console.error('Failed to parse SSE notification payload:', err);
        }
      };

      eventSource.onerror = () => {
        // Intermittent disconnect or navigation, browser will attempt retry
      };
    } catch (err) {
      console.error('Failed to initialize SSE EventSource:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [loadNotifications]);

  const handleItemClick = async (notif: NotificationLean) => {
    if (!notif.read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationReadAction(notif.id);
    }

    if (notif.actionUrl) {
      setIsOpen(false);
      router.push(notif.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsReadAction();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in-50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 shadow-lg border-border"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Content list */}
        <ScrollArea className="max-h-[380px] divide-y">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                You do not have any notifications right now.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleItemClick(notif)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 hover:bg-muted/50 ${
                    !notif.read ? 'bg-primary/5' : 'bg-transparent'
                  }`}
                >
                  <div className="shrink-0 mt-0.5 rounded-full p-1.5 bg-muted/60">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          !notif.read
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-muted-foreground'
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
