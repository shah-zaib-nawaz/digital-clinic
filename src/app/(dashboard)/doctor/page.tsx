import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, FileCheck, CheckCircle2 } from 'lucide-react';

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Today's Consultation Queue</h1>
        <p className="text-muted-foreground text-sm">
          Real-time patient flow, intake files, and SOAP clinical note generation.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Scheduled Today</CardDescription>
            <CardTitle className="text-2xl font-bold">6 Patients</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">9:00 AM - 4:30 PM</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">In Waiting Room</CardDescription>
            <CardTitle className="text-2xl font-bold">1 Patient</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">Checked in 4m ago</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Completed & Sealed</CardDescription>
            <CardTitle className="text-2xl font-bold">2 Visits</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">Cryptographically signed</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">No-Shows</CardDescription>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">100% attendance</div>
          </CardContent>
        </Card>
      </div>

      {/* Consultation Queue List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patients Scheduled For Today</CardTitle>
          <CardDescription>Click begin consultation to open the active visit note editor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border p-4 bg-accent/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">Sarah Jenkins (42F)</span>
                <Badge variant="confirmed">Confirmed</Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                10:00 AM - 10:30 AM • Chief Complaint: Severe migraine with visual aura
              </div>
            </div>
            <Button size="sm" className="gap-2 shadow">
              <Play className="h-4 w-4" /> Begin Consultation
            </Button>
          </div>

          <div className="rounded-lg border p-4 bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">Robert Davis (58M)</span>
                <Badge variant="pending">Pending</Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                10:45 AM - 11:15 AM • Post-Op spine checkup
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-2">
              <FileCheck className="h-4 w-4" /> View Intake
            </Button>
          </div>

          <div className="rounded-lg border p-4 bg-muted/40 opacity-70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base line-through">Michael Scott (45M)</span>
                <Badge variant="completed">Completed & Signed</Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                09:00 AM - 09:30 AM • Routine physical • Note Sealed
              </div>
            </div>
            <Button size="sm" variant="ghost" disabled>
              Note Sealed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
