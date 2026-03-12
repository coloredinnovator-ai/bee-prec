import { PageHero } from "@/components/page-hero";
import { ProfileConsole } from "@/components/forms/profile-console";

export default function AccountProfilePage() {
  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Profile baseline"
        title="Manage the member profile in its own lane."
        description="Wave 1 covers account creation, role-safe profile editing, and member preferences. Identity verification, deletion workflows, and advanced matching remain scheduled for the next build wave."
      />
      <ProfileConsole />
    </div>
  );
}
