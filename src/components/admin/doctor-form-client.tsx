'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { DepartmentLean } from '@/models/Department';
import { DoctorWithDetailsLean } from '@/models/Doctor';
import { ClinicUploadWidget } from '@/components/media/clinic-upload-widget';
import { createDoctorAction, updateDoctorAction } from '@/actions/doctor.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface DoctorFormClientProps {
  departments: DepartmentLean[];
  doctorToEdit?: DoctorWithDetailsLean | null;
}

export function DoctorFormClient({
  departments,
  doctorToEdit,
}: DoctorFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(doctorToEdit?.user?.name || '');
  const [email, setEmail] = useState(doctorToEdit?.user?.email || '');
  const [departmentId, setDepartmentId] = useState(
    doctorToEdit?.departmentId?.toString() ||
      doctorToEdit?.department?._id?.toString() ||
      doctorToEdit?.department?.id ||
      ''
  );
  const [licenseNumber, setLicenseNumber] = useState(doctorToEdit?.licenseNumber || '');
  const [specialization, setSpecialization] = useState(doctorToEdit?.specialization || '');
  const [qualificationsText, setQualificationsText] = useState(
    doctorToEdit?.qualifications?.join(', ') || ''
  );
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(
    doctorToEdit?.yearsOfExperience ?? 5
  );
  const [consultationFee, setConsultationFee] = useState<number>(
    doctorToEdit?.consultationFee ?? 150
  );
  const [bio, setBio] = useState(doctorToEdit?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    doctorToEdit?.avatarUrl || doctorToEdit?.user?.image || ''
  );
  const [isAcceptingPatients, setIsAcceptingPatients] = useState(
    doctorToEdit?.isAcceptingPatients ?? true
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentId) {
      toast.error('Please select a clinical department');
      return;
    }

    const qualifications = qualificationsText
      .split(',')
      .map((q) => q.trim())
      .filter(Boolean);

    if (qualifications.length === 0) {
      toast.error('Please enter at least one qualification or degree');
      return;
    }

    startTransition(async () => {
      try {
        if (doctorToEdit) {
          const docId = doctorToEdit.id || doctorToEdit._id.toString();
          const res = await updateDoctorAction({
            id: docId,
            name,
            departmentId,
            licenseNumber,
            specialization,
            qualifications,
            yearsOfExperience: Number(yearsOfExperience),
            consultationFee: Number(consultationFee),
            bio,
            avatarUrl,
            isAcceptingPatients,
          });

          if (!res.success) {
            toast.error(res.error || 'Failed to update doctor profile');
            return;
          }

          toast.success('Doctor profile updated successfully');
          router.push('/admin/doctors');
          router.refresh();
        } else {
          const res = await createDoctorAction({
            name,
            email,
            departmentId,
            licenseNumber,
            specialization,
            qualifications,
            yearsOfExperience: Number(yearsOfExperience),
            consultationFee: Number(consultationFee),
            bio,
            avatarUrl,
            isAcceptingPatients,
          });

          if (!res.success) {
            toast.error(res.error || 'Failed to register physician');
            return;
          }

          toast.success('Physician registered successfully');
          router.push('/admin/doctors');
          router.refresh();
        }
      } catch (err) {
        toast.error('An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/doctors">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {doctorToEdit ? `Edit Dr. ${doctorToEdit.user?.name || ''}` : 'Register New Physician'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {doctorToEdit
                ? 'Update clinical credentials, bio, fees, and patient intake status.'
                : 'Enroll a credentialed physician, assign their department, and upload verified credentials.'}
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {doctorToEdit ? 'Save Changes' : 'Register Doctor'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Intake Status */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4">
            <h3 className="font-semibold text-sm">Physician Portrait</h3>
            <p className="text-xs text-muted-foreground">
              Direct signed upload with automated face-centering & thumbnail generation.
            </p>

            <ClinicUploadWidget
              preset="clinic_doctor_profiles"
              currentUrl={avatarUrl}
              label="Upload Physician Photo"
              onUploadComplete={(res) => setAvatarUrl(res.secureUrl)}
            />
          </div>

          <div className="p-5 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="accepting-switch" className="font-semibold text-sm cursor-pointer">
                  Accepting Patients
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available in the public directory and AI triage router.
                </p>
              </div>
              <Switch
                id="accepting-switch"
                checked={isAcceptingPatients}
                onCheckedChange={setIsAcceptingPatients}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4">
            <h3 className="font-semibold text-sm border-b pb-3 text-foreground">
              Personal & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-name">Full Name</Label>
                <Input
                  id="doc-name"
                  placeholder="e.g. Dr. Marcus Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-email">Email Address</Label>
                <Input
                  id="doc-email"
                  type="email"
                  placeholder="e.g. marcus.vance@clinic.test"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!doctorToEdit}
                  required
                />
                {doctorToEdit && (
                  <p className="text-[11px] text-muted-foreground">
                    Email is linked to auth user account and cannot be modified here.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4">
            <h3 className="font-semibold text-sm border-b pb-3 text-foreground">
              Clinical Department & Specialty
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-dept">Clinical Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger id="doc-dept">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem
                        key={(dept as any)._id?.toString() || dept.id}
                        value={(dept as any)._id?.toString() || dept.id}
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-license">Medical License Number</Label>
                <Input
                  id="doc-license"
                  placeholder="e.g. MD-98214-NY"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="doc-spec">Specialization Subfield</Label>
                <Input
                  id="doc-spec"
                  placeholder="e.g. Interventional Cardiology & Structural Heart Disease"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="doc-quals">Qualifications & Degrees (comma-separated)</Label>
                <Input
                  id="doc-quals"
                  placeholder="e.g. MD, FACC, Harvard Medical School, Board Certified"
                  value={qualificationsText}
                  onChange={(e) => setQualificationsText(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-exp">Years of Experience</Label>
                <Input
                  id="doc-exp"
                  type="number"
                  min={0}
                  max={70}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-fee">Consultation Fee (USD $)</Label>
                <Input
                  id="doc-fee"
                  type="number"
                  min={0}
                  step={5}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4">
            <h3 className="font-semibold text-sm border-b pb-3 text-foreground">
              Clinical Bio & Patient Background
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="doc-bio">Physician Biography</Label>
              <Textarea
                id="doc-bio"
                rows={5}
                placeholder="Provide a detailed overview of clinical training, hospital affiliations, specialized procedures, and patient philosophy..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Minimum 20 characters. Indexed for semantic search and AI Receptionist matching.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
