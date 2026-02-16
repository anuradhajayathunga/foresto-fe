import { authFetch, unwrapList } from '@/lib/auth';

export type TeamRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'VIEWER' | 'ADMIN';

export type TeamMember = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: TeamRole;
  is_active?: boolean;
  restaurant_id?: number;
  restaurant_slug?: string;
};

/**
 * Expected backend endpoint: GET /api/auth/users/
 * Should return users filtered to request user's restaurant.
 */
export async function listTeamMembers() {
  const res = await authFetch('/api/auth/users/?ordering=-id');
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<TeamMember>(data);
}

/**
 * Expected backend endpoint: POST /api/auth/users/
 * OWNER creates MANAGER/STAFF/VIEWER accounts in same restaurant.
 */
export async function createTeamMember(payload: {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  role: Exclude<TeamRole, 'OWNER' | 'ADMIN'>;
}) {
  const res = await authFetch('/api/auth/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as TeamMember;
}

/**
 * Expected backend endpoint: PATCH /api/auth/users/:id/
 */
export async function updateTeamMember(
  id: number,
  payload: Partial<Pick<TeamMember, 'first_name' | 'last_name' | 'role' | 'is_active'>>
) {
  const res = await authFetch(`/api/auth/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as TeamMember;
}

/**
 * Expected backend endpoint: DELETE /api/auth/users/:id/
 */
export async function deleteTeamMember(id: number) {
  const res = await authFetch(`/api/auth/users/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw data;
  }
  return true;
}
