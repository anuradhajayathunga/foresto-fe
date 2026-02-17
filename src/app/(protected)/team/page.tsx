'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createTeamMember,
  deleteTeamMember,
  listTeamMembers,
  TeamMember,
  TeamRole,
  updateTeamMember,
} from '@/lib/team';
import { useAuth } from '@/hooks/useAuthToken';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react';

type RoleFilter = 'ALL' | TeamRole;
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

type CreateForm = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'MANAGER' | 'STAFF' | 'VIEWER';
  password: string;
  password2: string;
};

const CREATE_INIT: CreateForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  role: 'STAFF',
  password: '',
  password2: '',
};

const ROLE_OPTIONS: TeamRole[] = ['OWNER', 'MANAGER', 'STAFF', 'VIEWER', 'ADMIN'];

function errorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (!err || typeof err !== 'object') return 'Request failed';

  const e = err as Record<string, any>;
  return (
    e.detail ||
    e.message ||
    e?.non_field_errors?.[0] ||
    e?.email?.[0] ||
    e?.username?.[0] ||
    e?.password?.[0] ||
    e?.password2?.[0] ||
    'Something went wrong'
  );
}

function fullName(u: TeamMember) {
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return name || u.username;
}

function roleBadgeVariant(role: TeamRole): 'default' | 'secondary' | 'outline' {
  if (role === 'OWNER' || role === 'ADMIN') return 'default';
  if (role === 'MANAGER') return 'secondary';
  return 'outline';
}

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className='rounded-2xl'>
      <CardHeader className='pb-2'>
        <CardDescription>{title}</CardDescription>
        <CardTitle className='text-2xl'>{value}</CardTitle>
      </CardHeader>
      <CardContent className='flex items-center justify-between pt-0'>
        <p className='text-xs text-muted-foreground'>{sub}</p>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardContent>
    </Card>
  );
}

