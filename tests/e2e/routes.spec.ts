import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", title: "A tighter website" },
  { path: "/clinic", title: "Open a cooperative legal intake" },
  { path: "/report-harm", title: "Submit harm and misconduct reports" },
  { path: "/community", title: "Public framing on the outside" },
  { path: "/account/login", title: "Sign in to the member routes" },
  { path: "/admin/login", title: "Authenticate for triage" }
];

for (const route of routes) {
  test(`route renders ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(route.title);
    await expect(page.getByRole("navigation").first()).toContainText("Clinic");
  });
}
