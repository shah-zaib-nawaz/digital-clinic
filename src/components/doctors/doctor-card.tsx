import Link from 'next/link';
import { DoctorWithDetailsLean } from '@/models/Doctor';
import { DoctorAvatar } from '@/components/doctors/doctor-avatar';
import { getDepartmentIcon } from '@/components/admin/department-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Calendar, ShieldCheck } from 'lucide-react';

interface DoctorCardProps {
  doctor: DoctorWithDetailsLean;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const docId = doctor.id || doctor._id.toString();
  const docName = doctor.user?.name || 'Physician';
  const avatarUrl = doctor.avatarUrl || doctor.user?.image;
  const deptName = doctor.department?.name || 'General Medicine';
  const IconComponent = getDepartmentIcon(doctor.department?.iconName || 'Activity');

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all group">
      <div>
        {/* Top Header: Avatar & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <DoctorAvatar
              avatarUrl={avatarUrl}
              name={docName}
              size="lg"
              isAcceptingPatients={doctor.isAcceptingPatients}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                  {docName}
                </h3>
                <span title="Verified Physician">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {doctor.specialization}
              </p>

              {/* Department pill */}
              <div className="flex items-center gap-1 mt-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 text-[11px] gap-1 py-0.5"
                >
                  <IconComponent className="h-3 w-3" />
                  {deptName}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Snippet */}
        <p className="text-xs text-muted-foreground line-clamp-2 mt-4 leading-relaxed">
          {doctor.bio}
        </p>

        {/* Key Metrics / Highlights */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span className="font-bold text-foreground">{doctor.averageRating.toFixed(1)}</span>
            <span>({doctor.reviewCount} reviews)</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{doctor.yearsOfExperience} yrs practice</span>
          </div>
        </div>
      </div>

      {/* Footer: Fee & Booking CTA */}
      <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase font-medium tracking-wider">
            Consultation Fee
          </span>
          <span className="text-lg font-bold text-foreground">
            ${doctor.consultationFee}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/doctors/${docId}`}>
            <Button variant="outline" size="sm" className="text-xs h-8">
              Profile
            </Button>
          </Link>

          <Link href={`/patient/book?doctorId=${docId}`}>
            <Button
              size="sm"
              className="text-xs h-8 gap-1 shadow-2xs"
              disabled={!doctor.isAcceptingPatients}
            >
              <Calendar className="h-3.5 w-3.5" />
              {doctor.isAcceptingPatients ? 'Book' : 'Full'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
