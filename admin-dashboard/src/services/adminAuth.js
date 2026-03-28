import { getSupabaseConfigError, supabase } from './supabaseClient';

function ensureSupabaseConfigured() {
  const configError = getSupabaseConfigError();
  if (configError) throw configError;
}

export async function loginAdmin(email, password) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logoutAdmin() {
  await supabase.auth.signOut();
  localStorage.removeItem('adminAuth');
  localStorage.removeItem('adminEmail');
}

export async function getAdminProfile() {
  ensureSupabaseConfigured();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session) return null;

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('role,email')
    .eq('id', session.user.id)
    .single();

  if (profileError) throw profileError;
  return { session, profile: data };
}

export async function resetAdminPassword(email) {
  ensureSupabaseConfigured();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });

  if (error) throw error;
}
