'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DepartmentLean } from '@/models/Department';
import {
  DepartmentFormDialog,
  getDepartmentIcon,
} from '@/components/admin/department-form-dialog';
import {
  toggleDepartmentActiveAction,
  deleteDepartmentAction,
} from '@/actions/department.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';

interface DepartmentListClientProps {
  initialDepartments: DepartmentLean[];
}

export function DepartmentListClient({
  initialDepartments,
}: DepartmentListClientProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentLean[]>(initialDepartments);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentLean | null>(null);
  const [, startTransition] = useTransition();

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = departments.filter((d) => d.isActive).length;

  const handleEdit = (dept: DepartmentLean) => {
    setSelectedDept(dept);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedDept(null);
    setIsDialogOpen(true);
  };

  const handleToggleActive = (dept: DepartmentLean) => {
    const newStatus = !dept.isActive;
    const deptId = (dept as any)._id?.toString() || dept.id;

    startTransition(async () => {
      try {
        const res = await toggleDepartmentActiveAction(deptId, newStatus);
        if (!res.success) {
          toast.error(res.error || 'Failed to change status');
          return;
        }

        setDepartments((prev) =>
          prev.map((d) =>
            ((d as any)._id?.toString() || d.id) === deptId
              ? { ...d, isActive: newStatus }
              : d
          )
        );
        toast.success(
          `Department "${dept.name}" marked as ${newStatus ? 'Active' : 'Inactive'}`
        );
        router.refresh();
      } catch (err) {
        toast.error('An error occurred.');
      }
    });
  };

  const handleDelete = (dept: DepartmentLean) => {
    const deptId = (dept as any)._id?.toString() || dept.id;
    if (!confirm(`Are you sure you want to deactivate and remove "${dept.name}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteDepartmentAction(deptId);
        if (!res.success) {
          toast.error(res.error || 'Failed to remove department');
          return;
        }

        setDepartments((prev) =>
          prev.filter((d) => ((d as any)._id?.toString() || d.id) !== deptId)
        );
        toast.success(`Department "${dept.name}" removed`);
        router.refresh();
      } catch (err) {
        toast.error('Failed to remove department');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Stat & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Clinical Departments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure clinical units, specialties, routing metadata, and public visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={handleAdd} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Departments
            </span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2">{departments.length}</p>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Active Units
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Inactive / Paused
            </span>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2 text-muted-foreground">
            {departments.length - activeCount}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground self-end sm:self-center">
          Showing {filtered.length} of {departments.length} departments
        </p>
      </div>

      {/* Table Card */}
      <div className="border rounded-xl bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="hidden md:table-cell max-w-xs">Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm">
                      {searchQuery
                        ? 'No departments match your search.'
                        : 'No departments configured yet.'}
                    </p>
                    {!searchQuery && (
                      <Button size="sm" variant="outline" onClick={handleAdd} className="mt-1">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Create your first department
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((dept) => {
                const IconComponent = getDepartmentIcon(dept.iconName);
                const deptId = (dept as any)._id?.toString() || dept.id;

                return (
                  <TableRow key={deptId} className="group">
                    <TableCell>
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {dept.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      /{dept.slug}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground line-clamp-2 max-w-sm">
                      {dept.description}
                    </TableCell>
                    <TableCell>
                      {dept.isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(dept)}
                          title="Edit department"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(dept)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(dept)}>
                              {dept.isActive ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(dept)}
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

      {/* Modal Dialog */}
      <DepartmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        departmentToEdit={selectedDept}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
