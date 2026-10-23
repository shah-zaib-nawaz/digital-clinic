import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, Search, FileText, Clock } from 'lucide-react';

export default function PatientDashboardPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Patient Overview</h1>
        <p className="text-muted-foreground text-sm">
          Track upcoming appointments, find specialists, and review medical visit notes.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Upcoming Visits</CardDescription>
            <CardTitle className="text-2xl font-bold">1</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-teal-500" /> Oct 25, 2026 @ 10:00 AM
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Active Slot Holds</CardDescription>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">5-min checkout locks</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Completed Visits</CardDescription>
            <CardTitle className="text-2xl font-bold">4</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">All notes sealed</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Uploaded Documents</CardDescription>
            <CardTitle className="text-2xl font-bold">2</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">Lab & scan records</div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Actions & Next Appointment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Next Upcoming Appointment</CardTitle>
                <CardDescription>Confirmed outpatient consultation</CardDescription>
              </div>
              <Badge variant="confirmed">Confirmed</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="font-semibold text-base">Dr. Marcus Vance, MD</div>
                <div className="text-sm text-muted-foreground">Neurology Consultation • Room 304</div>
                <div className="text-xs text-primary font-medium mt-1">Thursday, Oct 25, 2026 • 10:00 AM - 10:30 AM</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/patient/appointments">Details</Link>
                </Button>
                <Button variant="destructive" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Frequently used patient tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button variant="outline" className="w-full justify-start gap-2.5" asChild>
              <Link href="/patient/book">
                <CalendarPlus className="h-4 w-4 text-teal-600" />
                Book New Appointment
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2.5" asChild>
              <Link href="/patient/doctors">
                <Search className="h-4 w-4 text-blue-600" />
                Browse Doctor Directory
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2.5" asChild>
              <Link href="/patient/records">
                <FileText className="h-4 w-4 text-purple-600" />
                View Visit Notes & Scans
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
