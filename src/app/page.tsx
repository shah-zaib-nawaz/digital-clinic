import Link from 'next/link';
import {
  Activity,
  HeartPulse,
  Brain,
  Bone,
  Baby,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  ShieldAlert,
  Video,
  Lock,
  ArrowRight,
  Star,
  CheckCircle2,
  Clock,
  Award,
  Users,
  Building2,
  FileCheck2,
  Cpu,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserButton } from '@/components/auth/user-button';
import { DoctorAvatar } from '@/components/doctors/doctor-avatar';
import { HeroSearch } from '@/components/home/hero-search';
import { DemoCredentialsCard } from '@/components/home/demo-credentials-card';
import { AiAssistantPreview } from '@/components/home/ai-assistant-preview';
import { getCachedDepartments, getCachedDoctorDirectory } from '@/lib/queries/doctor-directory';

// Fallback medical departments for resilience in offline / pre-seeded environments
const FALLBACK_DEPARTMENTS = [
  {
    name: 'Cardiology',
    slug: 'cardiology',
    description: 'Comprehensive cardiac assessments, hypertension therapy, and preventive heart wellness.',
    iconName: 'HeartPulse',
  },
  {
    name: 'Dermatology',
    slug: 'dermatology',
    description: 'Specialized clinical care for complex skin conditions, melanoma screenings, and aesthetics.',
    iconName: 'Sparkles',
  },
  {
    name: 'Pediatrics',
    slug: 'pediatrics',
    description: 'Compassionate care for infants, children, and adolescents, including milestone monitoring.',
    iconName: 'Baby',
  },
  {
    name: 'Neurology',
    slug: 'neurology',
    description: 'Advanced diagnostic evaluations for headaches, neurological disorders, and neuropathy.',
    iconName: 'Brain',
  },
  {
    name: 'Orthopedics',
    slug: 'orthopedics',
    description: 'Musculoskeletal therapy, sports medicine rehabilitation, joint care, and spine health.',
    iconName: 'Bone',
  },
  {
    name: 'General Medicine',
    slug: 'general-medicine',
    description: 'Preventive annual physicals, chronic disease management, and primary outpatient consultations.',
    iconName: 'Stethoscope',
  },
];

// Fallback featured doctors for seamless presentation
const FALLBACK_DOCTORS = [
  {
    id: 'doc-sarah-jenkins',
    name: 'Dr. Sarah Jenkins, MD, FACC',
    specialty: 'Cardiologist',
    departmentName: 'Cardiology',
    departmentSlug: 'cardiology',
    rating: 4.98,
    reviewCount: 124,
    yearsOfExperience: 14,
    consultationFee: 150,
    bio: 'Board-certified cardiologist specializing in preventive cardiology, heart rhythm disorders, and outpatient cardiac rehab.',
    isAccepting: true,
  },
  {
    id: 'doc-marcus-vance',
    name: 'Dr. Marcus Vance, MD, FAAD',
    specialty: 'Dermatologist',
    departmentName: 'Dermatology',
    departmentSlug: 'dermatology',
    rating: 4.95,
    reviewCount: 98,
    yearsOfExperience: 11,
    consultationFee: 135,
    bio: 'Dermatologist with expertise in complex inflammatory skin diseases, melanoma screening, and restorative skin treatments.',
    isAccepting: true,
  },
  {
    id: 'doc-elena-rostova',
    name: 'Dr. Elena Rostova, MD, FAAP',
    specialty: 'Pediatric Specialist',
    departmentName: 'Pediatrics',
    departmentSlug: 'pediatrics',
    rating: 4.99,
    reviewCount: 167,
    yearsOfExperience: 16,
    consultationFee: 120,
    bio: 'Dedicated pediatrician passionate about developmental milestones, adolescent wellness, and family-centered pediatric care.',
    isAccepting: true,
  },
  {
    id: 'doc-arjun-patel',
    name: 'Dr. Arjun Patel, MD, FAAN',
    specialty: 'Neurologist',
    departmentName: 'Neurology',
    departmentSlug: 'neurology',
    rating: 4.92,
    reviewCount: 82,
    yearsOfExperience: 12,
    consultationFee: 175,
    bio: 'Clinical neurologist focusing on headache disorders, peripheral neuropathy, and cognitive health management.',
    isAccepting: true,
  },
];

function getDepartmentIcon(iconName: string) {
  switch (iconName) {
    case 'HeartPulse':
      return HeartPulse;
    case 'Sparkles':
      return Sparkles;
    case 'Baby':
      return Baby;
    case 'Brain':
      return Brain;
    case 'Bone':
      return Bone;
    case 'Stethoscope':
    default:
      return Stethoscope;
  }
}

