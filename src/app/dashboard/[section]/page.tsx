import EmployeeDashboard, {
  DashboardSection,
} from "@/app/dashboard/page";

const dashboardSections: DashboardSection[] = [
  "overview",
  "profile",
  "projects",
  "teams",
  "find-team",
  "messages",
  "calendar",
  "notifications",
  "announcements",
  "settings",
];

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const activeSection = dashboardSections.includes(
    section as DashboardSection,
  )
    ? (section as DashboardSection)
    : "overview";

  return <EmployeeDashboard activeSection={activeSection} />;
}
