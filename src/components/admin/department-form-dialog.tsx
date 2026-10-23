'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  createDepartmentAction,
  updateDepartmentAction,
} from '@/actions/department.actions';
import { DepartmentLean } from '@/models/Department';
import {
  Activity,
  HeartPulse,
  Stethoscope,
  Brain,
  Bone,
  Baby,
  Eye,
  Pill,
  Microscope,
  Syringe,
  Sparkles,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { name: 'Activity', icon: Activity, label: 'General / Health' },
  { name: 'HeartPulse', icon: HeartPulse, label: 'Cardiology' },
  { name: 'Brain', icon: Brain, label: 'Neurology' },
  { name: 'Bone', icon: Bone, label: 'Orthopedics' },
  { name: 'Baby', icon: Baby, label: 'Pediatrics' },
  { name: 'Stethoscope', icon: Stethoscope, label: 'Internal Medicine' },
  { name: 'Eye', icon: Eye, label: 'Ophthalmology' },
  { name: 'Pill', icon: Pill, label: 'Pharmacy' },
  { name: 'Microscope', icon: Microscope, label: 'Pathology / Lab' },
  { name: 'Syringe', icon: Syringe, label: 'Immunology' },
  { name: 'Sparkles', icon: Sparkles, label: 'Dermatology' },
  { name: 'ShieldAlert', icon: ShieldAlert, label: 'Emergency' },
];

export function getDepartmentIcon(iconName: string) {
  const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
  return found ? found.icon : Activity;
}

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentToEdit?: DepartmentLean | null;
  onSuccess?: () => void;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  departmentToEdit,
  onSuccess,
}: DepartmentFormDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Activity');
  const [isActive, setIsActive] = useState(true);
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (departmentToEdit) {
      setName(departmentToEdit.name);
      setSlug(departmentToEdit.slug);
      setDescription(departmentToEdit.description);
      setIconName(departmentToEdit.iconName || 'Activity');
      setIsActive(departmentToEdit.isActive ?? true);
      setAutoSlug(false);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setIconName('Activity');
      setIsActive(true);
      setAutoSlug(true);
    }
  }, [departmentToEdit, open]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSlug && !departmentToEdit) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        if (departmentToEdit) {
          const res = await updateDepartmentAction({
            id: (departmentToEdit as any)._id?.toString() || departmentToEdit.id,
            name,
            slug,
            description,
            iconName,
            isActive,
          });

          if (!res.success) {
            toast.error(res.error || 'Failed to update department');
            return;
          }

          toast.success('Department updated successfully');
        } else {
          const res = await createDepartmentAction({
            name,
            slug,
            description,
            iconName,
            isActive,
          });

          if (!res.success) {
            toast.error(res.error || 'Failed to create department');
            return;
          }

          toast.success('Department created successfully');
        }

        onOpenChange(false);
        router.refresh();
        onSuccess?.();
      } catch (err) {
        toast.error('An unexpected error occurred.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {departmentToEdit ? 'Edit Clinical Department' : 'Add Clinical Department'}
          </DialogTitle>
          <DialogDescription>
            {departmentToEdit
              ? 'Update the department details and clinical specialty metadata.'
              : 'Create a new clinical department to organize doctors, services, and appointment routing.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="dept-name">Department Name</Label>
            <Input
              id="dept-name"
              placeholder="e.g. Cardiology"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="dept-slug">URL Slug</Label>
              {!departmentToEdit && (
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {autoSlug ? 'Manual Slug' : 'Auto-Generate Slug'}
                </button>
              )}
            </div>
            <Input
              id="dept-slug"
              placeholder="e.g. cardiology"
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Used in routes and SEO: /doctors?department={slug || '...'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Department Icon</Label>
            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border rounded-md">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    className={`flex flex-col items-center justify-center p-2 rounded-md text-xs gap-1 border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="truncate max-w-[70px] text-[10px]">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-desc">Description</Label>
            <Textarea
              id="dept-desc"
              rows={3}
              placeholder="Provide a comprehensive summary of services, clinical scope, and treatments offered..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <Label htmlFor="dept-active" className="cursor-pointer">
                Active Department
              </Label>
              <p className="text-xs text-muted-foreground">
                Visible to patients when booking appointments and browsing directory.
              </p>
            </div>
            <Switch
              id="dept-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {departmentToEdit ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
