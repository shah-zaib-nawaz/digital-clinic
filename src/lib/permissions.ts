import { createAccessControl } from 'better-auth/plugins/access';

export const statement = {
  appointment: [
    'create',
    'read:own',
    'read:assigned',
    'read:all',
    'update:own',
    'update:assigned',
    'update:all',
    'cancel:own',
    'cancel:all',
    'reschedule:all',
  ],
  visitNote: [
    'create:assigned',
    'read:own',
    'read:assigned',
    'read:all',
    'update:assigned',
    'sign:assigned',
  ],
  department: ['create', 'read', 'update', 'delete'],
  doctor: ['create', 'read', 'update', 'delete'],
  analytics: ['read:kpi', 'read:telemetry', 'export'],
  user: ['create', 'read', 'update', 'delete', 'ban'],
} as const;

export const ac = createAccessControl(statement);

export const patientRole = ac.newRole({
  appointment: ['create', 'read:own', 'cancel:own'],
  visitNote: ['read:own'],
  department: ['read'],
  doctor: ['read'],
});

export const doctorRole = ac.newRole({
  appointment: ['read:assigned', 'update:assigned'],
  visitNote: ['create:assigned', 'read:assigned', 'update:assigned', 'sign:assigned'],
  department: ['read'],
  doctor: ['read', 'update'],
});

export const adminRole = ac.newRole({
  appointment: ['create', 'read:all', 'update:all', 'cancel:all', 'reschedule:all'],
  visitNote: ['read:all'],
  department: ['create', 'read', 'update', 'delete'],
  doctor: ['create', 'read', 'update', 'delete'],
  analytics: ['read:kpi'],
  user: ['read', 'update'],
});

export const superadminRole = ac.newRole({
  appointment: ['create', 'read:all', 'update:all', 'cancel:all', 'reschedule:all'],
  visitNote: [
    'create:assigned',
    'read:assigned',
    'read:all',
    'update:assigned',
    'sign:assigned',
  ],
  department: ['create', 'read', 'update', 'delete'],
  doctor: ['create', 'read', 'update', 'delete'],
  analytics: ['read:kpi', 'read:telemetry', 'export'],
  user: ['create', 'read', 'update', 'delete', 'ban'],
});

export const roles = {
  patient: patientRole,
  doctor: doctorRole,
  admin: adminRole,
  superadmin: superadminRole,
};

export type RoleName = keyof typeof roles;
