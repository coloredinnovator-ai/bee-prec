import { ClinicIntakeForm } from "@/components/forms/clinic-intake-form";
import { PageHero } from "@/components/page-hero";

export default function ClinicPage() {
  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Clinic intake"
        title="Open a cooperative legal intake without routing everything through email."
        description="This route replaces the old homepage form. Submissions go through a validated server handler, are recorded in Firestore, and emit audit events for operational traceability."
        actions={[{ href: "/account/login", label: "Member login", kind: "ghost" }]}
        aside={
          <div className="card card--soft">
            <h3>What lands in the queue</h3>
            <ul className="bullet-list">
              <li>Stage and help type for triage</li>
              <li>Structured contact preference</li>
              <li>Server-side intake ID for follow-up</li>
            </ul>
          </div>
        }
      />
      <ClinicIntakeForm />
    </div>
  );
}
