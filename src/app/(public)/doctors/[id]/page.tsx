import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCachedDoctorProfile } from '@/lib/queries/doctor-directory';
import { DoctorAvatar } from '@/components/doctors/doctor-avatar';
import { getDepartmentIcon } from '@/components/admin/department-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Clock,
  Calendar,
  ShieldCheck,
  Award,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface DoctorProfilePageProps {
  params: Promise<{ id: string }>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function generateMetadata({ params }: DoctorProfilePageProps) {
  const { id } = await params;
  const doctor = await getCachedDoctorProfile(id);
  if (!doctor) return { title: 'Doctor Not Found | Digital Clinic' };

  return {
    title: `${doctor.user?.name || 'Physician'} - ${doctor.specialization} | Digital Clinic`,
    description: doctor.bio.slice(0, 160),
  };
}

export default async function PublicDoctorDetailPage({ params }: DoctorProfilePageProps) {
  const { id } = await params;
  const doctor = await getCachedDoctorProfile(id);

  if (!doctor) {
    notFound();
  }

  const docName = doctor.user?.name || 'Physician';
  const avatarUrl = doctor.avatarUrl || doctor.user?.image;
  const deptName = doctor.department?.name || 'General Care';
  const IconComponent = getDepartmentIcon(doctor.department?.iconName || 'Activity');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/doctors" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Doctor Directory
          </Link>

          <Link href={`/patient/book?doctorId=${doctor.id}`} className="sm:hidden">
            <Button size="sm">Book Now</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2-column info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Hero Banner */}
            <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <DoctorAvatar
                  avatarUrl={avatarUrl}
                  name={docName}
                  size="xl"
                  isAcceptingPatients={doctor.isAcceptingPatients}
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                      {docName}
                    </h1>
                    <span title="Verified Board Physician">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </span>
                  </div>

                  <p className="text-base text-muted-foreground font-medium">
                    {doctor.specialization}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 gap-1.5"
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                      {deptName}
                    </Badge>

                    <Badge variant="outline" className="text-xs">
                      License: {doctor.licenseNumber}
                    </Badge>

                    {doctor.isAcceptingPatients ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      >
                        Accepting Patients
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Intake Paused
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-foreground text-sm">
                        {doctor.averageRating.toFixed(1)}
                      </span>
                      <span>({doctor.reviewCount} verified reviews)</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{doctor.yearsOfExperience} Years Clinical Experience</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About / Clinical Bio */}
            <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                About the Physician
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {doctor.bio}
              </p>
            </div>

            {/* Qualifications & Credentials */}
            <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Education & Credentials
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctor.qualifications.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/30 text-xs font-medium text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Schedule Overview */}
            <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Weekly Consultation Hours
              </h2>
              <div className="space-y-2">
                {DAYS.map((dayName, dayIdx) => {
                  const slot = doctor.weeklySlots?.find((s) => s.dayOfWeek === dayIdx);
                  const isAvailable = slot && slot.isActive;

                  return (
                    <div
                      key={dayIdx}
                      className="flex items-center justify-between p-3 rounded-xl border text-xs"
                    >
                      <span className="font-semibold text-foreground w-28">{dayName}</span>
                      {isAvailable ? (
                        <span className="font-mono text-foreground font-medium">
                          {slot.startTime} - {slot.endTime} ({slot.slotDurationMinutes} min consultations)
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Off Duty / No Consultations</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Booking Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border bg-card shadow-md space-y-6 sticky top-24">
              <div>
                <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block">
                  Standard Consultation
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-foreground">
                    ${doctor.consultationFee}
                  </span>
                  <span className="text-xs text-muted-foreground">/ session</span>
                </div>
              </div>

              <div className="space-y-3 py-3 border-y text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Consultation Format</span>
                  <span className="font-semibold text-foreground">In-Person & Telehealth</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Slot Duration</span>
                  <span className="font-semibold text-foreground">30 Minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Intake Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {doctor.isAcceptingPatients ? 'Accepting Patients' : 'Full'}
                  </span>
                </div>
              </div>

              <Link href={`/patient/book?doctorId=${doctor.id}`} className="block">
                <Button
                  className="w-full h-11 text-sm font-semibold gap-2 shadow-sm"
                  disabled={!doctor.isAcceptingPatients}
                >
                  <Calendar className="h-4 w-4" />
                  {doctor.isAcceptingPatients ? 'Book Consultation' : 'Intake Currently Paused'}
                </Button>
              </Link>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Instant slot confirmation with 5-minute hold</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Encrypted digital medical record sharing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Free cancellation up to 24h before visit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
