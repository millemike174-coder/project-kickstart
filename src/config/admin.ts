// Admin authorization is now stored server-side in the `user_roles` table.
// Use `useAdminAuth` (which checks the server-side role) instead of any
// client-side email comparison.
import { supabase } from '@/integrations/supabase/client';

export async function checkIsAdmin(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) return false;
  return !!data;
}