export default function TeamUsersPage() {
  const { user, loading: authLoading } = useAuth();

  const [rows, setRows] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(CREATE_INIT);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const myRole = ((user?.role || '').toUpperCase() as TeamRole) || 'VIEWER';
  const canCreate = myRole === 'OWNER' || myRole === 'ADMIN';
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER';
  const canChangeRole = myRole === 'OWNER' || myRole === 'ADMIN';
  const canDelete = myRole === 'OWNER' || myRole === 'ADMIN';

  async function reload() {
    setLoading(true);
    setPageError(null);
    try {
      const list = await listTeamMembers();
      setRows(list);
    } catch (e) {
      setPageError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch =
        !q ||
        r.username.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        fullName(r).toLowerCase().includes(q);

      const matchRole = roleFilter === 'ALL' ? true : r.role === roleFilter;
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? r.is_active
          : !r.is_active;

      return matchSearch && matchRole && matchStatus;
    });
  }, [rows, search, roleFilter, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((x) => x.is_active).length,
      managers: rows.filter((x) => x.role === 'MANAGER').length,
    };
  }, [rows]);

  async function handleCreate() {
    if (!canCreate) return;
    if (createForm.password !== createForm.password2) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmittingCreate(true);
    try {
      await createTeamMember({
        username: createForm.username.trim(),
        email: createForm.email.trim().toLowerCase(),
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        role: createForm.role,
        password: createForm.password,
        password2: createForm.password2,
      });

      toast.success('Team member created');
      setOpenCreate(false);
      setCreateForm(CREATE_INIT);
      await reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleSetRole(member: TeamMember, role: 'MANAGER' | 'STAFF' | 'VIEWER') {
    try {
      await updateTeamMember(member.id, { role });
      setRows((prev) => prev.map((x) => (x.id === member.id ? { ...x, role } : x)));
      toast.success(`Role changed to ${role}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function handleToggleActive(member: TeamMember) {
    try {
      await updateTeamMember(member.id, { is_active: !member.is_active });
      setRows((prev) =>
        prev.map((x) =>
          x.id === member.id ? { ...x, is_active: !member.is_active } : x
        )
      );
      toast.success(member.is_active ? 'User deactivated' : 'User activated');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function handleDelete(member: TeamMember) {
    const ok = window.confirm(`Delete "${member.username}" permanently?`);
    if (!ok) return;

    try {
      await deleteTeamMember(member.id);
      setRows((prev) => prev.filter((x) => x.id !== member.id));
      toast.success('User deleted');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <main className='flex flex-col gap-6 p-6 md:p-8 max-w-[1600px] mx-auto w-full'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Team Users</h1>
          <p className='text-sm text-muted-foreground'>
            Owner can create users under the same restaurant and assign Manager / Staff / Viewer roles.
          </p>
        </div>

        {canCreate && (
          <Button onClick={() => setOpenCreate(true)} className='h-9'>
            <UserPlus className='h-4 w-4 mr-2' />
            Add Team Member
          </Button>
        )}
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <MetricCard title='Total Users' value={metrics.total} sub='All team accounts' icon={Users} />
        <MetricCard title='Active Users' value={metrics.active} sub='Can login now' icon={UserCheck} />
        <MetricCard title='Managers' value={metrics.managers} sub='Operational leads' icon={ShieldCheck} />
      </div>

      {/* Filters */}
      <Card className='rounded-2xl'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Filters</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <div className='relative'>
            <Search className='h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search by name, username, email...'
              className='pl-9'
            />
          </div>

          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger>
              <SelectValue placeholder='Role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All roles</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All status</SelectItem>
              <SelectItem value='ACTIVE'>Active</SelectItem>
              <SelectItem value='INACTIVE'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className='rounded-2xl'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg'>Team Members</CardTitle>
          <CardDescription>{filtered.length} result(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {pageError ? (
            <div className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'>
              {pageError}
            </div>
          ) : loading ? (
            <div className='text-sm text-muted-foreground'>Loading team users...</div>
          ) : filtered.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const isSelf = user?.id === m.id;
                  const isProtectedRole = m.role === 'OWNER' || m.role === 'ADMIN';

                  const allowRoleChange = canChangeRole && !isSelf && !isProtectedRole;
                  const allowStatusToggle = canManage && !isSelf && !isProtectedRole;
                  const allowDelete = canDelete && !isSelf && !isProtectedRole;

                  return (
                    <TableRow key={m.id}>
                      <TableCell className='font-medium'>{fullName(m)}</TableCell>
                      <TableCell>{m.username}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(m.role)}>{m.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {m.is_active ? (
                          <Badge variant='secondary'>ACTIVE</Badge>
                        ) : (
                          <Badge variant='outline'>INACTIVE</Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-8 w-8'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-56'>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {allowRoleChange && (
                              <>
                                <DropdownMenuItem onClick={() => handleSetRole(m, 'MANAGER')}>
                                  Set role: MANAGER
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetRole(m, 'STAFF')}>
                                  Set role: STAFF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetRole(m, 'VIEWER')}>
                                  Set role: VIEWER
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {allowStatusToggle && (
                              <DropdownMenuItem onClick={() => handleToggleActive(m)}>
                                {m.is_active ? 'Deactivate user' : 'Activate user'}
                              </DropdownMenuItem>
                            )}

                            {allowDelete && (
                              <DropdownMenuItem
                                variant='destructive'
                                onClick={() => handleDelete(m)}
                              >
                                <UserX className='h-4 w-4 mr-2' />
                                Delete user
                              </DropdownMenuItem>
                            )}

                            {!allowRoleChange && !allowStatusToggle && !allowDelete && (
                              <DropdownMenuItem disabled>
                                No actions available
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>Create Team Member</DialogTitle>
            <DialogDescription>
              This user is created inside your current restaurant tenant.
            </DialogDescription>
          </DialogHeader>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='username'>Username</Label>
              <Input
                id='username'
                value={createForm.username}
                onChange={(e) => setCreateForm((s) => ({ ...s, username: e.target.value }))}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={createForm.email}
                onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='first_name'>First name</Label>
              <Input
                id='first_name'
                value={createForm.first_name}
                onChange={(e) => setCreateForm((s) => ({ ...s, first_name: e.target.value }))}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='last_name'>Last name</Label>
              <Input
                id='last_name'
                value={createForm.last_name}
                onChange={(e) => setCreateForm((s) => ({ ...s, last_name: e.target.value }))}
              />
            </div>

            <div className='space-y-1.5 sm:col-span-2'>
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) =>
                  setCreateForm((s) => ({
                    ...s,
                    role: v as 'MANAGER' | 'STAFF' | 'VIEWER',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='MANAGER'>MANAGER</SelectItem>
                  <SelectItem value='STAFF'>STAFF</SelectItem>
                  <SelectItem value='VIEWER'>VIEWER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                value={createForm.password}
                onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='password2'>Confirm password</Label>
              <Input
                id='password2'
                type='password'
                value={createForm.password2}
                onChange={(e) => setCreateForm((s) => ({ ...s, password2: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenCreate(false)} disabled={submittingCreate}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                submittingCreate ||
                !createForm.username.trim() ||
                !createForm.email.trim() ||
                !createForm.password ||
                !createForm.password2
              }
            >
              {submittingCreate ? 'Creating...' : 'Create user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
