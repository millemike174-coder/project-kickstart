// Lista email autorizzate per accedere all'area admin.
// Per modificare gli admin, edita questo array.
export const ADMIN_EMAILS = ['s.cristianwork@gmail.com'];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}
