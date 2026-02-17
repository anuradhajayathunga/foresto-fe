import { authFetch } from '@/lib/auth';

export type RestaurantDetails = {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean;
  subscription_tier?: string;
  created_at?: string;
  updated_at?: string;
};

// optional alias call
export async function getMyRestaurantAlias(): Promise<RestaurantDetails> {
  const response = await authFetch('/api/auth/my-restaurants/');
  return response.json();
}
