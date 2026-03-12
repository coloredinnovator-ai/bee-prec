import { PageHero } from "@/components/page-hero";
import { ReportHarmForm } from "@/components/forms/report-harm-form";

export default function ReportHarmPage() {
  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Protected reporting"
        title="Submit harm and misconduct reports through a narrower, safer write path."
        description="Reports and optional evidence files now land via a server route instead of direct browser database writes. That lets staff handle triage with better validation, audit trails, and future policy controls."
        actions={[{ href: "/admin/login", label: "Staff login", kind: "ghost" }]}
        aside={
          <div className="card card--soft">
            <h3>Handling model</h3>
            <ul className="bullet-list">
              <li>Validated intake fields</li>
              <li>Optional evidence upload</li>
              <li>Initial status: open</li>
              <li>Audit event on submission</li>
            </ul>
          </div>
        }
      />
      <ReportHarmForm />
    </div>
  );
}
