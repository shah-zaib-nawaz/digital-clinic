'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Stethoscope, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DepartmentOption {
  name: string;
  slug: string;
}

interface HeroSearchProps {
  departments: DepartmentOption[];
}

export function HeroSearch({ departments }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [department, setDepartment] = React.useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (department && department !== 'all') params.set('department', department);

    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const quickBadges = [
    { label: 'Cardiology', slug: 'cardiology' },
    { label: 'Dermatology', slug: 'dermatology' },
    { label: 'Pediatrics', slug: 'pediatrics' },
    { label: 'Dr. Sarah Jenkins', query: 'Jenkins' },
    { label: 'Telehealth Consult', slug: 'all' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl border bg-card/95 backdrop-blur-md shadow-xl transition-all focus-within:ring-2 focus-within:ring-primary/20"
      >
        <div className="relative flex-1 w-full flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by physician, specialty, or condition..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="h-8 w-px bg-border hidden sm:block" />

        <div className="relative w-full sm:w-52 flex items-center">
          <Stethoscope className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full h-12 pl-9 pr-8 text-sm bg-transparent border-0 rounded-lg text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option value="all" className="bg-popover text-popover-foreground">
              All Specialties
            </option>
            {departments.map((dept) => (
              <option
                key={dept.slug}
                value={dept.slug}
                className="bg-popover text-popover-foreground"
              >
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <span>Find Care</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Quick search tags */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">Popular searches:</span>
        {quickBadges.map((badge, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (badge.query) {
                setQuery(badge.query);
                router.push(`/doctors?search=${encodeURIComponent(badge.query)}`);
              } else if (badge.slug && badge.slug !== 'all') {
                setDepartment(badge.slug);
                router.push(`/doctors?department=${badge.slug}`);
              } else {
                router.push('/doctors');
              }
            }}
            className="px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors cursor-pointer border border-border/50"
          >
            {badge.label}
          </button>
        ))}
      </div>
    </div>
  );
}
