import { ensureSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/models/Doctor';
import { ScheduleManager } from '@/components/doctors/schedule-manager';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'My Schedule & Availability | Doctor Portal',
  description: 'Configure your recurring weekly office hours, slot durations, and booking capacity.',
};

export default async function DoctorSchedulePage() {
  const session = await ensureSession(['doctor', 'admin', 'superadmin']);
  await connectDB();

  const doctor = await Doctor.findOne({ userId: session.user.id });

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-lg">Doctor Profile Pending</CardTitle>
            </div>
            <CardDescription>
              Your user account has the "doctor" role, but your clinical provider record has not been linked yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please contact the clinic administration to enroll your medical license and department affiliation.
            </p>
            <Link href="/doctor">
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Schedule & Availability
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set your recurring office hours for each day of the week. Patients can only book appointments during active periods.
        </p>
      </div>

      <ScheduleManager doctorId={doctor._id.toString()} />
    </div>
  );
}
