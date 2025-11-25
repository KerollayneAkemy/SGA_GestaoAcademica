
const SUPABASE_URL = "https://qsdpfqmkeedfrwopfylx.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZHBmcW1rZWVkZnJ3b3BmeWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5Mjg2NDIsImV4cCI6MjA3OTUwNDY0Mn0.LCeMAFiLYYLdDZGZo6JqByCBpZQizaOFSdAs2L89BYQ"; 
// Cria o client e expõe no global para usar em outros scripts
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.checkAuthAndRole = async (requiredRole, redirect = null) => {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    if (redirect) window.location.href = redirect;
    return null;
  }

  // pega role da tabela usuarios
  const { data: userRow, error } = await window.supabase
    .from('usuarios')
    .select('id, nome, email, user_role')
    .eq('id', session.user.id)
    .single();

  if (error || !userRow) {
    console.error('Erro ao buscar role:', error);
    if (redirect) window.location.href = redirect;
    return null;
  }

  if (requiredRole && userRow.user_role !== requiredRole) {
    if (redirect) window.location.href = redirect;
    return null;
  }

  return { id: userRow.id, email: userRow.email, nome: userRow.nome, role: userRow.user_role };
};

window.logout = async () => {
  await window.supabase.auth.signOut();
  window.location.href = 'login.html';
};