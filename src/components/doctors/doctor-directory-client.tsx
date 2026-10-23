'use client';

import { useState, useMemo } from 'react';
import { DoctorWithDetailsLean } from '@/models/Doctor';
import { DepartmentLean } from '@/models/Department';
import { DoctorCard } from '@/components/doctors/doctor-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDepartmentIcon } from '@/components/admin/department-form-dialog';
import { Search, Stethoscope, X } from 'lucide-react';

interface DoctorDirectoryClientProps {
  initialDoctors: DoctorWithDetailsLean[];
  departments: DepartmentLean[];
  baseBookingPath?: string;
}

export function DoctorDirectoryClient({
  initialDoctors,
  departments,
  baseBookingPath: _baseBookingPath = '/patient/book',
}: DoctorDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptSlug, setSelectedDeptSlug] = useState<string>('all');
  const [acceptingOnly, setAcceptingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'fee-asc' | 'fee-desc'>('rating');

  const filteredDoctors = useMemo(() => {
    return initialDoctors
      .filter((doc) => {
        const docName = doc.user?.name || '';
        const matchesSearch =
          docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.bio.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept =
          selectedDeptSlug === 'all' ||
          doc.department?.slug === selectedDeptSlug;

        const matchesAccepting = !acceptingOnly || doc.isAcceptingPatients;

        return matchesSearch && matchesDept && matchesAccepting;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return b.averageRating - a.averageRating || b.reviewCount - a.reviewCount;
        }
        if (sortBy === 'experience') {
          return b.yearsOfExperience - a.yearsOfExperience;
        }
        if (sortBy === 'fee-asc') {
          return a.consultationFee - b.consultationFee;
        }
        if (sortBy === 'fee-desc') {
          return b.consultationFee - a.consultationFee;
        }
        return 0;
      });
  }, [initialDoctors, searchQuery, selectedDeptSlug, acceptingOnly, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDeptSlug('all');
    setAcceptingOnly(false);
    setSortBy('rating');
  };

  return (
    <div className="space-y-8">
      {/* Search & Main Controls Bar */}
      <div className="p-4 sm:p-6 rounded-2xl border bg-card shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by physician name, symptom, condition, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-sm bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="w-full md:w-52">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="experience">Most Experienced</SelectItem>
                <SelectItem value="fee-asc">Fee: Low to High</SelectItem>
                <SelectItem value="fee-desc">Fee: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
          {/* Department Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
            <Button
              type="button"
              variant={selectedDeptSlug === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDeptSlug('all')}
              className="h-8 rounded-full text-xs"
            >
              All Specialties ({initialDoctors.length})
            </Button>
            {departments.map((dept) => {
              const Icon = getDepartmentIcon(dept.iconName);
              const count = initialDoctors.filter(
                (d) => d.department?.slug === dept.slug
              ).length;

              return (
                <Button
                  key={dept.slug}
                  type="button"
                  variant={selectedDeptSlug === dept.slug ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDeptSlug(dept.slug)}
                  className="h-8 rounded-full text-xs gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {dept.name}
                  <span className="text-[10px] opacity-70">({count})</span>
                </Button>
              );
            })}
          </div>

          {/* Toggle for Accepting Patients */}
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              id="accepting-toggle"
              checked={acceptingOnly}
              onCheckedChange={setAcceptingOnly}
            />
            <Label htmlFor="accepting-toggle" className="text-xs font-medium cursor-pointer">
              Accepting New Patients
            </Label>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredDoctors.length}</span>{' '}
          certified physicians
        </p>

        {(searchQuery || selectedDeptSlug !== 'all' || acceptingOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center bg-card">
          <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-base text-foreground">
            No physicians found matching your criteria
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search terms, clearing department filters, or enabling physicians with waitlists.
          </p>
          <Button onClick={clearFilters} variant="outline" size="sm" className="mt-4">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <DoctorCard key={doc.id || doc._id.toString()} doctor={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
