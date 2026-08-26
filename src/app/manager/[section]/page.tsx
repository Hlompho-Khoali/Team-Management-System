import ManagerPage, { ManagerSection } from "@/app/manager/page";

const managerSections: ManagerSection[] = [
  "overview",
  "teams",
  "employees",
  "projects",
  "leaderboard",
  "announcements",
  "join-requests",
  "messages",
  "calendar",
  "notifications",
  "settings",
];

export default async function ManagerSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const activeSection = managerSections.includes(section as ManagerSection)
    ? (section as ManagerSection)
    : "overview";

  return <ManagerPage activeSection={activeSection} />;
}