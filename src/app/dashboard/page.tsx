"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export type DashboardSection =
  | "overview"
  | "profile"
  | "projects"
  | "archived-projects"
  | "leaderboard"
  | "poe"
  | "teams"
  | "find-team"
  | "messages"
  | "calendar"
  | "notifications"
  | "announcements"
  | "settings";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  created_at?: string;
};
type LeaderboardEntry = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  completed_projects: number;
  points: number;
};
type PoeLinks = {
  github_url: string;
  linkedin_url: string;
};
type PoeDocumentType = "poe_brief" | "initial_evaluation" | "final_evaluation";
type PoeTemplate = {
  document_type: PoeDocumentType;
  file_url: string | null;
  file_name: string | null;
};
type PoeSubmission = {
  id: string;
  employee_id: string;
  document_type: PoeDocumentType;
  file_url: string | null;
  file_name: string | null;
  submitted_at: string | null;
  signed_file_url: string | null;
  signed_file_name: string | null;
  signed_at: string | null;
  status: string;
};
type Team = {
  id: string;
  name: string;
  description?: string | null;
  leader_id?: string | null;
};
type Project = {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  assignment_type: string;
  team_id?: string | null;
  assigned_to?: string | null;
  project_zip_url?: string | null;
  project_link?: string | null;
  status: string;
  deadline?: string | null;
  created_at?: string;
  updated_at?: string;
};
type ProjectTask = {
  id: string;
  project_id: string;
  title: string;
  is_complete: boolean;
  created_at: string;
};
type ProjectSubmission = {
  id: string;
  project_id: string;
  employee_id: string;
  file_url?: string | null;
  file_name?: string | null;
  submission_link?: string | null;
  created_at: string;
};
type JoinRequest = {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  requested_at: string;
  reviewed_at?: string | null;
};
type Announcement = {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  file_url?: string | null;
  file_name?: string | null;
};
type Conversation = {
  id: string;
  type: string;
  team_id?: string | null;
  created_by?: string | null;
  created_at?: string;
};
type Message = {
  id: string;
  conversation_id: string;
  sender_id?: string;
  content?: string;
  body?: string;
  created_at?: string;
};
type CalendarEvent = {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  event_date?: string | null;
  created_at?: string;
};
type Notification = {
  id: string;
  title?: string;
  message?: string;
  content?: string;
  read?: boolean;
  is_read?: boolean;
  created_at?: string;
};
type TeamWithMembership = Team & { joined_at?: string };

const POE_DOCUMENT_TYPES: PoeDocumentType[] = [
  "poe_brief",
  "initial_evaluation",
  "final_evaluation",
];

const POE_DOCUMENT_LABELS: Record<PoeDocumentType, string> = {
  poe_brief: "POE Brief Form",
  initial_evaluation: "Initial Employer Evaluation Form",
  final_evaluation: "Final Employer Evaluation Form",
};

