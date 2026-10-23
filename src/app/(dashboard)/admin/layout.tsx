import * as React from 'react';
import Link from 'next/link';
import { ensureSession } from '@/lib/session';
import { UserButton } from '@/components/auth/user-button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  BarChart3,
  CalendarDays,
  UserCheck,
  Building2,
  MessageSquare,
  Users2,
  Bot,
  ShieldAlert,
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';

const navItems = [
  { label: 'KPI Overview', href: '/admin', icon: BarChart3 },
  { label: 'Master Schedule', href: '/admin/schedule', icon: CalendarDays },
  { label: 'Doctors', href: '/admin/doctors', icon: UserCheck },
  { label: 'Departments', href: '/admin/departments', icon: Building2 },
  { label: 'Reviews Moderation', href: '/admin/reviews', icon: MessageSquare },
  { label: 'User Management', href: '/admin/users', icon: Users2 },
  { label: 'AI Agent Telemetry', href: '/admin/ai-telemetry', icon: Bot },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureSession(['admin', 'superadmin']);

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col shrink-0 hidden md:flex">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground">Mission Control</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground">
          Administrative RBAC Master
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 md:hidden">
            <ShieldAlert className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-sm">Admin Control</span>
          </div>

          <div className="hidden md:block text-sm text-muted-foreground">
            Clinic Operations & System Health
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <UserButton />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
