import * as React from 'react';
import { ensureSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { ChatLog } from '@/models/ChatLog';
import {
  Bot,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default async function AdminAiTelemetryPage() {
  await ensureSession(['admin', 'superadmin']);
  await connectDB();

  const [totalSessions, escalatedCount, completedCount, recentLogs] = await Promise.all([
    ChatLog.countDocuments({ isDeleted: false }),
    ChatLog.countDocuments({ isEscalated: true, isDeleted: false }),
    ChatLog.countDocuments({ status: 'completed', isDeleted: false }),
    ChatLog.find({ isDeleted: false })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean<any[]>(),
  ]);

  const escalationRate =
    totalSessions > 0 ? ((escalatedCount / totalSessions) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Bot className="h-6 w-6 text-primary" />
          AI Receptionist & Clinical Triage Telemetry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time oversight of conversational agent interactions, red-flag emergency escalations, and HITL approvals.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Triage Sessions</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalSessions}</span>
            <span className="text-xs text-muted-foreground">all-time</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Emergency Escalations</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{escalatedCount}</span>
            <span className="text-xs text-rose-500 font-semibold">{escalationRate}% rate</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Completed Bookings</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{completedCount}</span>
            <span className="text-xs text-emerald-600 font-medium">via HITL</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Safety Model Protocol</span>
            <ShieldAlert className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">OpenAI gpt-4o</span>
            <span className="text-[10px] text-muted-foreground">ToolLoop v7</span>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Agent Conversations</h2>
            <p className="text-xs text-muted-foreground">Audit log of customer triage sessions and tool executions</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Showing latest {recentLogs.length}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Session ID</th>
                <th className="px-6 py-3 font-medium">User / Patient</th>
                <th className="px-6 py-3 font-medium">Messages</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Escalation</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No AI triage sessions recorded yet. Launch the receptionist widget to generate audit entries.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log._id.toString()} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-[11px] text-primary">
                      {log.sessionId.slice(0, 16)}...
                    </td>
                    <td className="px-6 py-3">
                      {log.userId?.name ? (
                        <div className="font-medium text-foreground">{log.userId.name}</div>
                      ) : (
                        <span className="text-muted-foreground italic">Anonymous Guest</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium">{log.messages?.length || 0}</span> msgs
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          log.status === 'completed'
                            ? 'default'
                            : log.status === 'active'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-[10px] capitalize"
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      {log.isEscalated ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                          <AlertTriangle className="h-3 w-3" />
                          Escalated
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Standard</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