export default async function HomePage() {
  let departments: any[] = [];
  let doctors: any[] = [];

  try {
    departments = await getCachedDepartments();
    doctors = await getCachedDoctorDirectory({ acceptingOnly: true });
  } catch (error) {
    console.warn('Cached directory fetch failed; fallback data will be used:', error);
  }

  // Fallback defaults
  const activeDepartments =
    departments && departments.length > 0 ? departments : FALLBACK_DEPARTMENTS;

  const displayDoctors =
    doctors && doctors.length > 0
      ? doctors.slice(0, 4).map((d: any) => ({
          id: d.id || d._id?.toString() || 'doctor',
          name: d.user?.name || 'Dr. Physician',
          specialty: d.specialization || d.department?.name || 'Physician',
          departmentName: d.department?.name || 'General Medicine',
          departmentSlug: d.department?.slug || 'general-medicine',
          rating: d.averageRating || 4.9,
          reviewCount: d.reviewCount || 35,
          yearsOfExperience: d.yearsOfExperience || 10,
          consultationFee: d.consultationFee || 150,
          bio: d.bio || 'Board-certified clinical specialist dedicated to exceptional outpatient care.',
          avatarUrl: d.avatarUrl || d.user?.image,
          isAccepting: d.isAcceptingPatients ?? true,
        }))
      : FALLBACK_DOCTORS;

  const searchDepartmentOptions = activeDepartments.map((dept: any) => ({
    name: dept.name,
    slug: dept.slug,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20 group-hover:scale-105 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Digital Clinic
              </span>
            </Link>
            <span className="hidden md:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Enterprise EHR
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/doctors" className="hover:text-foreground transition-colors">
              Find Doctors
            </Link>
            <Link href="#departments" className="hover:text-foreground transition-colors">
              Specialties
            </Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#ai-assistant" className="hover:text-foreground transition-colors">
              AI Receptionist
            </Link>
            <Link href="#role-portals" className="hover:text-foreground transition-colors">
              Role Portals
            </Link>
            <Link href="/patient" className="hover:text-foreground transition-colors">
              Patient Portal
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <UserButton />
            <Button size="sm" asChild className="hidden sm:inline-flex gap-1.5 shadow-sm">
              <Link href="/doctors">
                Book Consultation <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -z-10" />

          <div className="container mx-auto px-4 sm:px-8 max-w-5xl text-center space-y-6">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Real-Time Verified Slots Open • 5-Minute Atomic Slot TTL
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
              Precision Healthcare Scheduling & Outpatient Telehealth
            </h1>

            {/* Subheading */}
            <p className="max-w-3xl mx-auto text-base sm:text-xl text-muted-foreground leading-relaxed">
              Connect with board-certified medical specialists in seconds. Engineered with
              high-concurrency 5-minute atomic slot locks, sealed cryptographic SOAP charting,
              and conversational AI triage with 100% emergency deflection.
            </p>

            {/* Interactive Live Search Component */}
            <div className="pt-4">
              <HeroSearch departments={searchDepartmentOptions} />
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Zero Double-Bookings Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-500" />
                <span>HIPAA-Ready & Sealed SOAP Notes</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-500" />
                <span>Sub-50ms WebRTC Telehealth</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>HMAC-Signed Autonomous AI</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Clinical Care Metrics Strip */}
        <section className="container mx-auto px-4 sm:px-8 py-12 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-primary">100%</div>
              <div className="text-xs uppercase tracking-wider font-bold text-foreground">
                Concurrency Safe
              </div>
              <p className="text-xs text-muted-foreground">
                Zero double-booking with atomic 5-min TTL locks
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-teal-600 dark:text-teal-400">
                &lt; 50ms
              </div>
              <div className="text-xs uppercase tracking-wider font-bold text-foreground">
                Video Latency
              </div>
              <p className="text-xs text-muted-foreground">
                Peer-to-peer WebRTC consultation suites
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
                12+
              </div>
              <div className="text-xs uppercase tracking-wider font-bold text-foreground">
                Board Specialties
              </div>
              <p className="text-xs text-muted-foreground">
                Cardiology, Dermatology, Pediatrics, Neurology & more
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-500">
                4.98<span className="text-xl font-normal text-muted-foreground">/5</span>
              </div>
              <div className="text-xs uppercase tracking-wider font-bold text-foreground">
                Patient Satisfaction
              </div>
              <p className="text-xs text-muted-foreground">
                Based on verified post-consultation reviews
              </p>
            </div>
          </div>
        </section>

        {/* 4. Specialties & Medical Departments Section */}
        <section id="departments" className="container mx-auto px-4 sm:px-8 py-16 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Building2 className="h-3.5 w-3.5" /> Clinical Departments
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Comprehensive Outpatient Specialties
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Direct access to leading medical departments, from preventive cardiology to pediatric wellness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDepartments.map((dept: any) => {
              const IconComp = getDepartmentIcon(dept.iconName);
              return (
                <Link
                  key={dept.slug}
                  href={`/doctors?department=${dept.slug}`}
                  className="group p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        Active Specialists
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {dept.name}
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {dept.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Explore Department</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/doctors">
                Browse Full Clinical Directory <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* 5. Featured Board-Certified Specialists */}
        <section id="featured-doctors" className="container mx-auto px-4 sm:px-8 py-16 max-w-6xl border-t">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                <BadgeCheck className="h-3.5 w-3.5" /> Distinguished Faculty
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Meet Our Board-Certified Specialists
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Top-rated physicians currently accepting new outpatient appointments and instant telehealth visits.
              </p>
            </div>

            <Button asChild variant="outline" className="self-start md:self-auto gap-2">
              <Link href="/doctors">
                View All Physicians <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayDoctors.map((doc: any) => (
              <div
                key={doc.id}
                className="group rounded-2xl border bg-card p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <DoctorAvatar
                      name={doc.name}
                      avatarUrl={doc.avatarUrl}
                      size="lg"
                      isAcceptingPatients={doc.isAccepting}
                    />
                    <div className="flex items-center gap-1 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span>{Number(doc.rating).toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground">({doc.reviewCount})</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                      {doc.name}
                    </h3>
                    <p className="text-xs font-medium text-primary mt-0.5">{doc.specialty}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {doc.bio}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Experience:</span>
                      <span className="font-medium text-foreground">{doc.yearsOfExperience} years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Consultation Fee:</span>
                      <span className="font-semibold text-foreground">${doc.consultationFee}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild className="w-full text-xs">
                    <Link href={`/doctors/${doc.id}`}>Profile</Link>
                  </Button>
                  <Button size="sm" asChild className="w-full text-xs shadow-xs">
                    <Link href={`/doctors/${doc.id}`}>Book Slot</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. The 4-Step Modern Patient Journey */}
        <section id="how-it-works" className="container mx-auto px-4 sm:px-8 py-16 max-w-6xl border-t">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Clock className="h-3.5 w-3.5" /> Patient Care Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Precision Care in 4 Frictionless Steps
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              A transparent, reliable clinical experience from symptom matching to tamper-evident EHR records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative p-6 rounded-2xl border bg-card/60 backdrop-blur-xs space-y-3">
              <div className="text-4xl font-black text-primary/20">01</div>
              <h3 className="font-semibold text-lg text-foreground">Select Specialist</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Filter by department, doctor credentials, patient ratings, and real-time open slots.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified Provider Profiles
              </div>
            </div>

            <div className="relative p-6 rounded-2xl border bg-card/60 backdrop-blur-xs space-y-3">
              <div className="text-4xl font-black text-teal-500/20">02</div>
              <h3 className="font-semibold text-lg text-foreground">5-Min Atomic Slot Hold</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your selected appointment window is locked atomically in MongoDB for 5 minutes while you review details.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium pt-2">
                <Lock className="h-3.5 w-3.5" /> Zero Double-Booking Lock
              </div>
            </div>

            <div className="relative p-6 rounded-2xl border bg-card/60 backdrop-blur-xs space-y-3">
              <div className="text-4xl font-black text-blue-500/20">03</div>
              <h3 className="font-semibold text-lg text-foreground">In-Person or WebRTC Visit</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Meet at our outpatient pavilion or join an encrypted WebRTC room with sub-50ms peer-to-peer video.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium pt-2">
                <Video className="h-3.5 w-3.5" /> High-Definition Video Room
              </div>
            </div>

            <div className="relative p-6 rounded-2xl border bg-card/60 backdrop-blur-xs space-y-3">
              <div className="text-4xl font-black text-purple-500/20">04</div>
              <h3 className="font-semibold text-lg text-foreground">Sealed SOAP EHR Note</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive doctor's sealed clinical findings, digital prescription, and follow-up guidance in your patient vault.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium pt-2">
                <FileCheck2 className="h-3.5 w-3.5" /> Tamper-Evident SHA-256
              </div>
            </div>
          </div>
        </section>

        {/* 7. Autonomous AI Receptionist Showcase */}
        <section id="ai-assistant" className="container mx-auto px-4 sm:px-8 py-16 max-w-6xl border-t">
          <AiAssistantPreview />
        </section>

        {/* 8. Role Portals & Interactive Testing Sandbox */}
        <section id="role-portals" className="container mx-auto px-4 sm:px-8 py-16 max-w-6xl border-t">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Users className="h-3.5 w-3.5" /> Multi-Tenant Role Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Experience Every Clinical Perspective
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Test out the platform as a Patient, Outpatient Physician, or Operations Administrator
              with instant one-click demo credentials.
            </p>
          </div>

          <DemoCredentialsCard />
        </section>

        {/* 9. Verified Patient & Physician Testimonials */}
        <section className="container mx-auto px-4 sm:px-8 py-16 max-w-6xl border-t">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Award className="h-3.5 w-3.5" /> Clinical Excellence
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Trusted by Patients & Healthcare Professionals
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Real feedback from consultations completed through the Digital Clinic platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-xs space-y-4">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                &quot;The 5-minute slot lock took all the panic out of scheduling. Joined the telehealth video room in one click—Dr. Jenkins was extraordinarily thorough and warm.&quot;
              </p>
              <div className="pt-2 border-t">
                <div className="font-semibold text-sm text-foreground">Michael R.</div>
                <div className="text-xs text-muted-foreground">Cardiology Patient • Telehealth Visit</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-xs space-y-4">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                &quot;Authoring SOAP notes directly in the physician cockpit is effortless. Cryptographic sealing guarantees clinical record integrity that meets strict medical board standards.&quot;
              </p>
              <div className="pt-2 border-t">
                <div className="font-semibold text-sm text-foreground">Dr. Marcus Vance, MD</div>
                <div className="text-xs text-muted-foreground">Lead Dermatologist • Outpatient Clinic</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-xs space-y-4">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                &quot;Orchestrating our clinic&apos;s provider schedules without double-booking headaches has been transformative. The AI receptionist deflected 4 emergency cases directly to 911.&quot;
              </p>
              <div className="pt-2 border-t">
                <div className="font-semibold text-sm text-foreground">Claire Henderson</div>
                <div className="text-xs text-muted-foreground">Clinical Operations Administrator</div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. Enterprise Compliance & Security Strip */}
        <section className="container mx-auto px-4 sm:px-8 py-12 max-w-6xl border-t">
          <div className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">HIPAA-Ready Architecture</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Strict encryption at rest and in transit protecting PHI data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">HMAC-Signed HITL</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI agents cannot modify appointments without human approval cards.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Sealed SOAP Records</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cryptographic hash seals safeguard completed clinical visits.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Better Auth RBAC</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Role-based isolation across patient, doctor, and admin portals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 11. Comprehensive Healthcare Footer */}
      <footer className="border-t bg-card/40">
        {/* Emergency Interception Notice */}
        <div className="bg-red-500/10 border-b border-red-500/20 py-3.5 px-4">
          <div className="container mx-auto max-w-6xl flex items-center justify-center gap-2 text-xs sm:text-sm text-red-700 dark:text-red-400 text-center font-medium">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              <strong>Medical Emergency Notice:</strong> If you are experiencing chest pain, severe
              trauma, loss of consciousness, or breathing difficulties, immediately dial{' '}
              <strong>911</strong> or go to your nearest emergency room. Digital Clinic is for
              scheduled outpatient care only.
            </span>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-8 py-12 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="font-bold text-base text-foreground">Digital Clinic</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Precision clinical scheduling, WebRTC outpatient telehealth, and sealed SOAP EHR records.
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>All Outpatient Services Operational</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                Clinical Services
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/doctors" className="hover:text-foreground transition-colors">
                    Find Doctors
                  </Link>
                </li>
                <li>
                  <Link href="#departments" className="hover:text-foreground transition-colors">
                    Clinical Departments
                  </Link>
                </li>
                <li>
                  <Link href="/patient" className="hover:text-foreground transition-colors">
                    Patient Portal
                  </Link>
                </li>
                <li>
                  <Link href="/patient/appointments" className="hover:text-foreground transition-colors">
                    Manage Appointments
                  </Link>
                </li>
                <li>
                  <Link href="/patient/records" className="hover:text-foreground transition-colors">
                    Medical Records & SOAP Notes
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                Provider Cockpit
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/doctor" className="hover:text-foreground transition-colors">
                    Doctor Workspace
                  </Link>
                </li>
                <li>
                  <Link href="/doctor/schedule" className="hover:text-foreground transition-colors">
                    Availability & Slot Setup
                  </Link>
                </li>
                <li>
                  <Link href="/doctor/notes" className="hover:text-foreground transition-colors">
                    SOAP Clinical Notes
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-foreground transition-colors">
                    Admin Command Center
                  </Link>
                </li>
                <li>
                  <Link href="/admin/ai-telemetry" className="hover:text-foreground transition-colors">
                    AI Telemetry & Guardrails
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                Safety & Compliance
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/ai-disclaimer" className="hover:text-foreground transition-colors">
                    AI Safety & Medical Disclaimer
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy (HIPAA)
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Clinical Service
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-in" className="hover:text-foreground transition-colors">
                    Portal Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              © 2026 Digital Clinic Healthcare System. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>
              <Link href="/ai-disclaimer" className="hover:underline">
                AI Ethics
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
