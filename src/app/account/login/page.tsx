import { AuthConsole } from "@/components/forms/auth-console";
import { PageHero } from "@/components/page-hero";

export default function AccountLoginPage() {
  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Member access"
        title="Sign in to the member routes without turning the public website into an application shell."
        description="Authentication stays available for members and staff, but it no longer takes over the landing page. Account bootstrapping writes the user record through a secure server route."
      />
      <AuthConsole />
    </div>
  );
}
