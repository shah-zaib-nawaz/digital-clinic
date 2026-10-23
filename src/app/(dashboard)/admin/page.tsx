import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, Activity, Stethoscope, AlertTriangle } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mission Control & Clinic KPIs</h1>
          <p className="text-muted-foreground text-sm">
            Live overview of clinic throughput, provider schedule rebalancing, and audit logs.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh Telemetry
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Today's Total Appointments</CardDescription>
            <CardTitle className="text-2xl font-bold">48 Visits</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-teal-600 font-medium">+12% vs last week</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Active 5-Min TTL Holds</CardDescription>
            <CardTitle className="text-2xl font-bold">3 Slots</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">In active checkout</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Provider Coverage</CardDescription>
            <CardTitle className="text-2xl font-bold">94.4%</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">17 of 18 physicians on duty</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Average Wait Time</CardDescription>
            <CardTitle className="text-2xl font-bold">7.2 min</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-teal-600 font-medium">Optimal outpatient flow</div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Schedule Rebalancing Panel */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle className="text-lg">Emergency Provider Schedule Rebalancing</CardTitle>
              <CardDescription>
                Execute multi-appointment atomic swap transaction using MongoDB withTransaction()
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If a physician reports urgent leave, reassign all pending and confirmed appointments
            to available backup specialists in a single ACID transaction without double-booking risk.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
              Launch Atomic Rebalance Wizard
            </Button>
            <Button size="sm" variant="outline">
              View Audit Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Neurology</span>
            </div>
            <Badge variant="outline">4 Doctors</Badge>
          </div>
          <div className="text-xs text-muted-foreground">14 appointments scheduled today</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm">Cardiology</span>
            </div>
            <Badge variant="outline">5 Doctors</Badge>
          </div>
          <div className="text-xs text-muted-foreground">19 appointments scheduled today</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="font-semibold text-sm">Pediatrics</span>
            </div>
            <Badge variant="outline">3 Doctors</Badge>
          </div>
          <div className="text-xs text-muted-foreground">15 appointments scheduled today</div>
        </Card>
      </div>
    </div>
  );
}
