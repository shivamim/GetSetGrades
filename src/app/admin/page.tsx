import { hasAdminSession } from "@/lib/admin-auth";
import AdminLoginForm from "@/components/admin/admin-login-form";
import AdminDashboard from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await hasAdminSession();
  return authenticated ? <AdminDashboard /> : <AdminLoginForm />;
}