export default function EmployeeDashboard({
  activeSection = "overview",
}: {
  activeSection?: DashboardSection;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<TeamWithMembership[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [poeLinks, setPoeLinks] = useState<PoeLinks>({
    github_url: "",
    linkedin_url: "",
  });
  const [poeMessage, setPoeMessage] = useState("");
  const [savingPoeLinks, setSavingPoeLinks] = useState(false);
  const [poeTemplates, setPoeTemplates] = useState<Record<PoeDocumentType, PoeTemplate | undefined>>(
    {} as Record<PoeDocumentType, PoeTemplate | undefined>,
  );
  const [poeSubmissions, setPoeSubmissions] = useState<
    Record<PoeDocumentType, PoeSubmission | undefined>
  >({} as Record<PoeDocumentType, PoeSubmission | undefined>);
  const [poeUploadFiles, setPoeUploadFiles] = useState<
    Record<PoeDocumentType, File | undefined>
  >({} as Record<PoeDocumentType, File | undefined>);
  const [uploadingPoeDocument, setUploadingPoeDocument] = useState<PoeDocumentType | null>(null);
  const [archivedProjectIds, setArchivedProjectIds] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectSubmissions, setProjectSubmissions] = useState<ProjectSubmission[]>([]);
  const [submissionLinks, setSubmissionLinks] = useState<Record<string, string>>({});
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, File | undefined>>({});
  const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [newConversationManager, setNewConversationManager] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const [requestingTeamId, setRequestingTeamId] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [projectTeamFilter, setProjectTeamFilter] = useState("all");
  const [projectDeadlineFilter, setProjectDeadlineFilter] = useState("all");
  const [settingsFullName, setSettingsFullName] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsPasswordConfirmation, setSettingsPasswordConfirmation] =
    useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadEmployeeDashboard();
  }, []);

  useEffect(() => {
    if (!profile?.id || announcements.length === 0) return;
    const storageKey = `edbook-read-announcements-${profile.id}`;
    const readAnnouncementIds = JSON.parse(
      window.localStorage.getItem(storageKey) || "[]",
    ) as string[];
    const readIds = new Set(readAnnouncementIds);
    setUnreadAnnouncementCount(
      announcements.filter((announcement) => !readIds.has(announcement.id))
        .length,
    );
    if (activeSection === "announcements") {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(announcements.map((announcement) => announcement.id)),
      );
      setUnreadAnnouncementCount(0);
    }
  }, [activeSection, announcements, profile?.id]);

  async function loadEmployeeDashboard() {
    setLoading(true);
    setPageMessage("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at")
      .eq("id", user.id)
      .single();
    if (profileError || !profileData) {
      console.error(profileError);
      setPageMessage("Unable to load your profile.");
      setLoading(false);
      return;
    }
    if (profileData.role === "manager") {
      window.location.href = "/manager";
      return;
    }
    setProfile(profileData as Profile);
    setSettingsFullName(profileData.full_name || "");
    setSettingsEmail(profileData.email || user.email || "");

    const { data: leaderboardData, error: leaderboardError } = await supabase.rpc(
      "get_employee_leaderboard",
    );
    if (leaderboardError) {
      console.error("Error loading leaderboard:", {
        message: leaderboardError.message,
        code: leaderboardError.code,
        details: leaderboardError.details,
        hint: leaderboardError.hint,
      });
      setPageMessage(
        "The leaderboard is not configured yet. Run the employee leaderboard SQL migration in Supabase.",
      );
    } else {
      setLeaderboard((leaderboardData ?? []) as LeaderboardEntry[]);
    }

    const { data: poeData, error: poeError } = await supabase
      .from("poe_links")
      .select("github_url, linkedin_url")
      .eq("employee_id", user.id)
      .maybeSingle();
    if (poeError) console.error("Error loading POE links:", poeError);
    else if (poeData) setPoeLinks(poeData as PoeLinks);

    const { data: templateData, error: templateError } = await supabase
      .from("poe_document_templates")
      .select("document_type, file_url, file_name");
    if (templateError) {
      console.error("Error loading POE templates:", templateError);
    } else if (templateData) {
      const templateMap = {} as Record<PoeDocumentType, PoeTemplate | undefined>;
      for (const template of templateData as PoeTemplate[]) {
        templateMap[template.document_type] = template;
      }
      setPoeTemplates(templateMap);
    }

    const { data: poeSubmissionData, error: poeSubmissionError } = await supabase
      .from("poe_submissions")
      .select(
        "id, employee_id, document_type, file_url, file_name, submitted_at, signed_file_url, signed_file_name, signed_at, status",
      )
      .eq("employee_id", user.id);
    if (poeSubmissionError) {
      console.error("Error loading POE submissions:", poeSubmissionError);
    } else if (poeSubmissionData) {
      const submissionMap = {} as Record<PoeDocumentType, PoeSubmission | undefined>;
      for (const submission of poeSubmissionData as PoeSubmission[]) {
        submissionMap[submission.document_type] = submission;
      }
      setPoeSubmissions(submissionMap);
    }

    const { data: membershipData, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id, joined_at")
      .eq("user_id", user.id);
    if (membershipError)
      console.error("Error loading memberships:", membershipError);
    const memberships = membershipData ?? [];
    const teamIds = memberships.map((item) => item.team_id);

    let teamList: Team[] = [];
    if (teamIds.length) {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, description, leader_id")
        .in("id", teamIds)
        .order("name", { ascending: true });
      if (error)
        console.error("Error loading teams:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      else teamList = (data ?? []) as Team[];
    }
    setTeams(
      teamList.map((team) => ({
        ...team,
        joined_at: memberships.find((m) => m.team_id === team.id)?.joined_at,
      })),
    );

    const { data: allTeamsData, error: allTeamsError } = await supabase
      .from("teams")
      .select("id, name, description, leader_id")
      .order("name", { ascending: true });
    if (allTeamsError)
      console.error("Error loading available teams:", {
        message: allTeamsError.message,
        code: allTeamsError.code,
        details: allTeamsError.details,
        hint: allTeamsError.hint,
      });
    else
      setAvailableTeams(
        ((allTeamsData ?? []) as Team[]).filter(
          (team) => !teamIds.includes(team.id),
        ),
      );

    const { data: requestData, error: requestError } = await supabase
      .from("join_requests")
      .select("id, team_id, user_id, status, requested_at, reviewed_at")
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false });
    if (requestError)
      console.error("Error loading join requests:", requestError);
    else setJoinRequests((requestData ?? []) as JoinRequest[]);

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (projectError) console.error("Error loading projects:", projectError);
    else
      setProjects(
        ((projectData ?? []) as Project[]).filter(
          (project) =>
            project.assigned_to === user.id ||
            (!!project.team_id && teamIds.includes(project.team_id)),
        ),
      );

    const { data: archiveData, error: archiveError } = await supabase
      .from("project_archives")
      .select("project_id")
      .eq("employee_id", user.id);
    if (archiveError) console.error("Error loading archived projects:", archiveError);
    else setArchivedProjectIds((archiveData ?? []).map((item) => item.project_id));

    const { data: taskData, error: taskError } = await supabase
      .from("project_tasks")
      .select("id, project_id, title, is_complete, created_at")
      .order("created_at", { ascending: true });
    if (taskError) console.error("Error loading project tasks:", taskError);
    else setProjectTasks((taskData ?? []) as ProjectTask[]);
    const { data: submissionData, error: submissionError } = await supabase
      .from("project_submissions")
      .select("id, project_id, employee_id, file_url, file_name, submission_link, created_at")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });
    if (submissionError) console.error("Error loading project submissions:", submissionError);
    else setProjectSubmissions((submissionData ?? []) as ProjectSubmission[]);

    const { data: announcementData, error: announcementError } = await supabase
      .from("announcements")
      .select("id, title, content, created_by, created_at, updated_at, file_url, file_name")
      .order("created_at", { ascending: false });
    if (announcementError)
      console.error("Error loading announcements:", announcementError);
    else setAnnouncements((announcementData ?? []) as Announcement[]);

    const { data: cmData, error: cmError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);
    if (cmError) {
      console.error("Error loading conversation memberships:", {
        message: cmError.message,
        code: cmError.code,
        details: cmError.details,
        hint: cmError.hint,
      });
    }
    const conversationIds = (cmData ?? []).map((item) => item.conversation_id);
    if (conversationIds.length) {
      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .select("*")
          .in("id", conversationIds)
          .order("created_at", { ascending: false });
      if (conversationError)
        console.error("Error loading conversations:", conversationError);
      else {
        const loaded = (conversationData ?? []) as Conversation[];
        setConversations(loaded);
        setSelectedConversationId((current) => current || loaded[0]?.id || "");
      }
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true });
      if (messageError) console.error("Error loading messages:", messageError);
      else {
        const loadedMessages = (messageData ?? []) as Message[];
        setMessages(loadedMessages);
        const senderIds = [
          ...new Set(
            loadedMessages
              .map((message) => message.sender_id)
              .filter((senderId): senderId is string => Boolean(senderId)),
          ),
        ];
        if (senderIds.length) {
          const { data: senderData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", senderIds);
          setSenderNames(
            Object.fromEntries(
              (senderData ?? []).map((sender) => [
                sender.id,
                sender.full_name || sender.email,
              ]),
            ),
          );
        }
      }
    } else {
      setConversations([]);
      setMessages([]);
      setSelectedConversationId("");
    }

    const { data: calendarData, error: calendarError } = await supabase
      .from("calendar_events")
      .select("*")
      .order("created_at", { ascending: false });
    if (calendarError) {
      console.error("Error loading calendar events:", calendarError);
    } else {
      const visibleEvents = ((calendarData ?? []) as CalendarEvent[]).filter(
        (event) => {
          const eventTeamId = (event as { team_id?: string | null }).team_id;
          return !eventTeamId || teamIds.includes(eventTeamId);
        },
      );
      setCalendarEvents(visibleEvents);
    }

    const { data: notificationData, error: notificationError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (notificationError)
      console.error("Error loading notifications:", notificationError);
    else setNotifications((notificationData ?? []) as Notification[]);

    const { data: managerData, error: managerError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("role", "manager")
      .order("full_name", { ascending: true });
    if (managerError) console.error("Error loading managers:", managerError);
    else setManagers((managerData ?? []) as Profile[]);

    setLoading(false);
  }

  async function handleRequestToJoin(team: Team) {
    if (!profile) return;
    setRequestingTeamId(team.id);
    setPageMessage("");
    const existing = joinRequests.find(
      (r) =>
        r.team_id === team.id &&
        (r.status === "pending" || r.status === "approved"),
    );
    if (existing) {
      setPageMessage(
        existing.status === "approved"
          ? `You are already a member of ${team.name}.`
          : `Your request to join ${team.name} is already pending.`,
      );
      setRequestingTeamId(null);
      return;
    }
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("leader_id")
      .eq("id", team.id)
      .single();
    if (teamError || !teamData?.leader_id) {
      setPageMessage(
        "This team does not have a team leader assigned yet. Please contact a manager.",
      );
      setRequestingTeamId(null);
      return;
    }

    const { data, error } = await supabase
      .from("join_requests")
      .insert({ team_id: team.id, user_id: profile.id, status: "pending" })
      .select("id, team_id, user_id, status, requested_at, reviewed_at")
      .single();
    if (error) {
      console.error("Error creating join request:", error);
      setPageMessage(error.message);
      setRequestingTeamId(null);
      return;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: teamData.leader_id,
        title: "New team join request",
        message: `${profile.full_name || profile.email} requested to join ${team.name}.`,
        type: "join_request",
        is_read: false,
      });
    if (notificationError) {
      console.error("Error notifying team leader:", notificationError);
    }

    setJoinRequests((current) => [data as JoinRequest, ...current]);
    setPageMessage(`Request sent to join ${team.name}.`);
    setRequestingTeamId(null);
  }

  async function handleStartConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !newConversationManager) return;

    setCreatingConversation(true);
    setPageMessage("");

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({ type: "direct", team_id: null, created_by: profile.id })
      .select("id, type, team_id, created_by, created_at")
      .single();

    if (conversationError || !conversation) {
      console.error("Error creating conversation:", conversationError);
      setPageMessage(
        conversationError?.message ?? "Unable to start conversation.",
      );
      setCreatingConversation(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("conversation_members")
      .insert([
        { conversation_id: conversation.id, user_id: profile.id },
        { conversation_id: conversation.id, user_id: newConversationManager },
      ]);

    if (memberError) {
      console.error("Error adding conversation members:", memberError);
      await supabase.from("conversations").delete().eq("id", conversation.id);
      setPageMessage(memberError.message);
      setCreatingConversation(false);
      return;
    }

    setConversations((current) => [conversation as Conversation, ...current]);
    setSelectedConversationId(conversation.id);
    setNewConversationManager("");
    setPageMessage("Conversation started.");
    setCreatingConversation(false);
  }

  async function markNotificationRead(notification: Notification) {
    if (!profile || notification.is_read === true) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id)
      .eq("user_id", profile.id);

    if (error) {
      console.error("Error marking notification read:", error);
      setNotificationMessage(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true, read: true }
          : item,
      ),
    );
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !selectedConversationId || !messageText.trim()) return;
    setSendingMessage(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversationId,
        sender_id: profile.id,
        content: messageText.trim(),
      })
      .select("*")
      .single();
    if (error) {
      console.error("Error sending message:", error);
      setPageMessage(error.message);
      setSendingMessage(false);
      return;
    }
    setMessages((current) => [...current, data as Message]);
    const { data: recipientMembers } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", selectedConversationId)
      .neq("user_id", profile.id)
      .limit(1)
      .maybeSingle();
    if (recipientMembers?.user_id) {
      await supabase.from("notifications").insert({
        user_id: recipientMembers.user_id,
        title: "New message",
        message: `${profile.full_name || profile.email} sent you a message.`,
        type: "message",
        is_read: false,
      });
    }
    setMessageText("");
    setSendingMessage(false);
  }

  async function handleTaskCompletion(task: ProjectTask) {
    const { data, error } = await supabase
      .from("project_tasks")
      .update({ is_complete: !task.is_complete })
      .eq("id", task.id)
      .select("id, project_id, title, is_complete, created_at")
      .single();
    if (error || !data) {
      setPageMessage(error?.message || "Unable to update task.");
      return;
    }
    setProjectTasks((current) =>
      current.map((item) => (item.id === task.id ? (data as ProjectTask) : item)),
    );
  }

  async function handleSavePoeLinks(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSavingPoeLinks(true);
    setPoeMessage("");
    const { error } = await supabase.from("poe_links").upsert(
      {
        employee_id: profile.id,
        github_url: poeLinks.github_url.trim() || null,
        linkedin_url: poeLinks.linkedin_url.trim() || null,
      },
      { onConflict: "employee_id" },
    );
    setPoeMessage(error?.message || "Portfolio links saved successfully.");
    setSavingPoeLinks(false);
  }

  async function handleUploadPoeSubmission(documentType: PoeDocumentType) {
    if (!profile) return;
    const file = poeUploadFiles[documentType];
    if (!file) {
      setPoeMessage("Please choose a signed file to upload.");
      return;
    }
    setUploadingPoeDocument(documentType);
    setPoeMessage("");
    const filePath = `${profile.id}/${documentType}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("poe-submissions")
      .upload(filePath, file, { upsert: false, contentType: file.type });
    if (uploadError) {
      setPoeMessage(uploadError.message);
      setUploadingPoeDocument(null);
      return;
    }
    const fileUrl = supabase.storage.from("poe-submissions").getPublicUrl(filePath).data.publicUrl;
    const { data, error } = await supabase
      .from("poe_submissions")
      .upsert(
        {
          employee_id: profile.id,
          document_type: documentType,
          file_url: fileUrl,
          file_name: file.name,
          submitted_at: new Date().toISOString(),
          status: "submitted",
        },
        { onConflict: "employee_id,document_type" },
      )
      .select(
        "id, employee_id, document_type, file_url, file_name, submitted_at, signed_file_url, signed_file_name, signed_at, status",
      )
      .single();
    if (error || !data) {
      setPoeMessage(error?.message || "Unable to upload the signed form.");
      setUploadingPoeDocument(null);
      return;
    }
    setPoeSubmissions((current) => ({ ...current, [documentType]: data as PoeSubmission }));
    setPoeUploadFiles((current) => ({ ...current, [documentType]: undefined }));
    setPoeMessage("Signed form uploaded successfully.");
    setUploadingPoeDocument(null);
  }

  async function archiveProject(project: Project) {
    if (!profile || project.status !== "complete") return;
    const { error } = await supabase
      .from("project_archives")
      .insert({ project_id: project.id, employee_id: profile.id });
    if (error) {
      setPageMessage(error.message);
      return;
    }
    setArchivedProjectIds((current) => [...current, project.id]);
    setPageMessage("Project archived.");
  }

  async function restoreProject(project: Project) {
    if (!profile) return;
    const { error } = await supabase
      .from("project_archives")
      .delete()
      .eq("project_id", project.id)
      .eq("employee_id", profile.id);
    if (error) {
      setPageMessage(error.message);
      return;
    }
    setArchivedProjectIds((current) => current.filter((id) => id !== project.id));
    setPageMessage("Project restored.");
  }

  async function handleProjectSubmission(projectId: string) {
    if (!profile) return;
    const file = submissionFiles[projectId];
    const link = submissionLinks[projectId]?.trim();
    if (!file && !link) {
      setPageMessage("Add a file or link before submitting.");
      return;
    }
    setSubmittingProjectId(projectId);
    setPageMessage("");
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    if (file) {
      const filePath = `${profile.id}/${projectId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-submissions")
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (uploadError) {
        setPageMessage(uploadError.message);
        setSubmittingProjectId(null);
        return;
      }
      fileUrl = supabase.storage.from("project-submissions").getPublicUrl(filePath).data.publicUrl;
      fileName = file.name;
    }
    const { data, error } = await supabase
      .from("project_submissions")
      .insert({ project_id: projectId, employee_id: profile.id, file_url: fileUrl, file_name: fileName, submission_link: link || null })
      .select("id, project_id, employee_id, file_url, file_name, submission_link, created_at")
      .single();
    if (error || !data) setPageMessage(error?.message || "Unable to submit project work.");
    else {
      setProjectSubmissions((current) => [data as ProjectSubmission, ...current]);
      setSubmissionFiles((current) => ({ ...current, [projectId]: undefined }));
      setSubmissionLinks((current) => ({ ...current, [projectId]: "" }));
      setPageMessage("Project submission added.");
    }
    setSubmittingProjectId(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }
  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setSettingsMessage("");
    setSettingsError("");

    const nextName = settingsFullName.trim();
    const nextEmail = settingsEmail.trim().toLowerCase();
    if (!nextName || !nextEmail) {
      setSettingsError("Name and email are required.");
      setSavingProfile(false);
      return;
    }

    if (nextEmail !== profile.email.toLowerCase()) {
      const { error } = await supabase.auth.updateUser({ email: nextEmail });
      if (error) {
        setSettingsError(error.message);
        setSavingProfile(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: nextName, email: nextEmail })
      .eq("id", profile.id)
      .select("id, full_name, email, role, avatar_url, created_at")
      .single();
    if (error || !data) {
      setSettingsError(error?.message || "Unable to update your profile.");
      setSavingProfile(false);
      return;
    }
    setProfile(data as Profile);
    setSettingsMessage(
      nextEmail !== profile.email.toLowerCase()
        ? "Profile updated. Check your new email address to confirm the change."
        : "Profile updated successfully.",
    );
    setSavingProfile(false);
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      setSettingsError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSettingsError("Profile pictures must be smaller than 5 MB.");
      return;
    }

    setUploadingAvatar(true);
    setSettingsMessage("");
    setSettingsError("");
    const {
      data: { user: authenticatedUser },
    } = await supabase.auth.getUser();
    if (!authenticatedUser || authenticatedUser.id !== profile.id) {
      setSettingsError("Your session has expired. Sign out, sign in again, and retry the upload.");
      setUploadingAvatar(false);
      return;
    }
    const filePath = `${profile.id}/avatar-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: false, contentType: file.type });
    if (uploadError) {
      setSettingsError(
        `${uploadError.message} Check that the avatars bucket and upload policy are configured in Supabase.`,
      );
      setUploadingAvatar(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const avatarUrl = publicUrlData.publicUrl;
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", profile.id)
      .select("id, full_name, email, role, avatar_url, created_at")
      .single();
    if (error || !data) {
      setSettingsError(error?.message || "Unable to save your profile picture.");
    } else {
      setProfile(data as Profile);
      setSettingsMessage("Profile picture updated successfully.");
    }
    setUploadingAvatar(false);
  }

  async function handleRemoveAvatar() {
    if (!profile?.avatar_url) return;
    setRemovingAvatar(true);
    setSettingsMessage("");
    setSettingsError("");

    const avatarMarker = "/avatars/";
    const avatarPath = profile.avatar_url.includes(avatarMarker)
      ? profile.avatar_url.split(avatarMarker)[1].split("?")[0]
      : "";
    if (avatarPath) {
      const { error: storageError } = await supabase.storage
        .from("avatars")
        .remove([avatarPath]);
      if (storageError) {
        console.warn("Unable to remove the stored avatar file:", storageError);
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", profile.id)
      .select("id, full_name, email, role, avatar_url, created_at")
      .single();
    if (error || !data) {
      setSettingsError(error?.message || "Unable to remove your profile picture.");
    } else {
      setProfile(data as Profile);
      setSettingsMessage("Profile picture removed.");
    }
    setRemovingAvatar(false);
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPassword(true);
    setSettingsMessage("");
    setSettingsError("");
    if (settingsPassword.length < 6) {
      setSettingsError("Your new password must be at least 6 characters.");
      setSavingPassword(false);
      return;
    }
    if (settingsPassword !== settingsPasswordConfirmation) {
      setSettingsError("The new passwords do not match.");
      setSavingPassword(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: settingsPassword,
    });
    if (error) setSettingsError(error.message);
    else {
      setSettingsPassword("");
      setSettingsPasswordConfirmation("");
      setSettingsMessage("Password updated successfully.");
    }
    setSavingPassword(false);
  }
  function getTeamName(teamId: string) {
    return (
      teams.find((t) => t.id === teamId)?.name ??
      availableTeams.find((t) => t.id === teamId)?.name ??
      "Unknown team"
    );
  }
  function getRequestForTeam(teamId: string) {
    return joinRequests.find((r) => r.team_id === teamId);
  }
  function formatDate(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }
  function getEventTitle(event: CalendarEvent) {
    return event.title || event.name || "Company event";
  }
  function getEventStart(event: CalendarEvent) {
    return (
      event.start_at || event.starts_at || event.event_date || event.created_at
    );
  }
  function getEventEnd(event: CalendarEvent) {
    return event.end_at || event.ends_at;
  }
  function getNotificationText(n: Notification) {
    return n.message || n.content || "Notification";
  }
  function getMessageText(m: Message) {
    return m.content || m.body || "";
  }

  const selectedMessages = useMemo(
    () => messages.filter((m) => m.conversation_id === selectedConversationId),
    [messages, selectedConversationId],
  );
  const unreadNotificationCount = notifications.filter(
    (notification) =>
      notification.is_read === false || notification.read === false,
  ).length;
  const unreadCount = unreadNotificationCount + unreadAnnouncementCount;
  const profileInitials = (profile?.full_name || profile?.email || "E")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (...values: unknown[]) =>
    !normalizedSearchQuery ||
    values.some((value) =>
      String(value ?? "").toLowerCase().includes(normalizedSearchQuery),
    );
  const filteredTeams = teams.filter((team) => matchesSearch(team.name, team.description));
  const filteredProjects = projects.filter((project) =>
    matchesSearch(project.project_id, project.name, project.description) &&
    !archivedProjectIds.includes(project.id) &&
    (projectStatusFilter === "all" || project.status === projectStatusFilter) &&
    (projectTeamFilter === "all" || project.team_id === projectTeamFilter) &&
    (projectDeadlineFilter === "all" ||
      (projectDeadlineFilter === "no-deadline" && !project.deadline) ||
      (projectDeadlineFilter === "overdue" &&
        Boolean(project.deadline) &&
        new Date(project.deadline as string) < new Date()) ||
      (projectDeadlineFilter === "upcoming" &&
        Boolean(project.deadline) &&
        new Date(project.deadline as string) >= new Date())),
  );
  const filteredAnnouncements = announcements.filter((announcement) =>
    matchesSearch(announcement.title, announcement.content),
  );
  const filteredMessages = messages.filter((message) =>
    matchesSearch(message.content, message.body, senderNames[message.sender_id || ""]),
  );
  const archivedProjects = projects.filter(
    (project) =>
      archivedProjectIds.includes(project.id) &&
      matchesSearch(project.project_id, project.name, project.description),
  );

  if (loading)
    return (
      <main style={loadingStyle}>
        <p>Loading your Work-Integrated Learning workspace...</p>
      </main>
    );
  if (!profile)
    return (
      <main style={loadingStyle}>
        <p>Unable to load your workspace.</p>
      </main>
    );

  return (
    <main style={pageStyle}>
      <header className="app-header" style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>Work-Integrated Learning</h1>
          <p style={headerSubtitle}>Employee Workspace</p>
        </div>
        <div style={headerUser}>
          <Link href="/dashboard/notifications" className="notification-bell">
            <svg
              aria-label="Notifications"
              role="img"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "Profile"}
              className="header-avatar"
            />
          ) : (
            <span className="header-avatar-fallback">{profileInitials}</span>
          )}
        </div>
      </header>
      <div className="app-shell-body" style={layoutStyle}>
        <aside className="app-sidebar" style={sidebarStyle}>
          <p style={sidebarLabel}>Workspace</p>
          <nav className="app-nav" style={navStyle}>
            <Link href="/dashboard" style={navLinkStyle}>
              Overview
            </Link>
            <Link href="/dashboard/profile" style={navLinkStyle}>
              Profile
            </Link>
            <Link href="/dashboard/projects" style={navLinkStyle}>
              My Projects
            </Link>
            <Link href="/dashboard/archived-projects" style={navLinkStyle}>
              Archived Projects
            </Link>
            <Link href="/dashboard/leaderboard" style={navLinkStyle}>
              Leaderboard
            </Link>
            <Link href="/dashboard/poe" style={navLinkStyle}>
              POE
            </Link>
            <Link href="/dashboard/teams" style={navLinkStyle}>
              My Teams
            </Link>
            <Link href="/dashboard/find-team" style={navLinkStyle}>
              Find a Team
            </Link>
            <Link href="/dashboard/messages" style={navLinkStyle}>
              Messages
            </Link>
            <Link href="/dashboard/calendar" style={navLinkStyle}>
              Calendar
            </Link>
            <Link href="/dashboard/notifications" style={navLinkStyle}>
              Notifications
            </Link>
            <Link href="/dashboard/announcements" style={navLinkStyle}>
              Announcements
            </Link>
            <Link href="/dashboard/settings" style={navLinkStyle}>
              Settings
            </Link>
          </nav>
          <button onClick={handleSignOut} style={sidebarSignOutStyle}>
            Sign Out
          </button>
        </aside>
        <section className="app-content" style={contentStyle}>
          {activeSection !== "leaderboard" &&
            activeSection !== "poe" &&
            activeSection !== "profile" &&
            activeSection !== "overview" &&
            activeSection !== "teams" && (
            <div style={searchBarStyle}>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search teams, projects, announcements, or messages..."
                aria-label="Search workspace"
                style={searchInputStyle}
              />
            </div>
          )}
          {pageMessage && <div style={noticeStyle}>{pageMessage}</div>}
          <section id="overview" style={sectionVisibility(activeSection, "overview")}>
            <p style={eyebrowStyle}>Your Workspace</p>
            <h2 style={headingStyle}>
              Welcome, {profile.full_name || "Employee"}.
            </h2>
            <p style={subtitleStyle}>
              Keep track of your work, teams, conversations and company updates.
            </p>
            <div style={summaryGridStyle}>
              <SummaryCard title="My Projects" value={projects.length} />
              <SummaryCard title="My Teams" value={teams.length} />
              <SummaryCard
                title="Pending Requests"
                value={
                  joinRequests.filter((r) => r.status === "pending").length
                }
              />
              <SummaryCard title="Messages" value={conversations.length} />
              <SummaryCard title="Notifications" value={notifications.length} />
              <SummaryCard title="Announcements" value={announcements.length} />
            </div>
          </section>

          <section id="profile" style={sectionVisibility(activeSection, "profile")}>
            <SectionHeading
              title="My Profile"
              subtitle="Your employee account information."
            />
            <div style={profileGridStyle}>
              <InfoCard
                label="Full name"
                value={profile.full_name || "Not provided"}
              />
              <InfoCard label="Email" value={profile.email} />
              <InfoCard label="Role" value={profile.role} />
              <InfoCard
                label="Account created"
                value={formatDate(profile.created_at)}
              />
            </div>
          </section>

          <section id="projects" style={sectionVisibility(activeSection, "projects")}>
            <SectionHeading
              title="My Projects"
              subtitle="Projects assigned directly to you or to one of your teams."
            />
            <div style={projectFiltersStyle}>
              <select value={projectStatusFilter} onChange={(event) => setProjectStatusFilter(event.target.value)} style={filterInputStyle}>
                <option value="all">All statuses</option>
                <option value="incomplete">Incomplete</option>
                <option value="complete">Complete</option>
              </select>
              <select value={projectTeamFilter} onChange={(event) => setProjectTeamFilter(event.target.value)} style={filterInputStyle}>
                <option value="all">All teams</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <select value={projectDeadlineFilter} onChange={(event) => setProjectDeadlineFilter(event.target.value)} style={filterInputStyle}>
                <option value="all">All deadlines</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="no-deadline">No deadline</option>
              </select>
            </div>
            {projects.length === 0 ? (
              <EmptyMessage>
                You don&apos;t have any assigned projects yet.
              </EmptyMessage>
            ) : filteredProjects.length === 0 ? (
              <EmptyMessage>No projects match the selected filters.</EmptyMessage>
            ) : (
              <div style={listStyle}>
                {filteredProjects.map((project) => (
                  <article key={project.id} style={cardStyle}>
                    <div style={cardTopStyle}>
                      <div>
                        <p style={smallLabelStyle}>{project.project_id}</p>
                        <h4 style={cardTitleStyle}>{project.name}</h4>
                      </div>
                      <span style={statusStyle(project.status)}>
                        {project.status.replaceAll("_", " ").toUpperCase()}
                      </span>
                    </div>
                    {project.description && (
                      <p style={bodyTextStyle}>{project.description}</p>
                    )}
                    <div style={detailGridStyle}>
                      <InfoCard
                        label="Assignment"
                        value={
                          project.assignment_type === "team"
                            ? `Team: ${getTeamName(project.team_id || "")}`
                            : "Assigned directly to you"
                        }
                      />
                      <InfoCard
                        label="Deadline"
                        value={formatDate(project.deadline)}
                      />
                    </div>
                    {(project.project_link || project.project_zip_url) && (
                      <div style={actionsStyle}>
                        {project.project_link && (
                          <a
                            href={project.project_link}
                            target="_blank"
                            rel="noreferrer"
                            style={linkButtonStyle}
                          >
                            Open Project
                          </a>
                        )}
                        {project.project_zip_url && (
                          <a
                            href={project.project_zip_url}
                            target="_blank"
                            rel="noreferrer"
                            style={linkButtonStyle}
                          >
                            Project ZIP
                          </a>
                        )}
                      </div>
                    )}
                    {project.status === "complete" && (
                      <button
                        type="button"
                        onClick={() => archiveProject(project)}
                        style={secondaryButtonStyle}
                      >
                        Archive project
                      </button>
                    )}
                    <div style={employeeTaskSectionStyle}>
                      <h4 style={employeeTaskHeadingStyle}>Project checklist</h4>
                      {projectTasks.filter((task) => task.project_id === project.id)
                        .length === 0 ? (
                        <p style={metaTextStyle}>No tasks have been added yet.</p>
                      ) : (
                        <div style={employeeTaskListStyle}>
                          {projectTasks
                            .filter((task) => task.project_id === project.id)
                            .map((task) => (
                              <label key={task.id} style={employeeTaskRowStyle}>
                                <input
                                  type="checkbox"
                                  checked={task.is_complete}
                                  onChange={() => handleTaskCompletion(task)}
                                />
                                <span
                                  style={
                                    task.is_complete
                                      ? taskCompletedStyle
                                      : undefined
                                  }
                                >
                                  {task.title}
                                </span>
                              </label>
                            ))}
                        </div>
                      )}
                    </div>
                    <div style={submissionSectionStyle}>
                      <h4 style={employeeTaskHeadingStyle}>Submit project work</h4>
                      <input
                        type="file"
                        onChange={(event) =>
                          setSubmissionFiles((current) => ({
                            ...current,
                            [project.id]: event.target.files?.[0],
                          }))
                        }
                        style={submissionInputStyle}
                      />
                      <input
                        type="url"
                        value={submissionLinks[project.id] || ""}
                        onChange={(event) =>
                          setSubmissionLinks((current) => ({
                            ...current,
                            [project.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a project link (optional)"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => handleProjectSubmission(project.id)}
                        disabled={submittingProjectId === project.id}
                        style={{ ...buttonStyle, marginTop: "10px" }}
                      >
                        {submittingProjectId === project.id ? "Submitting..." : "Submit work"}
                      </button>
                      {projectSubmissions.filter((submission) => submission.project_id === project.id).map((submission) => (
                        <div key={submission.id} style={submissionRowStyle}>
                          {submission.file_url && <a href={submission.file_url} target="_blank" rel="noreferrer" style={linkButtonStyle}>{submission.file_name || "Download file"}</a>}
                          {submission.submission_link && <a href={submission.submission_link} target="_blank" rel="noreferrer" style={linkButtonStyle}>Open submitted link</a>}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="archived-projects" style={sectionVisibility(activeSection, "archived-projects")}>
            <SectionHeading
              title="Archived Projects"
              subtitle="Completed projects you have moved out of your active workspace."
            />
            {archivedProjects.length === 0 ? (
              <EmptyMessage>No archived projects found.</EmptyMessage>
            ) : (
              <div style={listStyle}>
                {archivedProjects.map((project) => (
                  <article key={project.id} style={cardStyle}>
                    <div style={cardTopStyle}>
                      <div>
                        <p style={smallLabelStyle}>{project.project_id}</p>
                        <h4 style={cardTitleStyle}>{project.name}</h4>
                      </div>
                      <span style={statusStyle(project.status)}>
                        {project.status.toUpperCase()}
                      </span>
                    </div>
                    {project.description && <p style={bodyTextStyle}>{project.description}</p>}
                    <p style={metaTextStyle}>
                      Deadline: {formatDate(project.deadline)}
                    </p>
                    <button
                      type="button"
                      onClick={() => restoreProject(project)}
                      style={secondaryButtonStyle}
                    >
                      Restore project
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="teams" style={sectionVisibility(activeSection, "teams")}>
            <SectionHeading
              title="My Teams"
              subtitle="Teams you're currently part of."
            />
            {teams.length === 0 ? (
              <EmptyMessage>
                You are not currently a member of any teams.
              </EmptyMessage>
            ) : (
              <div style={gridStyle}>
                {filteredTeams.map((team) => (
                  <article key={team.id} style={cardStyle}>
                    <h4 style={cardTitleStyle}>{team.name}</h4>
                    {team.description && (
                      <p style={bodyTextStyle}>{team.description}</p>
                    )}
                    <p style={metaTextStyle}>
                      Joined {formatDate(team.joined_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="find-team" style={sectionVisibility(activeSection, "find-team")}>
            <SectionHeading
              title="Find a Team"
              subtitle="Request to join a team you are not currently part of."
            />
            {availableTeams.length === 0 ? (
              <EmptyMessage>
                There are no other teams available to join right now.
              </EmptyMessage>
            ) : (
              <div style={gridStyle}>
                {availableTeams.map((team) => {
                  const request = getRequestForTeam(team.id);
                  return (
                    <article key={team.id} style={cardStyle}>
                      <h4 style={cardTitleStyle}>{team.name}</h4>
                      {team.description && (
                        <p style={bodyTextStyle}>{team.description}</p>
                      )}
                      {request ? (
                        <div style={{ marginTop: "16px" }}>
                          <span style={statusStyle(request.status)}>
                            {request.status.toUpperCase()}
                          </span>
                          <p style={metaTextStyle}>
                            Requested {formatDate(request.requested_at)}
                          </p>
                          {request.status === "approved" && (
                            <p style={successTextStyle}>
                              Your request was approved.
                            </p>
                          )}
                          {request.status === "pending" && (
                            <p style={metaTextStyle}>
                              Your request is waiting for manager approval.
                            </p>
                          )}
                          {request.status === "rejected" && (
                            <p style={metaTextStyle}>
                              This request was rejected. You may request again.
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestToJoin(team)}
                          disabled={requestingTeamId === team.id}
                          style={buttonStyle}
                        >
                          {requestingTeamId === team.id
                            ? "Sending..."
                            : "Request to Join"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section id="messages" style={sectionVisibility(activeSection, "messages")}>
            <SectionHeading
              title="Messages"
              subtitle="Communicate directly with your managers."
            />

            <div style={noticeStyle}>
              <form
                onSubmit={handleStartConversation}
                style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
              >
                <select
                  value={newConversationManager}
                  onChange={(event) =>
                    setNewConversationManager(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">Start a conversation with a manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name || manager.email}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={creatingConversation || !newConversationManager}
                  style={buttonStyle}
                >
                  {creatingConversation ? "Starting..." : "Start Conversation"}
                </button>
              </form>
            </div>

            {conversations.length === 0 ? (
              <EmptyMessage>
                You are not currently part of any conversations.
              </EmptyMessage>
            ) : (
              <div style={messageLayoutStyle}>
                <div style={conversationListStyle}>
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.id)}
                      style={
                        selectedConversationId === conversation.id
                          ? activeConversationStyle
                          : conversationButtonStyle
                      }
                    >
                      {conversation.type === "team"
                        ? `Team conversation${conversation.team_id ? ` · ${getTeamName(conversation.team_id)}` : ""}`
                        : "Direct conversation"}
                    </button>
                  ))}
                </div>

                <div style={conversationPanelStyle}>
                  {selectedConversationId ? (
                    <>
                      <div style={messageListStyle}>
                        {selectedMessages.length === 0 ? (
                          <EmptyMessage>No messages yet.</EmptyMessage>
                        ) : (
                          selectedMessages.filter((message) =>
                            filteredMessages.some((item) => item.id === message.id),
                          ).map((message) => (
                            <div key={message.id} style={messageBubbleStyle}>
                              <p style={messageSenderStyle}>
                                {senderNames[message.sender_id || ""] ||
                                  "Unknown sender"}
                              </p>
                              <p style={{ margin: 0 }}>
                                {getMessageText(message)}
                              </p>
                              {message.created_at && (
                                <p style={metaTextStyle}>
                                  {formatDate(String(message.created_at))}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <form
                        onSubmit={handleSendMessage}
                        style={messageFormStyle}
                      >
                        <input
                          value={messageText}
                          onChange={(event) =>
                            setMessageText(event.target.value)
                          }
                          placeholder="Write a message..."
                          style={inputStyle}
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !messageText.trim()}
                          style={buttonStyle}
                        >
                          {sendingMessage ? "Sending..." : "Send"}
                        </button>
                      </form>
                    </>
                  ) : (
                    <EmptyMessage>Select a conversation.</EmptyMessage>
                  )}
                </div>
              </div>
            )}
          </section>

          <section id="calendar" style={sectionVisibility(activeSection, "calendar")}>
            <SectionHeading
              title="Calendar"
              subtitle="Company events and dates available to your account."
            />
            {calendarEvents.length === 0 ? (
              <EmptyMessage>
                No calendar events have been posted yet.
              </EmptyMessage>
            ) : (
              <div style={listStyle}>
                {calendarEvents.map((event) => (
                  <article key={event.id} style={cardStyle}>
                    <h4 style={cardTitleStyle}>{getEventTitle(event)}</h4>
                    {event.description && (
                      <p style={bodyTextStyle}>{String(event.description)}</p>
                    )}
                    <div style={detailGridStyle}>
                      <InfoCard
                        label="Starts"
                        value={formatDate(getEventStart(event))}
                      />
                      <InfoCard
                        label="Ends"
                        value={formatDate(getEventEnd(event))}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="notifications" style={sectionVisibility(activeSection, "notifications")}>
            <SectionHeading
              title="Notifications"
              subtitle="Recent notifications associated with your employee account."
            />
            {notificationMessage && (
              <p style={successTextStyle}>{notificationMessage}</p>
            )}
            {notifications.length === 0 ? (
              <EmptyMessage>You have no notifications right now.</EmptyMessage>
            ) : (
              <div style={listStyle}>
                {notifications.map((notification) => {
                  const unread =
                    notification.is_read === false ||
                    notification.read === false;
                  return (
                    <article
                      key={notification.id}
                      style={{ ...cardStyle, opacity: unread ? 1 : 0.78 }}
                    >
                      <div style={cardTopStyle}>
                        <h4 style={cardTitleStyle}>
                          {notification.title || "Notification"}
                        </h4>
                        {unread && (
                          <span style={statusStyle("pending")}>NEW</span>
                        )}
                      </div>
                      <p style={bodyTextStyle}>
                        {getNotificationText(notification)}
                      </p>
                      {notification.created_at && (
                        <p style={metaTextStyle}>
                          {formatDate(notification.created_at)}
                        </p>
                      )}
                      {unread && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(notification)}
                          style={buttonStyle}
                        >
                          Mark as read
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section id="announcements" style={sectionVisibility(activeSection, "announcements")}>
            <SectionHeading
              title="Company Announcements"
              subtitle="Latest updates from the company."
            />
            {announcements.length === 0 ? (
              <EmptyMessage>
                No announcements have been posted yet.
              </EmptyMessage>
            ) : (
              <div style={listStyle}>
                {filteredAnnouncements.map((announcement) => (
                  <article key={announcement.id} style={cardStyle}>
                    <h4 style={cardTitleStyle}>{announcement.title}</h4>
                    <p style={bodyTextStyle}>{announcement.content}</p>
                    {announcement.file_url && (
                      <a
                        href={announcement.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...linkButtonStyle, display: "inline-block", marginTop: "8px" }}
                      >
                        Download {announcement.file_name || "attachment"}
                      </a>
                    )}
                    <p style={metaTextStyle}>
                      Posted {formatDate(announcement.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="leaderboard" style={sectionVisibility(activeSection, "leaderboard")}>
            <SectionHeading
              title="Leaderboard"
              subtitle="Earn one point for every completed project."
            />
            {leaderboard.length === 0 ? (
              <EmptyMessage>No employee scores are available yet.</EmptyMessage>
            ) : (
              <div style={leaderboardListStyle}>
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} style={leaderboardRowStyle}>
                    <strong style={leaderboardRankStyle}>#{index + 1}</strong>
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt={entry.full_name} style={leaderboardAvatarStyle} />
                    ) : (
                      <span style={leaderboardAvatarFallbackStyle}>
                        {entry.full_name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("")}
                      </span>
                    )}
                    <strong style={{ flex: 1 }}>{entry.full_name || "Unnamed employee"}</strong>
                    <span style={leaderboardScoreStyle}>{entry.completed_projects} completed - {entry.points} points</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="poe" style={sectionVisibility(activeSection, "poe")}>
            <SectionHeading
              title="Portfolio of Evidence"
              subtitle="Showcase your project experience and professional links."
            />
            <div style={poeReferenceStyle}>
              <p style={smallLabelStyle}>Reference</p>
              <strong>Chris Mocks</strong>
              <p style={metaTextStyle}>Available as an employment reference.</p>
            </div>
            <div style={listStyle}>
              {POE_DOCUMENT_TYPES.map((documentType) => {
                const template = poeTemplates[documentType];
                const submission = poeSubmissions[documentType];
                return (
                  <article key={documentType} style={cardStyle}>
                    <h4 style={cardTitleStyle}>{POE_DOCUMENT_LABELS[documentType]}</h4>
                    {template?.file_url ? (
                      <a
                        href={template.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={linkButtonStyle}
                      >
                        Download blank form
                      </a>
                    ) : (
                      <p style={metaTextStyle}>Blank form not uploaded yet.</p>
                    )}

                    {submission?.file_url && (
                      <p style={metaTextStyle}>
                        Your signed upload: {submission.file_name} —{" "}
                        <a href={submission.file_url} target="_blank" rel="noreferrer">
                          Download
                        </a>
                      </p>
                    )}

                    {submission?.signed_file_url ? (
                      <p style={successTextStyle}>
                        Countersigned by manager: {submission.signed_file_name} —{" "}
                        <a href={submission.signed_file_url} target="_blank" rel="noreferrer">
                          Download
                        </a>
                      </p>
                    ) : submission?.file_url ? (
                      <p style={metaTextStyle}>Waiting for the manager to sign and return this form.</p>
                    ) : null}

                    <div style={submissionSectionStyle}>
                      <h4 style={employeeTaskHeadingStyle}>Upload signed form</h4>
                      <input
                        type="file"
                        onChange={(event) =>
                          setPoeUploadFiles((current) => ({
                            ...current,
                            [documentType]: event.target.files?.[0],
                          }))
                        }
                        style={submissionInputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => handleUploadPoeSubmission(documentType)}
                        disabled={uploadingPoeDocument === documentType}
                        style={{ ...buttonStyle, marginTop: "10px" }}
                      >
                        {uploadingPoeDocument === documentType ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {poeMessage && <p style={successTextStyle}>{poeMessage}</p>}
            <div style={listStyle}>
              {projects.map((project) => (
                <article key={project.id} style={cardStyle}>
                  <p style={smallLabelStyle}>{project.project_id}</p>
                  <h4 style={cardTitleStyle}>{project.name}</h4>
                  {project.description && (
                    <p style={bodyTextStyle}>{project.description}</p>
                  )}
                </article>
              ))}
            </div>
            <form onSubmit={handleSavePoeLinks} style={poeFormStyle}>
              <h4 style={cardTitleStyle}>Professional links</h4>
              <label style={labelStyle}>GitHub link</label>
              <input
                type="url"
                value={poeLinks.github_url}
                onChange={(event) =>
                  setPoeLinks((current) => ({ ...current, github_url: event.target.value }))
                }
                placeholder="https://github.com/your-name"
                style={inputStyle}
              />
              <label style={labelStyle}>LinkedIn link</label>
              <input
                type="url"
                value={poeLinks.linkedin_url}
                onChange={(event) =>
                  setPoeLinks((current) => ({ ...current, linkedin_url: event.target.value }))
                }
                placeholder="https://www.linkedin.com/in/your-name"
                style={inputStyle}
              />
              <button type="submit" disabled={savingPoeLinks} style={buttonStyle}>
                {savingPoeLinks ? "Saving..." : "Save links"}
              </button>
              {poeMessage && <p style={successTextStyle}>{poeMessage}</p>}
            </form>
          </section>

          <section id="settings" style={sectionVisibility(activeSection, "settings")}>
            <SectionHeading
              title="Settings"
              subtitle="Manage your profile, profile picture, and password."
            />
            {settingsMessage && <p style={successTextStyle}>{settingsMessage}</p>}
            {settingsError && <p style={errorTextStyle}>{settingsError}</p>}
            <div style={settingsGridStyle}>
              <article style={cardStyle}>
                <h4 style={cardTitleStyle}>Profile picture</h4>
                <div style={avatarSettingsStyle}>
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Your profile"
                      style={avatarImageStyle}
                    />
                  ) : (
                    <span style={avatarFallbackStyle}>
                      {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <label style={buttonStyle}>
                    {uploadingAvatar ? "Uploading..." : "Choose picture"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      style={{ display: "none" }}
                    />
                  </label>
                  {profile.avatar_url && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={removingAvatar}
                      style={secondaryButtonStyle}
                    >
                      {removingAvatar ? "Removing..." : "Remove picture"}
                    </button>
                  )}
                </div>
                <p style={metaTextStyle}>Use an image smaller than 5 MB.</p>
              </article>

              <article style={cardStyle}>
                <h4 style={cardTitleStyle}>Account information</h4>
                <form onSubmit={handleProfileUpdate} style={settingsFormStyle}>
                  <label style={labelStyle}>Full name</label>
                  <input
                    value={settingsFullName}
                    onChange={(event) => setSettingsFullName(event.target.value)}
                    style={inputStyle}
                    required
                  />
                  <label style={labelStyle}>Email address</label>
                  <input
                    type="email"
                    value={settingsEmail}
                    onChange={(event) => setSettingsEmail(event.target.value)}
                    style={inputStyle}
                    required
                  />
                  <button type="submit" disabled={savingProfile} style={buttonStyle}>
                    {savingProfile ? "Saving..." : "Save information"}
                  </button>
                </form>
              </article>

              <article style={cardStyle}>
                <h4 style={cardTitleStyle}>Reset password</h4>
                <form onSubmit={handlePasswordUpdate} style={settingsFormStyle}>
                  <label style={labelStyle}>New password</label>
                  <input
                    type="password"
                    value={settingsPassword}
                    onChange={(event) => setSettingsPassword(event.target.value)}
                    style={inputStyle}
                    minLength={6}
                    required
                  />
                  <label style={labelStyle}>Confirm new password</label>
                  <input
                    type="password"
                    value={settingsPasswordConfirmation}
                    onChange={(event) =>
                      setSettingsPasswordConfirmation(event.target.value)
                    }
                    style={inputStyle}
                    minLength={6}
                    required
                  />
                  <button type="submit" disabled={savingPassword} style={buttonStyle}>
                    {savingPassword ? "Updating..." : "Update password"}
                  </button>
                </form>
              </article>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3 style={{ margin: 0, fontSize: "26px" }}>{title}</h3>
      <p style={subtitleStyle}>{subtitle}</p>
    </div>
  );
}
function sectionVisibility(
  activeSection: DashboardSection,
  section: DashboardSection,
) {
  return {
    ...sectionStyle,
    display: activeSection === section ? "block" : "none",
  };
}
function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div style={summaryCardStyle}>
      <p style={smallLabelStyle}>{title}</p>
      <strong style={{ fontSize: "30px" }}>{value}</strong>
    </div>
  );
}
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <p style={smallLabelStyle}>{label}</p>
      <p style={{ margin: "5px 0 0", fontWeight: 600 }}>{value}</p>
    </div>
  );
}
function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p style={emptyStyle}>{children}</p>;
}
function statusStyle(status: string) {
  const n = status.toLowerCase();
  let background = "#eee9e2",
    color = "#625d56";
  if (n === "completed" || n === "approved") {
    background = "#e3eee4";
    color = "#35613d";
  }
  if (n === "in_progress" || n === "pending") {
    background = "#eee8d8";
    color = "#765d24";
  }
  if (n === "rejected") {
    background = "#f2dfdf";
    color = "#8d3c3c";
  }
  return {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: "999px",
    background,
    color,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  };
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f1ea",
  color: "#222222",
};
const headerStyle = {
  minHeight: "72px",
  background: "#ffffff",
  borderBottom: "1px solid #e5dfd6",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px",
  padding: "14px 40px",
  boxSizing: "border-box" as const,
};
const headerSubtitle = {
  margin: "4px 0 0",
  color: "#8a8175",
  fontSize: "13px",
};
const headerUser = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
};
const layoutStyle = { display: "flex", minHeight: "calc(100vh - 72px)" };
const sidebarStyle = {
  width: "230px",
  background: "#222222",
  color: "#ffffff",
  padding: "32px 20px",
  boxSizing: "border-box" as const,
};
const sidebarLabel = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "1.5px",
  color: "#aaa39a",
  marginBottom: "24px",
};
const navStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};
const navLinkStyle = {
  display: "block",
  padding: "11px 13px",
  borderRadius: "9px",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "14px",
};
const sidebarSignOutStyle = {
  marginTop: "40px",
  width: "100%",
  padding: "11px",
  border: "1px solid #555555",
  borderRadius: "9px",
  background: "transparent",
  color: "#ffffff",
  cursor: "pointer",
};
const contentStyle = {
  flex: 1,
  padding: "42px",
  boxSizing: "border-box" as const,
  maxWidth: "1450px",
};
const sectionStyle = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "28px",
  border: "1px solid #e5dfd6",
  marginBottom: "24px",
};
const searchBarStyle = {
  marginBottom: "20px",
};
const searchInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px 16px",
  border: "1px solid #d8d0c5",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#222222",
  fontSize: "14px",
};
const leaderboardListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};
const leaderboardRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px",
  border: "1px solid #e5dfd6",
  borderRadius: "10px",
  background: "#ffffff",
};
const leaderboardRankStyle = { width: "34px", color: "#8a8175" };
const leaderboardAvatarStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  objectFit: "cover" as const,
};
const leaderboardAvatarFallbackStyle = {
  ...leaderboardAvatarStyle,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#222222",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 700,
};
const leaderboardScoreStyle = { color: "#625d56", fontSize: "13px" };
const poeReferenceStyle = {
  padding: "18px",
  marginBottom: "18px",
  border: "1px solid #e5dfd6",
  borderRadius: "10px",
  background: "#f8f5ef",
};
const poeFormStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  marginTop: "24px",
  padding: "20px",
  border: "1px solid #e5dfd6",
  borderRadius: "12px",
  background: "#ffffff",
};
const projectFiltersStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  margin: "14px 0 18px",
};
const filterInputStyle = {
  flex: "1 1 180px",
  minWidth: "160px",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  border: "1px solid #d8d0c5",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#222222",
  fontSize: "13px",
};
const eyebrowStyle = {
  margin: 0,
  color: "#8a8175",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "1.5px",
};
const headingStyle = { margin: "8px 0", fontSize: "36px" };
const subtitleStyle = {
  color: "#716b63",
  marginTop: "8px",
  marginBottom: "0",
  lineHeight: 1.6,
};
const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "14px",
  marginTop: "28px",
};
const summaryCardStyle = {
  background: "#f8f5ef",
  borderRadius: "14px",
  padding: "18px",
};
const profileGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};
const infoCardStyle = {
  background: "#f8f5ef",
  borderRadius: "10px",
  padding: "13px",
};
const smallLabelStyle = {
  margin: 0,
  color: "#8a8175",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.5px",
  textTransform: "uppercase" as const,
};
const listStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "12px",
};
const cardStyle = {
  padding: "21px",
  border: "1px solid #e5dfd6",
  borderRadius: "14px",
  background: "#ffffff",
};
const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
};
const cardTitleStyle = { margin: "6px 0 0", fontSize: "20px" };
const bodyTextStyle = {
  margin: "14px 0 0",
  color: "#4f4a44",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap" as const,
};
const metaTextStyle = {
  margin: "10px 0 0",
  color: "#8a8175",
  fontSize: "13px",
};
const detailGridStyle = {
  marginTop: "18px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
};
const actionsStyle = {
  marginTop: "18px",
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};
const linkButtonStyle = {
  color: "#4f5f70",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
};
const buttonStyle = {
  marginTop: "16px",
  padding: "11px 17px",
  border: "none",
  borderRadius: "10px",
  background: "#222222",
  color: "#ffffff",
  cursor: "pointer",
};
const secondaryButtonStyle = {
  marginTop: "16px",
  padding: "10px 16px",
  border: "1px solid #d8d0c5",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#222222",
  cursor: "pointer",
};
const successTextStyle = {
  marginTop: "10px",
  color: "#35613d",
  fontSize: "14px",
};
const errorTextStyle = {
  marginTop: "10px",
  color: "#a33a3a",
  fontSize: "14px",
};
const labelStyle = {
  display: "block",
  marginTop: "12px",
  marginBottom: "6px",
  color: "#4f4a44",
  fontSize: "13px",
  fontWeight: 600,
};
const settingsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "14px",
};
const settingsFormStyle = {
  display: "flex",
  flexDirection: "column" as const,
};
const avatarSettingsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginTop: "18px",
};
const avatarImageStyle = {
  width: "76px",
  height: "76px",
  borderRadius: "50%",
  objectFit: "cover" as const,
};
const avatarFallbackStyle = {
  width: "76px",
  height: "76px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#222222",
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 700,
};
const emptyStyle = {
  color: "#716b63",
  background: "#f8f5ef",
  borderRadius: "12px",
  padding: "18px",
  margin: 0,
};
const noticeStyle = {
  background: "#ffffff",
  border: "1px solid #e5dfd6",
  borderRadius: "12px",
  padding: "14px 18px",
  marginBottom: "20px",
  color: "#4f4a44",
};
const inputStyle = {
  flex: 1,
  minWidth: "0",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  border: "1px solid #d8d0c5",
  borderRadius: "10px",
  background: "#ffffff",
  fontSize: "14px",
};
const messageLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  gap: "14px",
};
const conversationListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};
const conversationButtonStyle = {
  padding: "12px",
  textAlign: "left" as const,
  border: "1px solid #e5dfd6",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#222222",
  cursor: "pointer",
};
const activeConversationStyle = {
  ...conversationButtonStyle,
  background: "#f1ede6",
  border: "1px solid #cfc5b8",
};
const conversationPanelStyle = {
  minWidth: 0,
  border: "1px solid #e5dfd6",
  borderRadius: "12px",
  padding: "16px",
};
const messageListStyle = {
  minHeight: "220px",
  maxHeight: "420px",
  overflowY: "auto" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "9px",
};
const messageBubbleStyle = {
  padding: "12px 14px",
  background: "#f8f5ef",
  borderRadius: "10px",
};
const employeeTaskSectionStyle = {
  marginTop: "20px",
  paddingTop: "16px",
  borderTop: "1px solid #e5dfd6",
};
const employeeTaskHeadingStyle = { margin: 0, fontSize: "16px" };
const employeeTaskListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  marginTop: "10px",
};
const employeeTaskRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  color: "#4f4a44",
};
const submissionSectionStyle = {
  marginTop: "20px",
  paddingTop: "16px",
  borderTop: "1px solid #e5dfd6",
};
const submissionInputStyle = { color: "#222222", fontSize: "13px" };
const submissionRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
  padding: "10px 12px",
  background: "#f8f5ef",
  borderRadius: "8px",
};
const taskCompletedStyle = {
  color: "#8a8175",
  textDecoration: "line-through",
};
const messageSenderStyle = {
  margin: "0 0 6px",
  color: "#625d56",
  fontSize: "12px",
  fontWeight: 700,
};
const messageFormStyle = { display: "flex", gap: "9px", marginTop: "14px" };
const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f1ea",
  color: "#222222",
};
