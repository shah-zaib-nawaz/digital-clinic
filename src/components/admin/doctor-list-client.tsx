'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DoctorWithDetailsLean } from '@/models/Doctor';
import { DepartmentLean } from '@/models/Department';
import { DoctorAvatar } from '@/components/doctors/doctor-avatar';
import {
  toggleDoctorAcceptingAction,
  deleteDoctorAction,
} from '@/actions/doctor.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Star,
  UserCheck,
  Stethoscope,
} from 'lucide-react';

interface DoctorListClientProps {
  initialDoctors: DoctorWithDetailsLean[];
  departments: DepartmentLean[];
}

export function DoctorListClient({
  initialDoctors,
  departments,
}: DoctorListClientProps) {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorWithDetailsLean[]>(initialDoctors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [, startTransition] = useTransition();

  const filtered = doctors.filter((doc) => {
    const docName = doc.user?.name || '';
    const matchesSearch =
      docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDeptId === 'all' ||
      doc.departmentId.toString() === selectedDeptId ||
      doc.department?._id?.toString() === selectedDeptId ||
      doc.department?.id === selectedDeptId;

    return matchesSearch && matchesDept;
  });

  const acceptingCount = doctors.filter((d) => d.isAcceptingPatients).length;

  const handleToggleAccepting = (doc: DoctorWithDetailsLean) => {
    const newStatus = !doc.isAcceptingPatients;
    const docId = doc.id || doc._id.toString();

    startTransition(async () => {
      try {
        const res = await toggleDoctorAcceptingAction(docId, newStatus);
        if (!res.success) {
          toast.error(res.error || 'Failed to update status');
          return;
        }

        setDoctors((prev) =>
          prev.map((d) =>
            (d.id || d._id.toString()) === docId
              ? { ...d, isAcceptingPatients: newStatus }
              : d
          )
        );
        toast.success(
          `Doctor ${doc.user?.name || ''} marked as ${newStatus ? 'Accepting Patients' : 'Not Accepting'}`
        );
        router.refresh();
      } catch (err) {
        toast.error('An error occurred.');
      }
    });
  };

  const handleDelete = (doc: DoctorWithDetailsLean) => {
    const docId = doc.id || doc._id.toString();
    if (!confirm(`Are you sure you want to deactivate and remove doctor ${doc.user?.name || ''}?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteDoctorAction(docId);
        if (!res.success) {
          toast.error(res.error || 'Failed to remove doctor');
          return;
        }

        setDoctors((prev) => prev.filter((d) => (d.id || d._id.toString()) !== docId));
        toast.success('Doctor removed successfully');
        router.refresh();
      } catch (err) {
        toast.error('Failed to remove doctor');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Medical Staff Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage credentialed physicians, departments, weekly availability, and booking status.
          </p>
        </div>

        <Link href="/admin/doctors/new">
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Register Doctor
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Physicians
            </span>
            <Stethoscope className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2">{doctors.length}</p>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Accepting Patients
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {acceptingCount}
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Clinical Departments
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary">
              {departments.length}
            </span>
          </div>
          <p className="text-2xl font-bold mt-2">{departments.length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by doctor name, specialty, or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-56">
          <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
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

        <div className="text-xs text-muted-foreground ml-auto">
          Showing {filtered.length} of {doctors.length} physicians
        </div>
      </div>

      {/* Doctors Table */}
      <div className="border rounded-xl bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Physician</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>License & Exp</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Accepting</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Stethoscope className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm">
                      {searchQuery || selectedDeptId !== 'all'
                        ? 'No physicians match your filter.'
                        : 'No doctors registered yet.'}
                    </p>
                    {!searchQuery && selectedDeptId === 'all' && (
                      <Link href="/admin/doctors/new">
                        <Button size="sm" variant="outline" className="mt-1">
                          <Plus className="h-3.5 w-3.5 mr-1" /> Register first physician
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc) => {
                const docId = doc.id || doc._id.toString();
                const docName = doc.user?.name || 'Doctor';
                const docAvatar = doc.avatarUrl || doc.user?.image;

                return (
                  <TableRow key={docId} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <DoctorAvatar
                          avatarUrl={docAvatar}
                          name={docName}
                          size="md"
                          isAcceptingPatients={doc.isAcceptingPatients}
                        />
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {docName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.specialization}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {doc.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {doc.department?.name || 'General'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <p className="font-mono text-xs">{doc.licenseNumber}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {doc.yearsOfExperience} yrs practice
                      </p>
                    </TableCell>

                    <TableCell className="font-medium text-foreground text-sm">
                      ${doc.consultationFee}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">
                          {doc.averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          ({doc.reviewCount})
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {doc.isAcceptingPatients ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs"
                        >
                          Accepting
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">
                          Paused
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/doctors/${docId}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit & Schedule"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/doctors/${docId}`}>
                                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Details & Schedule
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/doctors/${docId}`} target="_blank">
                                <Calendar className="h-3.5 w-3.5 mr-2" /> View Public Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleAccepting(doc)}>
                              {doc.isAcceptingPatients ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                  Pause Intake
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                  Resume Intake
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
