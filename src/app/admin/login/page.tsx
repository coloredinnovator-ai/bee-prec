import { AuthConsole } from "@/components/forms/auth-console";
import { PageHero } from "@/components/page-hero";

export default function AdminLoginPage() {
  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Admin access"
        title="Authenticate for triage, moderation, and backup oversight."
        description="Staff access stays inside explicit admin routes. The login flow can bootstrap reviewer accounts, but queue access is still enforced server-side by role checks."
      />
      <AuthConsole adminMode />
    </div>
  );
}
