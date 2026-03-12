import { AdminOverview } from "@/components/admin/admin-overview";
import { PageHero } from "@/components/page-hero";

export default function AdminPage() {
  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Admin overview"
        title="A separate moderation and operations surface."
        description="This is the first shell for clinic triage, incident review, audit visibility, and backup ledger tracking. The deeper moderation workbench lands in the next implementation wave."
      />
      <AdminOverview />
    </div>
  );
}
