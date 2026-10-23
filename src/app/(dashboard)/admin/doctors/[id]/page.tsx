import { notFound } from 'next/navigation';
import { ensureSession } from '@/lib/session';
import { getDoctorByIdAction } from '@/actions/doctor.actions';
import { getDepartmentsAction } from '@/actions/department.actions';
import { DoctorFormClient } from '@/components/admin/doctor-form-client';
import { ScheduleManager } from '@/components/doctors/schedule-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCheck, Clock } from 'lucide-react';

interface DoctorEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DoctorEditPageProps) {
  const { id } = await params;
  const res = await getDoctorByIdAction(id);
  const docName = res.success && res.data?.user?.name ? res.data.user.name : 'Doctor';
  return {
    title: `Edit ${docName} | Admin Command Center`,
    description: `Configure profile, credentials, and weekly availability for ${docName}.`,
  };
}

export default async function AdminDoctorEditPage({ params }: DoctorEditPageProps) {
  await ensureSession(['admin', 'superadmin']);
  const { id } = await params;

  const [doctorRes, deptsRes] = await Promise.all([
    getDoctorByIdAction(id),
    getDepartmentsAction(true),
  ]);

  if (!doctorRes.success || !doctorRes.data) {
    notFound();
  }

  const doctor = doctorRes.data;
  const departments = deptsRes.success && deptsRes.data ? deptsRes.data : [];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Provider Management Console
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              License {doctor.licenseNumber} • {doctor.specialization}
            </p>
          </div>

          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Credentials & Profile
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Clock className="h-4 w-4" />
              Weekly Schedule
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="pt-6">
          <DoctorFormClient departments={departments} doctorToEdit={doctor} />
        </TabsContent>

        <TabsContent value="schedule" className="pt-6 max-w-4xl">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Weekly Office Hours & Booking Capacity
              </h3>
              <p className="text-xs text-muted-foreground">
                Define the recurring weekly slots for this physician. Patients can book slots within these ranges.
              </p>
            </div>
            <ScheduleManager doctorId={doctor.id || doctor._id.toString()} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
