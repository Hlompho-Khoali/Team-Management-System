"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export type ManagerSection =
  | "overview"
  | "teams"
  | "employees"
  | "projects"
  | "leaderboard"
  | "announcements"
  | "join-requests"
  | "messages"
  | "calendar"
  | "notifications"
  | "settings";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
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
type LeaderboardEntry = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  completed_projects: number;
  points: number;
};

type Team = {
  id: string;
  name: string;
  leader_id?: string | null;
};

type Project = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  assignment_type: string;
  team_id: string | null;
  assigned_to: string | null;
  project_zip_url: string | null;
  project_link: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};
type ProjectComment = {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
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
  reviewed_at: string | null;
  teams: { id: string; name: string } | null;
  profiles: { id: string; full_name: string; email: string } | null;
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
  [key: string]: unknown;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  [key: string]: unknown;
};

type CalendarEvent = {
  id: string;
  [key: string]: unknown;
};

type Notification = {
  id: string;
  [key: string]: unknown;
};

type TeamMemberRow = {
  team_id: string;
  user_id: string;
};

export default function ManagerPage({
  activeSection = "overview",
}: {
  activeSection?: ManagerSection;
}) {
  const [manager, setManager] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
  const [selectedConversation, setSelectedConversation] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationEmployee, setConversationEmployee] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(false);

  const [calendarTitle, setCalendarTitle] = useState("");
  const [calendarDescription, setCalendarDescription] = useState("");
  const [calendarTeam, setCalendarTeam] = useState("");
  const [calendarStart, setCalendarStart] = useState("");
  const [calendarEnd, setCalendarEnd] = useState("");
  const [isCreateCalendarExpanded, setIsCreateCalendarExpanded] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [deletingCalendarEventId, setDeletingCalendarEventId] = useState<string | null>(null);
  const [calendarMessage, setCalendarMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const [teamName, setTeamName] = useState("");
  const [teamLeader, setTeamLeader] = useState("");
  const [isCreateTeamExpanded, setIsCreateTeamExpanded] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreateProjectExpanded, setIsCreateProjectExpanded] = useState(false);
  const [assignmentType, setAssignmentType] = useState("team");
  const [projectTeam, setProjectTeam] = useState("");
  const [projectEmployee, setProjectEmployee] = useState("");
  const [projectZipUrl, setProjectZipUrl] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [projectStatus, setProjectStatus] = useState("incomplete");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [projectTeamFilter, setProjectTeamFilter] = useState("all");
  const [projectEmployeeFilter, setProjectEmployeeFilter] = useState("all");
  const [projectDeadlineFilter, setProjectDeadlineFilter] = useState("all");

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [inspectedProject, setInspectedProject] = useState<Project | null>(null);
  const [projectComments, setProjectComments] = useState<ProjectComment[]>([]);
  const [projectCommentText, setProjectCommentText] = useState("");
  const [loadingProjectComments, setLoadingProjectComments] = useState(false);
  const [savingProjectComment, setSavingProjectComment] = useState(false);
  const [projectCommentMessage, setProjectCommentMessage] = useState("");
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectSubmissions, setProjectSubmissions] = useState<ProjectSubmission[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementFile, setAnnouncementFile] = useState<File | undefined>(undefined);
  const [isCreateAnnouncementExpanded, setIsCreateAnnouncementExpanded] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingAnnouncementTitle, setEditingAnnouncementTitle] = useState("");
  const [editingAnnouncementContent, setEditingAnnouncementContent] = useState("");
  const [savingAnnouncementEdit, setSavingAnnouncementEdit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );

  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<
    string | null
  >(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null,
  );

  const [teamMessage, setTeamMessage] = useState("");
  const [memberMessage, setMemberMessage] = useState("");
  const [projectMessage, setProjectMessage] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeEmployeeProfile, setActiveEmployeeProfile] = useState<Profile | null>(null);
  const [showEmployeeProfileModal, setShowEmployeeProfileModal] = useState(false);
  const closeProfileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeEvaluationEmployee, setActiveEvaluationEmployee] = useState<Profile | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const closeEvaluationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [poeTemplates, setPoeTemplates] = useState<
    Record<PoeDocumentType, PoeTemplate | undefined>
  >({} as Record<PoeDocumentType, PoeTemplate | undefined>);
  const [evaluationSubmissions, setEvaluationSubmissions] = useState<
    Record<PoeDocumentType, PoeSubmission | undefined>
  >({} as Record<PoeDocumentType, PoeSubmission | undefined>);
  const [evaluationMessage, setEvaluationMessage] = useState("");
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [signingDocumentFiles, setSigningDocumentFiles] = useState<
    Record<PoeDocumentType, File | undefined>
  >({} as Record<PoeDocumentType, File | undefined>);
  const [signingDocument, setSigningDocument] = useState<PoeDocumentType | null>(null);
  const [templateUploadFiles, setTemplateUploadFiles] = useState<
    Record<PoeDocumentType, File | undefined>
  >({} as Record<PoeDocumentType, File | undefined>);
  const [uploadingTemplate, setUploadingTemplate] = useState<PoeDocumentType | null>(null);

  useEffect(() => {
    loadManagerDashboard();
  }, []);

  useEffect(() => {
    return () => {
      if (closeProfileTimeoutRef.current) {
        clearTimeout(closeProfileTimeoutRef.current);
      }
      if (closeEvaluationTimeoutRef.current) {
        clearTimeout(closeEvaluationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeEmployeeProfile) {
      setShowEmployeeProfileModal(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setShowEmployeeProfileModal(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeEmployeeProfile]);

  useEffect(() => {
    if (!activeEmployeeProfile) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEmployeeProfile();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeEmployeeProfile]);

  useEffect(() => {
    if (!activeEvaluationEmployee) {
      setShowEvaluationModal(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setShowEvaluationModal(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeEvaluationEmployee]);

  useEffect(() => {
    if (!activeEvaluationEmployee) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEvaluation();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeEvaluationEmployee]);

  useEffect(() => {
    if (!inspectedProject) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setInspectedProject(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [inspectedProject]);

  async function loadManagerDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      console.error("Error loading manager profile:", profileError);
      setLoading(false);
      return;
    }

    if (profileData.role !== "manager") {
      window.location.href = "/dashboard";
      return;
    }

    setManager(profileData);
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
    } else {
      setLeaderboard((leaderboardData ?? []) as LeaderboardEntry[]);
    }

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id, name, leader_id")
      .order("name", { ascending: true });

    if (teamError) {
      console.error("Error loading teams:", teamError);
    } else {
      setTeams(teamData ?? []);
    }

    const { data: employeeData, error: employeeError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url")
      .eq("role", "employee")
      .order("full_name", { ascending: true });

    if (employeeError) {
      console.error("Error loading employees:", employeeError);
    } else {
      setEmployees(employeeData ?? []);
    }

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(
        `
            id,
            project_id,
            name,
            description,
            assignment_type,
            team_id,
            assigned_to,
            project_zip_url,
            project_link,
            status,
            deadline,
            created_at,
            updated_at,
            created_by
          `,
      )
      .order("created_at", { ascending: false });

    if (projectError) {
      console.error("Error loading projects:", projectError);
    } else {
      setProjects((projectData ?? []) as Project[]);
    }

    const { data: announcementData, error: announcementError } = await supabase
      .from("announcements")
      .select(
        `
          id,
          title,
          content,
          created_by,
          created_at,
          updated_at,
          file_url,
          file_name
        `,
      )
      .order("created_at", { ascending: false });

    if (announcementError) {
      console.error("Error loading announcements:", {
        message: announcementError.message,
        code: announcementError.code,
        details: announcementError.details,
        hint: announcementError.hint,
      });
    } else {
      setAnnouncements((announcementData ?? []) as Announcement[]);
    }

    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, user_id");

    if (memberError) {
      console.error("Error loading team members:", memberError);
    } else {
      setTeamMembers((memberData ?? []) as TeamMemberRow[]);
    }

    const { data: conversationMemberData, error: conversationMemberError } =
      await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

    if (conversationMemberError) {
      console.error("Error loading manager conversations:", {
        message: conversationMemberError.message,
        code: conversationMemberError.code,
        details: conversationMemberError.details,
        hint: conversationMemberError.hint,
      });
      setRequestMessage(
        conversationMemberError.message ||
          "Unable to load conversations. Check messaging RLS policies in Supabase.",
      );
    } else {
      const conversationIds = (conversationMemberData ?? [])
        .map((row) => row.conversation_id as string)
        .filter(Boolean);

      if (conversationIds.length > 0) {
        const { data: conversationData, error: conversationError } =
          await supabase
            .from("conversations")
            .select("*")
            .in("id", conversationIds)
            .order("created_at", { ascending: false });

        if (conversationError) {
          console.error("Error loading conversations:", {
            message: conversationError.message,
            code: conversationError.code,
            details: conversationError.details,
            hint: conversationError.hint,
          });
          setRequestMessage(
            conversationError.message ||
              "Unable to load conversations. Check messaging RLS policies in Supabase.",
          );
        } else {
          setConversations((conversationData ?? []) as Conversation[]);
          setSelectedConversation((current) => current || conversationIds[0]);
        }

        const { data: messageData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: true });

        if (messagesError) {
          console.error("Error loading messages:", {
            message: messagesError.message,
            code: messagesError.code,
            details: messagesError.details,
            hint: messagesError.hint,
          });
          setRequestMessage(
            messagesError.message ||
              "Unable to load messages. Check messaging RLS policies in Supabase.",
          );
        } else {
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
      }
    }

    const { data: eventData, error: eventError } = await supabase
      .from("calendar_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (eventError) {
      console.error("Error loading calendar events:", eventError);
    } else {
      setCalendarEvents((eventData ?? []) as CalendarEvent[]);
    }

    const notificationResult = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (notificationResult.error) {
      console.error(
        "Error loading manager notifications:",
        notificationResult.error,
      );
    } else {
      setNotifications((notificationResult.data ?? []) as Notification[]);
    }

    setLoading(false);
  }

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!teamName.trim()) {
      setTeamMessage("Please enter a team name.");
      return;
    }

    if (!teamLeader) {
      setTeamMessage("Please select a team leader.");
      return;
    }

    if (!manager) {
      return;
    }

    setCreatingTeam(true);
    setTeamMessage("");

    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: teamName.trim(),
        created_by: manager.id,
        leader_id: teamLeader,
      })
      .select("id, name, leader_id")
      .single();

    if (error) {
      console.error("Error creating team:", error);
      setTeamMessage(error.message);
      setCreatingTeam(false);
      return;
    }

    const { error: leaderMembershipError } = await supabase
      .from("team_members")
      .insert({ team_id: data.id, user_id: teamLeader });
    if (leaderMembershipError) {
      console.error("Error adding team leader to team:", leaderMembershipError);
      setTeamMessage(
        `Team was created, but the team leader could not be added: ${leaderMembershipError.message}`,
      );
      setCreatingTeam(false);
      return;
    }
    setTeamMembers((current) => [
      ...current,
      { team_id: data.id, user_id: teamLeader },
    ]);

    setTeams((currentTeams) => [...currentTeams, data]);

    try {
      const conversation = await ensureTeamConversation(data.id);
      if (conversation) {
        setConversations((current) =>
          current.some((item) => item.id === conversation.id)
            ? current
            : [conversation, ...current],
        );
      }
    } catch (conversationError) {
      console.error("Team created but team conversation could not be created:", {
        message: conversationError instanceof Error ? conversationError.message : undefined,
        code: (conversationError as { code?: string })?.code,
        details: (conversationError as { details?: string })?.details,
        hint: (conversationError as { hint?: string })?.hint,
      });
    }

    setTeamName("");
    setTeamLeader("");
    setTeamMessage(`Team "${data.name}" was created successfully.`);
    setIsCreateTeamExpanded(false);

    setCreatingTeam(false);
  }

  async function handleAddEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTeam || !selectedEmployee) {
      setMemberMessage("Please select both a team and an employee.");
      return;
    }

    setAddingEmployee(true);
    setMemberMessage("");

    const { data: existingMembership, error: checkError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", selectedTeam)
      .eq("user_id", selectedEmployee)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking team membership:", checkError);

      setMemberMessage(checkError.message);
      setAddingEmployee(false);
      return;
    }

    if (existingMembership) {
      setMemberMessage("This employee is already a member of that team.");

      setAddingEmployee(false);
      return;
    }

    const { error: insertError } = await supabase.from("team_members").insert({
      team_id: selectedTeam,
      user_id: selectedEmployee,
    });

    if (insertError) {
      console.error("Error adding employee to team:", insertError);

      setMemberMessage(insertError.message);
      setAddingEmployee(false);
      return;
    }
    setTeamMembers((current) => [
      ...current,
      { team_id: selectedTeam, user_id: selectedEmployee },
    ]);

    try {
      const conversation = await addUserToTeamConversation(
        selectedTeam,
        selectedEmployee,
      );
      if (conversation) {
        setConversations((current) =>
          current.some((item) => item.id === conversation.id)
            ? current
            : [conversation, ...current],
        );
      }
    } catch (conversationError) {
      console.error(
        "Employee added to team but could not be added to team conversation:",
        conversationError,
      );
    }

    const employee = employees.find((item) => item.id === selectedEmployee);

    const team = teams.find((item) => item.id === selectedTeam);

    setMemberMessage(
      `${employee?.full_name ?? "Employee"} was added to ${
        team?.name ?? "the team"
      }.`,
    );

    setSelectedEmployee("");
    setAddingEmployee(false);
  }

  function resetProjectForm() {
    setProjectId("");
    setProjectName("");
    setProjectDescription("");
    setAssignmentType("team");
    setProjectTeam("");
    setProjectEmployee("");
    setProjectZipUrl("");
    setProjectLink("");
    setProjectStatus("incomplete");
    setProjectDeadline("");
    setEditingProject(null);
    setIsCreateProjectExpanded(false);
  }

  function startEditingProject(project: Project) {
    setEditingProject(project);
    setIsCreateProjectExpanded(true);

    setProjectId(project.project_id);
    setProjectName(project.name);
    setProjectDescription(project.description ?? "");
    setAssignmentType(project.assignment_type);
    setProjectTeam(project.team_id ?? "");
    setProjectEmployee(project.assigned_to ?? "");
    setProjectZipUrl(project.project_zip_url ?? "");
    setProjectLink(project.project_link ?? "");
    setProjectStatus(project.status);

    if (project.deadline) {
      setProjectDeadline(new Date(project.deadline).toISOString().slice(0, 16));
    } else {
      setProjectDeadline("");
    }

    setProjectMessage("");
  }

  async function inspectProject(project: Project) {
    setInspectedProject(project);
    setProjectComments([]);
    setProjectCommentMessage("");
    setLoadingProjectComments(true);
    const { data: taskData } = await supabase
      .from("project_tasks")
      .select("id, project_id, title, is_complete, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });
    setProjectTasks((taskData ?? []) as ProjectTask[]);
    const { data: submissionData } = await supabase
      .from("project_submissions")
      .select("id, project_id, employee_id, file_url, file_name, submission_link, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });
    setProjectSubmissions((submissionData ?? []) as ProjectSubmission[]);
    const { data, error } = await supabase
      .from("project_comments")
      .select(
        "id, project_id, user_id, content, created_at, profiles(full_name, email)",
      )
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });
    if (error) {
      setProjectCommentMessage(error.message);
    } else {
      setProjectComments((data ?? []) as unknown as ProjectComment[]);
    }
    setLoadingProjectComments(false);
  }

  async function handleAddProjectTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manager || !inspectedProject || !newTaskTitle.trim()) return;
    setSavingTask(true);
    setTaskMessage("");
    const { data, error } = await supabase
      .from("project_tasks")
      .insert({ project_id: inspectedProject.id, title: newTaskTitle.trim() })
      .select("id, project_id, title, is_complete, created_at")
      .single();
    if (error || !data) setTaskMessage(error?.message || "Unable to add task.");
    else {
      setProjectTasks((current) => [...current, data as ProjectTask]);
      setNewTaskTitle("");
      setTaskMessage("Task added.");
    }
    setSavingTask(false);
  }

  async function handleTaskCompletion(task: ProjectTask) {
    const { data, error } = await supabase
      .from("project_tasks")
      .update({ is_complete: !task.is_complete })
      .eq("id", task.id)
      .select("id, project_id, title, is_complete, created_at")
      .single();
    if (error || !data) {
      setTaskMessage(error?.message || "Unable to update task.");
      return;
    }
    setProjectTasks((current) =>
      current.map((item) => (item.id === task.id ? (data as ProjectTask) : item)),
    );
  }

  async function handleProjectStatusChange(status: "complete" | "incomplete") {
    if (!inspectedProject) return;
    const { data, error } = await supabase
      .from("projects")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", inspectedProject.id)
      .select("*")
      .single();
    if (error || !data) {
      setTaskMessage(error?.message || "Unable to update project status.");
      return;
    }
    const updatedProject = data as Project;
    setInspectedProject(updatedProject);
    setProjects((current) =>
      current.map((project) =>
        project.id === updatedProject.id ? updatedProject : project,
      ),
    );
  }

  async function handleAddProjectComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manager || !inspectedProject || !projectCommentText.trim()) return;
    setSavingProjectComment(true);
    setProjectCommentMessage("");
    const { data, error } = await supabase
      .from("project_comments")
      .insert({
        project_id: inspectedProject.id,
        user_id: manager.id,
        content: projectCommentText.trim(),
        comment: projectCommentText.trim(),
      })
      .select(
        "id, project_id, user_id, content, created_at, profiles(full_name, email)",
      )
      .single();
    if (error || !data) {
      setProjectCommentMessage(error?.message || "Unable to add comment.");
    } else {
      setProjectComments((current) => [
        ...current,
        data as unknown as ProjectComment,
      ]);
      setProjectCommentText("");
      setProjectCommentMessage("Comment added.");
    }
    setSavingProjectComment(false);
  }

  async function handleSaveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!manager) {
      return;
    }

    if (!projectId.trim()) {
      setProjectMessage("Please enter a project ID.");
      return;
    }

    if (!projectName.trim()) {
      setProjectMessage("Please enter a project name.");
      return;
    }

    if (assignmentType === "team" && !projectTeam) {
      setProjectMessage("Please select a team for this project.");
      return;
    }

    if (assignmentType === "employee" && !projectEmployee) {
      setProjectMessage("Please select an employee for this project.");
      return;
    }

    setSavingProject(true);
    setProjectMessage("");

    const projectData = {
      project_id: projectId.trim(),
      name: projectName.trim(),
      description: projectDescription.trim() || null,
      assignment_type: assignmentType,
      team_id: assignmentType === "team" ? projectTeam : null,
      assigned_to: assignmentType === "employee" ? projectEmployee : null,
      project_zip_url: projectZipUrl.trim() || null,
      project_link: projectLink.trim() || null,
      status: projectStatus,
      deadline: projectDeadline
        ? new Date(projectDeadline).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    };

    if (editingProject) {
      const { data, error } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", editingProject.id)
        .select(
          `
            id,
            project_id,
            name,
            description,
            assignment_type,
            team_id,
            assigned_to,
            project_zip_url,
            project_link,
            status,
            deadline,
            created_at,
            updated_at,
            created_by
          `,
        )
        .single();

      if (error) {
        console.error("Error updating project:", error);

        setProjectMessage(error.message);
        setSavingProject(false);
        return;
      }

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === editingProject.id ? (data as Project) : project,
        ),
      );

      setProjectMessage("Project updated successfully.");
    } else {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          ...projectData,
          created_by: manager.id,
        })
        .select(
          `
            id,
            project_id,
            name,
            description,
            assignment_type,
            team_id,
            assigned_to,
            project_zip_url,
            project_link,
            status,
            deadline,
            created_at,
            updated_at,
            created_by
          `,
        )
        .single();

      if (error) {
        console.error("Error creating project:", error);

        setProjectMessage(error.message);
        setSavingProject(false);
        return;
      }

      setProjects((currentProjects) => [data as Project, ...currentProjects]);

      const projectRecipientIds =
        assignmentType === "employee"
          ? [projectEmployee]
          : teamMembers
              .filter((member) => member.team_id === projectTeam)
              .map((member) => member.user_id);
      await notifyUsers(
        projectRecipientIds,
        "New project assigned",
        `${projectName.trim()} has been assigned to you or your team.`,
        "project",
      );

      setProjectMessage("Project created successfully.");
    }

    resetProjectForm();
    setSavingProject(false);
  }

  async function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingProjectId(project.id);
    setProjectMessage("");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      console.error("Error deleting project:", error);

      setProjectMessage(error.message);
      setDeletingProjectId(null);
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.filter((item) => item.id !== project.id),
    );

    if (editingProject?.id === project.id) {
      resetProjectForm();
    }

    setProjectMessage("Project deleted successfully.");

    setDeletingProjectId(null);
  }

  async function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!manager) {
      return;
    }

    if (!announcementTitle.trim()) {
      setAnnouncementMessage("Please enter an announcement title.");
      return;
    }

    if (!announcementContent.trim()) {
      setAnnouncementMessage("Please enter the announcement content.");
      return;
    }

    setSavingAnnouncement(true);
    setAnnouncementMessage("");

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    if (announcementFile) {
      const filePath = `${manager.id}/${Date.now()}-${announcementFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("announcement-documents")
        .upload(filePath, announcementFile, {
          upsert: false,
          contentType: announcementFile.type,
        });
      if (uploadError) {
        console.error("Error uploading announcement document:", uploadError);
        setAnnouncementMessage(uploadError.message);
        setSavingAnnouncement(false);
        return;
      }
      fileUrl = supabase.storage.from("announcement-documents").getPublicUrl(filePath).data.publicUrl;
      fileName = announcementFile.name;
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        created_by: manager.id,
        file_url: fileUrl,
        file_name: fileName,
      })
      .select(
        `
          id,
          title,
          content,
          created_by,
          created_at,
          updated_at,
          file_url,
          file_name
        `,
      )
      .single();

    if (error) {
      console.error("Error creating announcement:", error);

      setAnnouncementMessage(error.message);
      setSavingAnnouncement(false);
      return;
    }

    setAnnouncements((currentAnnouncements) => [
      data as Announcement,
      ...currentAnnouncements,
    ]);
    await notifyUsers(
      employees.map((employee) => employee.id),
      "New company announcement",
      announcementTitle.trim(),
      "announcement",
    );

    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementFile(undefined);
    setIsCreateAnnouncementExpanded(false);

    setAnnouncementMessage("Announcement posted successfully.");

    setSavingAnnouncement(false);
  }

  async function handleJoinRequestDecision(
    request: JoinRequest,
    decision: "approved" | "rejected",
  ) {
    if (request.status !== "pending") {
      return;
    }

    setProcessingRequestId(request.id);
    setRequestMessage("");

    if (decision === "approved") {
      const { data: existingMembership, error: membershipCheckError } =
        await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", request.team_id)
          .eq("user_id", request.user_id)
          .maybeSingle();

      if (membershipCheckError) {
        console.error("Error checking team membership:", membershipCheckError);
        setRequestMessage(membershipCheckError.message);
        setProcessingRequestId(null);
        return;
      }

      if (!existingMembership) {
        const { error: membershipError } = await supabase
          .from("team_members")
          .insert({
            team_id: request.team_id,
            user_id: request.user_id,
          });

        if (membershipError) {
          console.error(
            "Error adding approved employee to team:",
            membershipError,
          );
          setRequestMessage(membershipError.message);
          setProcessingRequestId(null);
          return;
        }
      }

      try {
        const conversation = await addUserToTeamConversation(
          request.team_id,
          request.user_id,
        );
        if (conversation) {
          setConversations((current) =>
            current.some((item) => item.id === conversation.id)
              ? current
              : [conversation, ...current],
          );
        }
      } catch (conversationError) {
        console.error(
          "Employee approved but could not be added to team conversation:",
          conversationError,
        );
      }
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from("join_requests")
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .select(
        `
            id,
            team_id,
            user_id,
            status,
            requested_at,
            reviewed_at,
            teams (
              id,
              name
            ),
            profiles (
              id,
              full_name,
              email
            )
          `,
      )
      .single();

    if (updateError) {
      console.error("Error updating join request:", updateError);
      setRequestMessage(updateError.message);
      setProcessingRequestId(null);
      return;
    }

    setJoinRequests((currentRequests) =>
      currentRequests.map((item) =>
        item.id === request.id
          ? (updatedRequest as unknown as JoinRequest)
          : item,
      ),
    );

    const notificationTitle =
      decision === "approved"
        ? "Team request approved"
        : "Team request rejected";
    const notificationText =
      decision === "approved"
        ? `Your request to join ${request.teams?.name ?? "the team"} was approved.`
        : `Your request to join ${request.teams?.name ?? "the team"} was rejected.`;

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: request.user_id,
        title: notificationTitle,
        message: notificationText,
        type: "join_request",
        is_read: false,
      });

    if (notificationError) {
      console.error(
        "Unable to create employee notification:",
        notificationError,
      );
    }

    const employeeName =
      request.profiles?.full_name || request.profiles?.email || "Employee";

    const teamName = request.teams?.name || "the team";

    setRequestMessage(
      decision === "approved"
        ? `${employeeName} was approved and added to ${teamName}.`
        : `${employeeName}'s request to join ${teamName} was rejected.`,
    );

    setProcessingRequestId(null);
  }

  function startEditingAnnouncement(announcement: Announcement) {
    setEditingAnnouncementId(announcement.id);
    setEditingAnnouncementTitle(announcement.title);
    setEditingAnnouncementContent(announcement.content);
    setAnnouncementMessage("");
  }

  function cancelEditingAnnouncement() {
    setEditingAnnouncementId(null);
    setEditingAnnouncementTitle("");
    setEditingAnnouncementContent("");
  }

  async function handleUpdateAnnouncement(
    event: FormEvent<HTMLFormElement>,
    announcement: Announcement,
  ) {
    event.preventDefault();

    if (!editingAnnouncementTitle.trim()) {
      setAnnouncementMessage("Please enter an announcement title.");
      return;
    }

    if (!editingAnnouncementContent.trim()) {
      setAnnouncementMessage("Please enter the announcement content.");
      return;
    }

    setSavingAnnouncementEdit(true);
    setAnnouncementMessage("");

    const { data, error } = await supabase
      .from("announcements")
      .update({
        title: editingAnnouncementTitle.trim(),
        content: editingAnnouncementContent.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", announcement.id)
      .select("id, title, content, created_by, created_at, updated_at")
      .single();

    if (error || !data) {
      console.error("Error updating announcement:", error);
      setAnnouncementMessage(error?.message || "Unable to update announcement.");
      setSavingAnnouncementEdit(false);
      return;
    }

    setAnnouncements((current) =>
      current.map((item) =>
        item.id === announcement.id ? (data as Announcement) : item,
      ),
    );
    cancelEditingAnnouncement();
    setAnnouncementMessage("Announcement updated successfully.");
    setSavingAnnouncementEdit(false);
  }

  async function handleDeleteAnnouncement(announcement: Announcement) {
    const confirmed = window.confirm(`Delete "${announcement.title}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingAnnouncementId(announcement.id);
    setAnnouncementMessage("");

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);

    if (error) {
      console.error("Error deleting announcement:", error);

      setAnnouncementMessage(error.message);
      setDeletingAnnouncementId(null);
      return;
    }

    setAnnouncements((currentAnnouncements) =>
      currentAnnouncements.filter((item) => item.id !== announcement.id),
    );

    setAnnouncementMessage("Announcement deleted successfully.");

    setDeletingAnnouncementId(null);
  }

  async function sendManagerMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!manager || !selectedConversation || !newMessage.trim()) {
      return;
    }

    setSendingMessage(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation,
        sender_id: manager.id,
        content: newMessage.trim(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error sending manager message:", error);
      setRequestMessage(error.message);
    } else {
      setMessages((current) => [...current, data as Message]);
      const recipientId = await getOtherConversationMember(
        selectedConversation,
        manager.id,
      );
      if (recipientId) {
        await notifyUsers(
          [recipientId],
          "New message",
          `${manager.full_name || manager.email} sent you a message.`,
          "message",
        );
      }
      setNewMessage("");
    }

    setSendingMessage(false);
  }

  async function ensureTeamConversation(teamId: string) {
    if (!manager) return null;

    const { data: existingMemberships, error: membershipLookupError } =
      await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", manager.id);

    if (membershipLookupError) {
      throw membershipLookupError;
    }

    const managerConversationIds = (existingMemberships ?? [])
      .map((row) => String(row.conversation_id))
      .filter(Boolean);

    if (managerConversationIds.length > 0) {
      const { data: existingTeamConversation, error: conversationLookupError } =
        await supabase
          .from("conversations")
          .select("id, type, team_id, created_by, created_at")
          .eq("type", "team")
          .eq("team_id", teamId)
          .in("id", managerConversationIds)
          .maybeSingle();

      if (conversationLookupError) {
        throw conversationLookupError;
      }

      if (existingTeamConversation) {
        return existingTeamConversation as Conversation;
      }
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        type: "team",
        team_id: teamId,
        created_by: manager.id,
      })
      .select("id, type, team_id, created_by, created_at")
      .single();

    if (conversationError || !conversation) {
      throw (
        conversationError ?? new Error("Unable to create team conversation.")
      );
    }

    const { error: memberError } = await supabase
      .from("conversation_members")
      .insert({ conversation_id: conversation.id, user_id: manager.id });

    if (memberError) {
      await supabase.from("conversations").delete().eq("id", conversation.id);
      throw memberError;
    }

    return conversation as Conversation;
  }

  async function addUserToTeamConversation(teamId: string, userId: string) {
    const conversation = await ensureTeamConversation(teamId);
    if (!conversation) return null;

    const { data: existingMembership, error: membershipCheckError } =
      await supabase
        .from("conversation_members")
        .select("id")
        .eq("conversation_id", conversation.id)
        .eq("user_id", userId)
        .maybeSingle();

    if (membershipCheckError) throw membershipCheckError;

    if (!existingMembership) {
      const { error: insertError } = await supabase
        .from("conversation_members")
        .insert({ conversation_id: conversation.id, user_id: userId });

      if (insertError) throw insertError;
    }

    return conversation;
  }

  async function handleCreateConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manager) return;

    if (!conversationEmployee) {
      setRequestMessage(
        "Please select an employee for the private conversation.",
      );
      return;
    }

    setCreatingConversation(true);
    setRequestMessage("");

    const { data: managerMemberships, error: membershipError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", manager.id);

    if (membershipError) {
      setRequestMessage(membershipError.message);
      setCreatingConversation(false);
      return;
    }

    const conversationIds = (managerMemberships ?? [])
      .map((row) => String(row.conversation_id))
      .filter(Boolean);

    let existingDirect: Conversation | null = null;

    if (conversationIds.length > 0) {
      const { data: directConversations, error: directLookupError } =
        await supabase
          .from("conversations")
          .select("id, type, team_id, created_by, created_at")
          .eq("type", "direct")
          .in("id", conversationIds);

      if (directLookupError) {
        setRequestMessage(directLookupError.message);
        setCreatingConversation(false);
        return;
      }

      for (const conversation of directConversations ?? []) {
        const { data: employeeMembership, error: employeeMembershipError } =
          await supabase
            .from("conversation_members")
            .select("id")
            .eq("conversation_id", conversation.id)
            .eq("user_id", conversationEmployee)
            .maybeSingle();

        if (employeeMembershipError) {
          setRequestMessage(employeeMembershipError.message);
          setCreatingConversation(false);
          return;
        }

        if (employeeMembership) {
          existingDirect = conversation as Conversation;
          break;
        }
      }
    }

    if (existingDirect) {
      setConversations((current) =>
        current.some((item) => item.id === existingDirect!.id)
          ? current
          : [existingDirect!, ...current],
      );
      setSelectedConversation(existingDirect.id);
      setConversationEmployee("");
      setRequestMessage("Private conversation opened.");
      setCreatingConversation(false);
      return;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        type: "direct",
        team_id: null,
        created_by: manager.id,
      })
      .select("id, type, team_id, created_by, created_at")
      .single();

    if (conversationError || !conversation) {
      setRequestMessage(
        conversationError?.message ?? "Unable to create private conversation.",
      );
      setCreatingConversation(false);
      return;
    }

    const { error: memberInsertError } = await supabase
      .from("conversation_members")
      .insert([
        { conversation_id: conversation.id, user_id: manager.id },
        { conversation_id: conversation.id, user_id: conversationEmployee },
      ]);

    if (memberInsertError) {
      await supabase.from("conversations").delete().eq("id", conversation.id);
      setRequestMessage(memberInsertError.message);
      setCreatingConversation(false);
      return;
    }

    setConversations((current) => [conversation as Conversation, ...current]);
    setSelectedConversation(conversation.id);
    setConversationEmployee("");
    setRequestMessage("Private conversation created successfully.");
    setCreatingConversation(false);
  }

  async function handleCreateCalendarEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manager) return;

    if (!calendarTitle.trim() || !calendarStart || !calendarEnd) {
      setCalendarMessage("Please enter a title, start time and end time.");
      return;
    }

    if (new Date(calendarEnd) <= new Date(calendarStart)) {
      setCalendarMessage("The end time must be after the start time.");
      return;
    }

    setSavingCalendar(true);
    setCalendarMessage("");

    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        title: calendarTitle.trim(),
        description: calendarDescription.trim() || null,
        created_by: manager.id,
        team_id: calendarTeam || null,
        start_at: new Date(calendarStart).toISOString(),
        end_at: new Date(calendarEnd).toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating calendar event:", error);
      setCalendarMessage(error.message);
      setSavingCalendar(false);
      return;
    }

    setCalendarEvents((current) => [data as CalendarEvent, ...current]);
    const calendarRecipientIds = calendarTeam
      ? teamMembers
          .filter((member) => member.team_id === calendarTeam)
          .map((member) => member.user_id)
      : employees.map((employee) => employee.id);
    await notifyUsers(
      calendarRecipientIds,
      "New calendar event",
      calendarTitle.trim(),
      "calendar",
    );
    setCalendarTitle("");
    setCalendarDescription("");
    setCalendarTeam("");
    setCalendarStart("");
    setCalendarEnd("");
    setIsCreateCalendarExpanded(false);
    setCalendarMessage("Calendar event created successfully.");
    setSavingCalendar(false);
  }

  async function handleDeleteCalendarEvent(eventId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this calendar event?",
    );
    if (!confirmed) return;

    setDeletingCalendarEventId(eventId);
    setCalendarMessage("");

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error("Error deleting calendar event:", error);
      setCalendarMessage(error.message);
      setDeletingCalendarEventId(null);
      return;
    }

    setCalendarEvents((current) => current.filter((item) => item.id !== eventId));
    setCalendarMessage("Calendar event deleted.");
    setDeletingCalendarEventId(null);
  }

  async function markManagerNotificationRead(notification: Notification) {
    if (!manager || notification.is_read === true) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id)
      .eq("user_id", manager.id);

    if (error) {
      console.error("Error marking notification read:", error);
      setNotificationMessage(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, is_read: true } : item,
      ),
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function notifyUsers(
    userIds: string[],
    title: string,
    message: string,
    type: string,
  ) {
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
    if (!uniqueUserIds.length) return;
    const { error } = await supabase.from("notifications").insert(
      uniqueUserIds.map((userId) => ({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
      })),
    );
    if (error) console.error("Error creating notifications:", error);
  }

  async function getOtherConversationMember(
    conversationId: string,
    currentUserId: string,
  ) {
    const { data } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", currentUserId)
      .limit(1)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manager) return;
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
    if (nextEmail !== manager.email.toLowerCase()) {
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
      .eq("id", manager.id)
      .select("id, full_name, email, role, avatar_url")
      .single();
    if (error || !data) {
      setSettingsError(error?.message || "Unable to update your profile.");
    } else {
      setManager(data as Profile);
      setSettingsMessage(
        nextEmail !== manager.email.toLowerCase()
          ? "Profile updated. Check your new email address to confirm the change."
          : "Profile updated successfully.",
      );
    }
    setSavingProfile(false);
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !manager) return;
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
    const filePath = `${manager.id}/avatar-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: false, contentType: file.type });
    if (uploadError) {
      setSettingsError(`${uploadError.message} Check the avatars bucket and upload policy.`);
      setUploadingAvatar(false);
      return;
    }
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq("id", manager.id)
      .select("id, full_name, email, role, avatar_url")
      .single();
    if (error || !data) {
      setSettingsError(error?.message || "Unable to save your profile picture.");
    } else {
      setManager(data as Profile);
      setSettingsMessage("Profile picture updated successfully.");
    }
    setUploadingAvatar(false);
  }

  async function handleRemoveAvatar() {
    if (!manager?.avatar_url) return;
    setRemovingAvatar(true);
    setSettingsMessage("");
    setSettingsError("");
    const avatarMarker = "/avatars/";
    const avatarPath = manager.avatar_url.includes(avatarMarker)
      ? manager.avatar_url.split(avatarMarker)[1].split("?")[0]
      : "";
    if (avatarPath) {
      await supabase.storage.from("avatars").remove([avatarPath]);
    }
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", manager.id)
      .select("id, full_name, email, role, avatar_url")
      .single();
    if (error || !data) {
      setSettingsError(error?.message || "Unable to remove your profile picture.");
    } else {
      setManager(data as Profile);
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
    const { error } = await supabase.auth.updateUser({ password: settingsPassword });
    if (error) setSettingsError(error.message);
    else {
      setSettingsPassword("");
      setSettingsPasswordConfirmation("");
      setSettingsMessage("Password updated successfully.");
    }
    setSavingPassword(false);
  }

  function getTeamName(teamId: string | null) {
    if (!teamId) {
      return "—";
    }

    return teams.find((team) => team.id === teamId)?.name ?? "Unknown team";
  }

  function getEmployeeName(employeeId: string | null) {
    if (!employeeId) {
      return "—";
    }

    const employee = employees.find((item) => item.id === employeeId);

    return employee?.full_name || employee?.email || "Unknown employee";
  }

  function getEmployeeInitials(employee: Profile) {
    return (employee.full_name || employee.email || "E")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function getTeamMembers(teamId: string) {
    return teamMembers
      .filter((member) => member.team_id === teamId)
      .map((member) => getEmployeeName(member.user_id));
  }

  function openEmployeeProfile(employee: Profile) {
    if (closeProfileTimeoutRef.current) {
      clearTimeout(closeProfileTimeoutRef.current);
      closeProfileTimeoutRef.current = null;
    }
    setActiveEmployeeProfile(employee);
  }

  function closeEmployeeProfile() {
    setShowEmployeeProfileModal(false);
    if (closeProfileTimeoutRef.current) {
      clearTimeout(closeProfileTimeoutRef.current);
    }
    closeProfileTimeoutRef.current = setTimeout(() => {
      setActiveEmployeeProfile(null);
      closeProfileTimeoutRef.current = null;
    }, 180);
  }

  async function openEvaluation(employee: Profile) {
    if (closeEvaluationTimeoutRef.current) {
      clearTimeout(closeEvaluationTimeoutRef.current);
      closeEvaluationTimeoutRef.current = null;
    }
    setEvaluationMessage("");
    setActiveEvaluationEmployee(employee);
    setLoadingEvaluation(true);

    const [{ data: templateData, error: templateError }, { data: submissionData, error: submissionError }] =
      await Promise.all([
        supabase.from("poe_document_templates").select("document_type, file_url, file_name"),
        supabase
          .from("poe_submissions")
          .select(
            "id, employee_id, document_type, file_url, file_name, submitted_at, signed_file_url, signed_file_name, signed_at, status",
          )
          .eq("employee_id", employee.id),
      ]);

    if (templateError) {
      console.error("Error loading POE templates:", templateError);
    } else if (templateData) {
      const templateMap = {} as Record<PoeDocumentType, PoeTemplate | undefined>;
      for (const template of templateData as PoeTemplate[]) {
        templateMap[template.document_type] = template;
      }
      setPoeTemplates(templateMap);
    }

    if (submissionError) {
      console.error("Error loading POE submissions:", submissionError);
      setEvaluationMessage(submissionError.message);
    } else if (submissionData) {
      const submissionMap = {} as Record<PoeDocumentType, PoeSubmission | undefined>;
      for (const submission of submissionData as PoeSubmission[]) {
        submissionMap[submission.document_type] = submission;
      }
      setEvaluationSubmissions(submissionMap);
    }

    setLoadingEvaluation(false);
  }

  function closeEvaluation() {
    setShowEvaluationModal(false);
    if (closeEvaluationTimeoutRef.current) {
      clearTimeout(closeEvaluationTimeoutRef.current);
    }
    closeEvaluationTimeoutRef.current = setTimeout(() => {
      setActiveEvaluationEmployee(null);
      setEvaluationSubmissions({} as Record<PoeDocumentType, PoeSubmission | undefined>);
      closeEvaluationTimeoutRef.current = null;
    }, 180);
  }

  async function handleSignPoeDocument(documentType: PoeDocumentType) {
    if (!activeEvaluationEmployee) return;
    const file = signingDocumentFiles[documentType];
    if (!file) {
      setEvaluationMessage("Please choose the countersigned file to upload.");
      return;
    }
    setSigningDocument(documentType);
    setEvaluationMessage("");

    const filePath = `${activeEvaluationEmployee.id}/${documentType}/signed-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("poe-submissions")
      .upload(filePath, file, { upsert: false, contentType: file.type });
    if (uploadError) {
      setEvaluationMessage(uploadError.message);
      setSigningDocument(null);
      return;
    }
    const signedFileUrl = supabase.storage.from("poe-submissions").getPublicUrl(filePath).data.publicUrl;

    const { data, error } = await supabase
      .from("poe_submissions")
      .upsert(
        {
          employee_id: activeEvaluationEmployee.id,
          document_type: documentType,
          signed_file_url: signedFileUrl,
          signed_file_name: file.name,
          signed_at: new Date().toISOString(),
          status: "signed",
        },
        { onConflict: "employee_id,document_type" },
      )
      .select(
        "id, employee_id, document_type, file_url, file_name, submitted_at, signed_file_url, signed_file_name, signed_at, status",
      )
      .single();

    if (error || !data) {
      setEvaluationMessage(error?.message || "Unable to upload the countersigned form.");
      setSigningDocument(null);
      return;
    }

    setEvaluationSubmissions((current) => ({ ...current, [documentType]: data as PoeSubmission }));
    setSigningDocumentFiles((current) => ({ ...current, [documentType]: undefined }));
    setEvaluationMessage("Countersigned form uploaded successfully.");
    setSigningDocument(null);
  }

  async function handleUploadPoeTemplate(documentType: PoeDocumentType) {
    const file = templateUploadFiles[documentType];
    if (!file) {
      setEvaluationMessage("Please choose a blank form file to upload.");
      return;
    }
    setUploadingTemplate(documentType);
    setEvaluationMessage("");

    const filePath = `${documentType}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("poe-templates")
      .upload(filePath, file, { upsert: false, contentType: file.type });
    if (uploadError) {
      setEvaluationMessage(uploadError.message);
      setUploadingTemplate(null);
      return;
    }
    const fileUrl = supabase.storage.from("poe-templates").getPublicUrl(filePath).data.publicUrl;

    const { data, error } = await supabase
      .from("poe_document_templates")
      .upsert(
        { document_type: documentType, file_url: fileUrl, file_name: file.name },
        { onConflict: "document_type" },
      )
      .select("document_type, file_url, file_name")
      .single();

    if (error || !data) {
      setEvaluationMessage(error?.message || "Unable to upload the blank form.");
      setUploadingTemplate(null);
      return;
    }

    setPoeTemplates((current) => ({ ...current, [documentType]: data as PoeTemplate }));
    setTemplateUploadFiles((current) => ({ ...current, [documentType]: undefined }));
    setEvaluationMessage("Blank form uploaded successfully.");
    setUploadingTemplate(null);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function formatDeadline(deadline: string | null) {
    if (!deadline) {
      return "No deadline";
    }

    return new Date(deadline).toLocaleString();
  }

  if (loading) {
    return (
      <main style={loadingStyle}>
        <p>Loading manager workspace...</p>
      </main>
    );
  }

  if (!manager) {
    return (
      <main style={loadingStyle}>
        <p>Unable to load the manager workspace.</p>
      </main>
    );
  }

  const unreadManagerNotificationCount = notifications.filter(
    (notification) => notification.is_read === false,
  ).length;
  const managerInitials = (manager.full_name || manager.email || "M")
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
  const filteredEmployees = employees.filter((employee) =>
    matchesSearch(employee.full_name, employee.email),
  );
  const filteredTeams = teams.filter((team) => matchesSearch(team.name));
  const filteredProjects = projects.filter((project) =>
    matchesSearch(project.project_id, project.name, project.description) &&
    (projectStatusFilter === "all" || project.status === projectStatusFilter) &&
    (projectTeamFilter === "all" || project.team_id === projectTeamFilter) &&
    (projectEmployeeFilter === "all" || project.assigned_to === projectEmployeeFilter) &&
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
    matchesSearch(message.content, senderNames[message.sender_id]),
  );
  const activeEmployeeTeamNames = activeEmployeeProfile
    ? teamMembers
        .filter((member) => member.user_id === activeEmployeeProfile.id)
        .map((member) => getTeamName(member.team_id))
        .filter((teamName, index, list) => teamName !== "—" && list.indexOf(teamName) === index)
    : [];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f1ea",
        color: "#222222",
      }}
    >
      <header
        style={{
          height: "72px",
          background: "#ffffff",
          borderBottom: "1px solid #e5dfd6",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ margin: 0 }}>Work-Integrated Learning</h1>

        <div className="topbar-user">
          <Link href="/manager/notifications" className="notification-bell">
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
            {unreadManagerNotificationCount > 0 && (
              <span className="notification-badge">
                {unreadManagerNotificationCount > 99 ? "99+" : unreadManagerNotificationCount}
              </span>
            )}
          </Link>
          {manager.avatar_url ? (
            <img
              src={manager.avatar_url}
              alt={manager.full_name || "Profile"}
              className="header-avatar"
            />
          ) : (
            <span className="header-avatar-fallback">{managerInitials}</span>
          )}
        </div>
      </header>

      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 72px)",
        }}
      >
        <aside
          style={{
            width: "230px",
            background: "#222222",
            color: "#ffffff",
            padding: "32px 20px",
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: "#aaa39a",
              marginBottom: "24px",
            }}
          >
            Management
          </p>

          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Link href="/manager" style={navStyle}>
              Overview
            </Link>

            <Link href="/manager/teams" style={navStyle}>
              Teams
            </Link>

            <Link href="/manager/employees" style={navStyle}>
              Employees
            </Link>

            <Link href="/manager/projects" style={navStyle}>
              Projects
            </Link>
            <Link href="/manager/leaderboard" style={navStyle}>
              Leaderboard
            </Link>

            <Link href="/manager/announcements" style={navStyle}>
              Announcements
            </Link>

            <Link href="/manager/messages" style={navStyle}>
              Messages
            </Link>

            <Link href="/manager/calendar" style={navStyle}>
              Calendar
            </Link>

            <Link href="/manager/notifications" style={navStyle}>
              Notifications
            </Link>

            <Link href="/manager/settings" style={navStyle}>
              Settings
            </Link>
          </nav>

          <button onClick={handleSignOut} style={signOutStyle}>
            Sign Out
          </button>
        </aside>

        <section
          style={{
            flex: 1,
            padding: "48px",
            boxSizing: "border-box",
            maxWidth: "1400px",
          }}
        >
          {activeSection !== "leaderboard" && activeSection !== "overview" && (
            <div style={searchBarStyle}>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={
                  activeSection === "teams"
                    ? "Search team names..."
                    : "Search Bar"
                }
                aria-label="Search workspace"
                style={searchInputStyle}
              />
            </div>
          )}
          <div style={managerSectionVisibility(activeSection, "overview")}>
            <p
              style={{
                margin: 0,
                color: "#8a8175",
                fontSize: "14px",
              }}
            >
              Management Workspace
            </p>

            <h2
              style={{
                margin: "8px 0",
                fontSize: "36px",
              }}
            >
              Welcome back, {manager.full_name || "Manager"}.
            </h2>

            <p style={{ color: "#716b63" }}>
              Manage teams, employees, projects and company updates from one
              place.
            </p>
          </div>

          <div
            style={{
              visibility: activeSection === "overview" ? "visible" : "hidden",
              height: activeSection === "overview" ? "auto" : 0,
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "18px",
              marginBottom: "40px",
            }}
          >
            <SummaryCard title="Teams" value={teams.length} />

            <SummaryCard title="Employees" value={employees.length} />

            <SummaryCard title="Projects" value={projects.length} />

            <SummaryCard title="Announcements" value={announcements.length} />

            <SummaryCard
              title="Pending Requests"
              value={
                joinRequests.filter((request) => request.status === "pending")
                  .length
              }
            />

            <SummaryCard title="Messages" value={messages.length} />

            <SummaryCard
              title="Calendar Events"
              value={calendarEvents.length}
            />

            <SummaryCard title="Notifications" value={notifications.length} />
          </div>

          {/* TEAMS */}
          <section id="teams" style={managerSectionVisibility(activeSection, "teams")}>
            <h3 style={{ marginTop: 0 }}>Team Management</h3>

            <p style={subtitleStyle}> </p>

            <h4>Existing Teams</h4>

            <p style={subtitleStyle}> </p>

            {teams.length === 0 ? (
              <EmptyMessage>No teams have been created yet.</EmptyMessage>
            ) : (
              <div style={gridStyle}>
                {filteredTeams.map((team) => (
                  <div key={team.id} style={itemStyle}>
                    <h4 style={{ margin: 0 }}>{team.name}</h4>
                    <p style={teamMemberLabelStyle}>
                      Leader: {getEmployeeName(team.leader_id ?? null)}
                    </p>
                    <p style={teamMemberLabelStyle}>Team members</p>
                    {getTeamMembers(team.id).length === 0 ? (
                      <p style={teamMemberEmptyStyle}>No members yet.</p>
                    ) : (
                      <ul style={teamMemberListStyle}>
                        {getTeamMembers(team.id).map((memberName, index) => (
                          <li key={`${team.id}-${memberName}-${index}`}>
                            {memberName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                padding: "20px",
                background: "#f8f5ef",
                borderRadius: "14px",
                marginBottom: "24px",
                marginTop: "28px",
              }}
            >
              <div style={createTeamHeaderStyle}>
                <h4 style={{ margin: 0 }}>Create a Team</h4>
                <button
                  type="button"
                  onClick={() =>
                    setIsCreateTeamExpanded((current) => !current)
                  }
                  style={secondaryButtonStyle}
                  aria-expanded={isCreateTeamExpanded}
                  aria-controls="create-team-form"
                >
                  {isCreateTeamExpanded ? "Hide form" : "Expand form"}
                </button>
              </div>

              <div
                id="create-team-form"
                style={{
                  ...createTeamBodyStyle,
                  maxHeight: isCreateTeamExpanded ? "420px" : "0px",
                  opacity: isCreateTeamExpanded ? 1 : 0,
                  marginTop: isCreateTeamExpanded ? "16px" : "0px",
                }}
              >
                <form
                  onSubmit={handleCreateTeam}
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="text"
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Team name"
                    style={inputStyle}
                  />

                  <select
                    value={teamLeader}
                    onChange={(event) => setTeamLeader(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select team leader</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name || employee.email}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={creatingTeam}
                    style={buttonStyle}
                  >
                    {creatingTeam ? "Creating..." : "Create Team"}
                  </button>
                </form>
              </div>

              {teamMessage && <p style={messageStyle}>{teamMessage}</p>}
            </div>

          </section>

          {/* EMPLOYEES */}
          <section id="employees" style={managerSectionVisibility(activeSection, "employees")}>
            <h3 style={{ marginTop: 0 }}>Employee Management</h3>

            <p style={subtitleStyle}>Add employees to existing teams.</p>

            <form
              onSubmit={handleAddEmployee}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                maxWidth: "600px",
              }}
            >
              <select
                value={selectedTeam}
                onChange={(event) => setSelectedTeam(event.target.value)}
                style={inputStyle}
              >
                <option value="">Select a team</option>

                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedEmployee}
                onChange={(event) => setSelectedEmployee(event.target.value)}
                style={inputStyle}
              >
                <option value="">Select an employee</option>

                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name || employee.email}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={addingEmployee}
                style={buttonStyle}
              >
                {addingEmployee ? "Adding..." : "Add Employee to Team"}
              </button>
            </form>

            {memberMessage && <p style={messageStyle}>{memberMessage}</p>}

            <div style={{ marginTop: "30px" }}>
              <h4>Employees</h4>

              <p style={subtitleStyle}> </p>

              {employees.length === 0 ? (
                <EmptyMessage>No employee accounts were found.</EmptyMessage>
              ) : (
                <div style={listStyle}>
                  {filteredEmployees.map((employee) => (
                    <div key={employee.id} style={employeeCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openEmployeeProfile(employee)}
                          style={employeeAvatarButtonStyle}
                          aria-label={`View ${employee.full_name || employee.email} profile`}
                        >
                          {employee.avatar_url ? (
                            <img
                              src={employee.avatar_url}
                              alt={employee.full_name || "Employee profile"}
                              style={employeeAvatarStyle}
                            />
                          ) : (
                            <span style={employeeAvatarFallbackStyle}>
                              {getEmployeeInitials(employee)}
                            </span>
                          )}
                        </button>
                        <div style={employeeInfoStyle}>
                          <strong>
                            {employee.full_name || "Unnamed employee"}
                          </strong>
                          <p style={employeeEmailStyle}>{employee.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEvaluation(employee)}
                        style={evaluateButtonStyle}
                        aria-label={`Evaluate ${employee.full_name || employee.email}`}
                      >
                        Evaluate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* PROJECTS */}
          <section id="projects" style={managerSectionVisibility(activeSection, "projects")}>
            <h3 style={{ marginTop: 0 }}>Project Management</h3>

            <p style={subtitleStyle}>
              
            </p>

            <div
              style={{
                padding: "22px",
                background: "#f8f5ef",
                borderRadius: "14px",
                marginBottom: "30px",
              }}
            >
              <div style={createTeamHeaderStyle}>
                <h4 style={{ margin: 0 }}>
                  {editingProject ? "Edit Project" : "Create a Project"}
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setIsCreateProjectExpanded((current) => !current)
                  }
                  style={secondaryButtonStyle}
                  aria-expanded={isCreateProjectExpanded}
                  aria-controls="create-project-form"
                >
                  {isCreateProjectExpanded ? "Hide form" : "Expand form"}
                </button>
              </div>

              <div
                id="create-project-form"
                style={{
                  ...createTeamBodyStyle,
                  maxHeight: isCreateProjectExpanded ? "1200px" : "0px",
                  opacity: isCreateProjectExpanded ? 1 : 0,
                  marginTop: isCreateProjectExpanded ? "16px" : "0px",
                }}
              >
                <form
                  onSubmit={handleSaveProject}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <input
                    type="text"
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    placeholder="Project ID"
                    style={inputStyle}
                  />

                  <input
                    type="text"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="Project name"
                    style={inputStyle}
                  />

                  <textarea
                    value={projectDescription}
                    onChange={(event) =>
                      setProjectDescription(event.target.value)
                    }
                    placeholder="Project description"
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />

                  <select
                    value={assignmentType}
                    onChange={(event) => {
                      setAssignmentType(event.target.value);
                      setProjectTeam("");
                      setProjectEmployee("");
                    }}
                    style={inputStyle}
                  >
                    <option value="team">Assign to a team</option>

                    <option value="employee">Assign to an employee</option>
                  </select>

                  {assignmentType === "team" && (
                    <select
                      value={projectTeam}
                      onChange={(event) => setProjectTeam(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select a team</option>

                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {assignmentType === "employee" && (
                    <select
                      value={projectEmployee}
                      onChange={(event) => setProjectEmployee(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select an employee</option>

                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name || employee.email}
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    value={projectStatus}
                    onChange={(event) => setProjectStatus(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="incomplete">Incomplete</option>

                    <option value="complete">Complete</option>
                  </select>

                  <label
                    style={{
                      fontSize: "14px",
                      color: "#4f4a44",
                    }}
                  >
                    Deadline
                  </label>

                  <input
                    type="datetime-local"
                    value={projectDeadline}
                    onChange={(event) => setProjectDeadline(event.target.value)}
                    style={inputStyle}
                  />

                  <input
                    type="url"
                    value={projectLink}
                    onChange={(event) => setProjectLink(event.target.value)}
                    placeholder="Project link (optional)"
                    style={inputStyle}
                  />

                  <input
                    type="url"
                    value={projectZipUrl}
                    onChange={(event) => setProjectZipUrl(event.target.value)}
                    placeholder="ZIP file URL (optional)"
                    style={inputStyle}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={savingProject}
                      style={buttonStyle}
                    >
                      {savingProject
                        ? "Saving..."
                        : editingProject
                          ? "Update Project"
                          : "Create Project"}
                    </button>

                    {editingProject && (
                      <button
                        type="button"
                        onClick={resetProjectForm}
                        style={secondaryButtonStyle}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {projectMessage && <p style={messageStyle}>{projectMessage}</p>}
            </div>

            <h4>Projects</h4>

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
              <select value={projectEmployeeFilter} onChange={(event) => setProjectEmployeeFilter(event.target.value)} style={filterInputStyle}>
                <option value="all">All employees</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name || employee.email}</option>)}
              </select>
              <select value={projectDeadlineFilter} onChange={(event) => setProjectDeadlineFilter(event.target.value)} style={filterInputStyle}>
                <option value="all">All deadlines</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="no-deadline">No deadline</option>
              </select>
            </div>

            {projects.length === 0 ? (
              <EmptyMessage>No projects have been created yet.</EmptyMessage>
            ) : filteredProjects.length === 0 ? (
              <EmptyMessage>No projects match the selected filters.</EmptyMessage>
            ) : (
              <div style={listStyle}>
                {filteredProjects.map((project) => (
                  <article key={project.id} style={projectCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "20px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            color: "#8a8175",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                          }}
                        >
                          {project.project_id}
                        </p>

                        <h4
                          style={{
                            margin: "6px 0 4px",
                            fontSize: "20px",
                          }}
                        >
                          {project.name}
                        </h4>

                        {project.description && (
                          <p
                            style={{
                              margin: 0,
                              color: "#716b63",
                              lineHeight: 1.6,
                            }}
                          >
                            {project.description}
                          </p>
                        )}
                      </div>

                      <span style={statusStyle(project.status)}>
                        {project.status.replaceAll("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: "20px",
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <ProjectDetail
                        label="Assignment"
                        value={
                          project.assignment_type === "team"
                            ? "Team"
                            : "Employee"
                        }
                      />

                      <ProjectDetail
                        label="Assigned to"
                        value={
                          project.assignment_type === "team"
                            ? getTeamName(project.team_id)
                            : getEmployeeName(project.assigned_to)
                        }
                      />

                      <ProjectDetail
                        label="Deadline"
                        value={formatDeadline(project.deadline)}
                      />
                    </div>

                    {(project.project_link || project.project_zip_url) && (
                      <div
                        style={{
                          marginTop: "18px",
                          display: "flex",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        {project.project_link && (
                          <a
                            href={project.project_link}
                            target="_blank"
                            rel="noreferrer"
                            style={projectLinkStyle}
                          >
                            Open Project
                          </a>
                        )}

                        {project.project_zip_url && (
                          <a
                            href={project.project_zip_url}
                            target="_blank"
                            rel="noreferrer"
                            style={projectLinkStyle}
                          >
                            Project ZIP
                          </a>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: "20px",
                        paddingTop: "16px",
                        borderTop: "1px solid #e5dfd6",
                        display: "flex",
                        gap: "10px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => inspectProject(project)}
                        style={buttonStyle}
                      >
                        Inspect Project
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditingProject(project)}
                        style={secondaryButtonStyle}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project)}
                        disabled={deletingProjectId === project.id}
                        style={announcementDeleteButtonStyle}
                      >
                        {deletingProjectId === project.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

          </section>

          {/* JOIN REQUESTS */}
          <section id="join-requests" style={{ display: "none" }}>
            <h3 style={{ marginTop: 0 }}>Join Requests</h3>

            <p style={subtitleStyle}>
              Review employee requests to join your teams.
            </p>

            {requestMessage && <p style={messageStyle}>{requestMessage}</p>}

            {joinRequests.length === 0 ? (
              <EmptyMessage>
                No team join requests have been submitted yet.
              </EmptyMessage>
            ) : (
              <div style={listStyle}>
                {joinRequests.map((request) => {
                  const employeeName =
                    request.profiles?.full_name || "Unnamed employee";
                  const employeeEmail =
                    request.profiles?.email || "No email available";
                  const teamName = request.teams?.name || "Unknown team";

                  return (
                    <article key={request.id} style={projectCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "20px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: 0,
                              color: "#8a8175",
                              fontSize: "12px",
                              fontWeight: 700,
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                            }}
                          >
                            Team Join Request
                          </p>

                          <h4
                            style={{
                              margin: "6px 0 4px",
                              fontSize: "20px",
                            }}
                          >
                            {employeeName}
                          </h4>

                          <p
                            style={{
                              margin: 0,
                              color: "#716b63",
                            }}
                          >
                            {employeeEmail}
                          </p>
                        </div>

                        <span style={statusStyle(request.status)}>
                          {request.status.replaceAll("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "20px",
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "12px",
                        }}
                      >
                        <ProjectDetail label="Team" value={teamName} />

                        <ProjectDetail
                          label="Requested"
                          value={formatDate(request.requested_at)}
                        />

                        <ProjectDetail
                          label="Reviewed"
                          value={
                            request.reviewed_at
                              ? formatDate(request.reviewed_at)
                              : "Not reviewed"
                          }
                        />
                      </div>

                      {request.status === "pending" && (
                        <div
                          style={{
                            marginTop: "20px",
                            paddingTop: "16px",
                            borderTop: "1px solid #e5dfd6",
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleJoinRequestDecision(request, "approved")
                            }
                            disabled={processingRequestId === request.id}
                            style={buttonStyle}
                          >
                            {processingRequestId === request.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleJoinRequestDecision(request, "rejected")
                            }
                            disabled={processingRequestId === request.id}
                            style={deleteButtonStyle}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* MESSAGES */}
          <section id="messages" style={managerSectionVisibility(activeSection, "messages")}>
            <h3 style={{ marginTop: 0 }}>Messages</h3>
            <p style={subtitleStyle}>
              Communicate with your teams and employees.
            </p>

            <div
              style={{
                padding: "20px",
                background: "#f8f5ef",
                borderRadius: "14px",
                marginBottom: "24px",
              }}
            >
              <h4 style={{ marginTop: 0 }}>Private Conversation</h4>
              <p style={{ marginTop: 0, color: "#716b63", lineHeight: 1.6 }}>
                Team conversations are created automatically from team
                membership. Use this area only to start a private conversation
                with an employee.
              </p>
              <form
                onSubmit={handleCreateConversation}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <select
                  value={conversationEmployee}
                  onChange={(event) =>
                    setConversationEmployee(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name || employee.email}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={creatingConversation}
                  style={buttonStyle}
                >
                  {creatingConversation
                    ? "Opening..."
                    : "Open Private Conversation"}
                </button>
              </form>
            </div>

            {conversations.length === 0 ? (
              <EmptyMessage>
                You are not currently part of any conversations.
              </EmptyMessage>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 1fr",
                  gap: "18px",
                }}
              >
                <div style={listStyle}>
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedConversation(conversation.id)}
                      style={{
                        ...secondaryButtonStyle,
                        textAlign: "left" as const,
                        background:
                          selectedConversation === conversation.id
                            ? "#f8f5ef"
                            : "#ffffff",
                      }}
                    >
                      {conversation.type === "team"
                        ? `Team conversation${conversation.team_id ? ` · ${getTeamName(String(conversation.team_id))}` : ""}`
                        : "Direct conversation"}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    border: "1px solid #e5dfd6",
                    borderRadius: "14px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      minHeight: "220px",
                      display: "flex",
                      flexDirection: "column" as const,
                      gap: "10px",
                    }}
                  >
                    {filteredMessages.filter(
                      (message) =>
                        message.conversation_id === selectedConversation,
                    ).length === 0 ? (
                      <EmptyMessage>
                        No messages in this conversation yet.
                      </EmptyMessage>
                    ) : (
                      filteredMessages
                        .filter(
                          (message) =>
                            message.conversation_id === selectedConversation,
                        )
                        .map((message) => (
                          <div
                            key={message.id}
                            style={{
                              padding: "12px",
                              background: "#f8f5ef",
                              borderRadius: "10px",
                            }}
                          >
                            <p style={messageSenderStyle}>
                              {senderNames[message.sender_id] || "Unknown sender"}
                            </p>
                            <p style={{ margin: 0 }}>
                              {String(message.content ?? "")}
                            </p>
                            {message.created_at != null && (
                              <p
                                style={{
                                  margin: "6px 0 0",
                                  color: "#8a8175",
                                  fontSize: "12px",
                                }}
                              >
                                {formatDate(String(message.created_at))}
                              </p>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                  <form
                    onSubmit={sendManagerMessage}
                    style={{ display: "flex", gap: "10px", marginTop: "14px" }}
                  >
                    <input
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      placeholder="Write a message..."
                      style={inputStyle}
                    />
                    <button
                      type="submit"
                      disabled={
                        sendingMessage ||
                        !selectedConversation ||
                        !newMessage.trim()
                      }
                      style={buttonStyle}
                    >
                      {sendingMessage ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>

          {/* CALENDAR */}
          <section id="calendar" style={managerSectionVisibility(activeSection, "calendar")}>
            <h3 style={{ marginTop: 0 }}>Calendar</h3>
            <p style={subtitleStyle}>
              Create company events for everyone or for a specific team.
            </p>

            <div
              style={{
                padding: "20px",
                background: "#f8f5ef",
                borderRadius: "14px",
                marginBottom: "24px",
              }}
            >
              <div style={createTeamHeaderStyle}>
                <h4 style={{ margin: 0 }}>Create Calendar Event</h4>
                <button
                  type="button"
                  onClick={() =>
                    setIsCreateCalendarExpanded((current) => !current)
                  }
                  style={secondaryButtonStyle}
                  aria-expanded={isCreateCalendarExpanded}
                  aria-controls="create-calendar-form"
                >
                  {isCreateCalendarExpanded ? "Hide form" : "Expand form"}
                </button>
              </div>
              <div
                id="create-calendar-form"
                style={{
                  ...createTeamBodyStyle,
                  maxHeight: isCreateCalendarExpanded ? "700px" : "0px",
                  opacity: isCreateCalendarExpanded ? 1 : 0,
                  marginTop: isCreateCalendarExpanded ? "16px" : "0px",
                }}
              >
                <form
                  onSubmit={handleCreateCalendarEvent}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <input
                    value={calendarTitle}
                    onChange={(event) => setCalendarTitle(event.target.value)}
                    placeholder="Event title"
                    style={inputStyle}
                  />
                  <textarea
                    value={calendarDescription}
                    onChange={(event) =>
                      setCalendarDescription(event.target.value)
                    }
                    placeholder="Description (optional)"
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: "vertical" as const,
                      fontFamily: "inherit",
                    }}
                  />
                  <select
                    value={calendarTeam}
                    onChange={(event) => setCalendarTeam(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Company-wide event</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <label style={{ fontSize: "14px", color: "#4f4a44" }}>
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={calendarStart}
                    onChange={(event) => setCalendarStart(event.target.value)}
                    style={inputStyle}
                  />
                  <label style={{ fontSize: "14px", color: "#4f4a44" }}>
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={calendarEnd}
                    onChange={(event) => setCalendarEnd(event.target.value)}
                    style={inputStyle}
                  />
                  <button
                    type="submit"
                    disabled={savingCalendar}
                    style={buttonStyle}
                  >
                    {savingCalendar ? "Saving..." : "Create Event"}
                  </button>
                </form>
              </div>
              {calendarMessage && <p style={messageStyle}>{calendarMessage}</p>}
            </div>

            {calendarEvents.length === 0 ? (
              <EmptyMessage>
                No calendar events have been posted yet.
              </EmptyMessage>
            ) : (
              <div style={listStyle}>
                {calendarEvents.map((event) => (
                  <article key={event.id} style={projectCardStyle}>
                    <h4 style={{ marginTop: 0 }}>
                      {String(event.title ?? "Calendar event")}
                    </h4>
                    {event.description != null ? (
                      <p
                        style={{
                          margin: 0,
                          color: "#716b63",
                          lineHeight: 1.6,
                        }}
                      >
                        {String(event.description)}
                      </p>
                    ) : null}
                    <p
                      style={{
                        margin: "10px 0 0",
                        color: "#8a8175",
                        fontSize: "13px",
                      }}
                    >
                      {formatDate(String(event.start_at))} —{" "}
                      {formatDate(String(event.end_at))}
                    </p>
                    <div
                      style={{
                        marginTop: "14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0",
                            color: "#8a8175",
                            fontSize: "13px",
                          }}
                        >
                          {event.team_id
                            ? `Team: ${getTeamName(String(event.team_id))}`
                            : "Company-wide"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCalendarEvent(String(event.id))}
                        disabled={deletingCalendarEventId === String(event.id)}
                        style={announcementDeleteButtonStyle}
                      >
                        {deletingCalendarEventId === String(event.id)
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* NOTIFICATIONS */}
          <section id="notifications" style={managerSectionVisibility(activeSection, "notifications")}>
            <h3 style={{ marginTop: 0 }}>Notifications</h3>
            <p style={subtitleStyle}>
              Recent notifications associated with your manager account.
            </p>
            {notificationMessage && (
              <p style={messageStyle}>{notificationMessage}</p>
            )}
            {notifications.length === 0 ? (
              <EmptyMessage>You have no notifications right now.</EmptyMessage>
            ) : (
              <div style={listStyle}>
                {notifications.map((notification) => {
                  const unread = notification.is_read === false;
                  return (
                    <article
                      key={notification.id}
                      style={{
                        ...projectCardStyle,
                        opacity: unread ? 1 : 0.78,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                        }}
                      >
                        <h4 style={{ marginTop: 0 }}>
                          {String(notification.title ?? "Notification")}
                        </h4>
                        {unread && (
                          <span style={statusStyle("pending")}>NEW</span>
                        )}
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>
                        {String(notification.message ?? "")}
                      </p>
                      {notification.created_at != null ? (
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "#8a8175",
                            fontSize: "13px",
                          }}
                        >
                          {formatDate(String(notification.created_at))}
                        </p>
                      ) : null}
                      {unread && (
                        <button
                          type="button"
                          onClick={() =>
                            markManagerNotificationRead(notification)
                          }
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

          {/* ANNOUNCEMENTS */}
          <section id="announcements" style={managerSectionVisibility(activeSection, "announcements")}>
            <h3 style={{ marginTop: 0 }}>Company Announcements</h3>

            <p style={subtitleStyle}> </p>

            <div
              style={{
                padding: "22px",
                background: "#f8f5ef",
                borderRadius: "14px",
                marginBottom: "30px",
              }}
            >
              <div style={createTeamHeaderStyle}>
                <h4 style={{ margin: 0 }}>Post an Announcement</h4>
                <button
                  type="button"
                  onClick={() =>
                    setIsCreateAnnouncementExpanded((current) => !current)
                  }
                  style={secondaryButtonStyle}
                  aria-expanded={isCreateAnnouncementExpanded}
                  aria-controls="create-announcement-form"
                >
                  {isCreateAnnouncementExpanded ? "Hide form" : "Expand form"}
                </button>
              </div>

              <div
                id="create-announcement-form"
                style={{
                  ...createTeamBodyStyle,
                  maxHeight: isCreateAnnouncementExpanded ? "560px" : "0px",
                  opacity: isCreateAnnouncementExpanded ? 1 : 0,
                  marginTop: isCreateAnnouncementExpanded ? "16px" : "0px",
                }}
              >
                <form
                  onSubmit={handleCreateAnnouncement}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(event) => setAnnouncementTitle(event.target.value)}
                    placeholder="Announcement title"
                    style={inputStyle}
                  />

                  <textarea
                    value={announcementContent}
                    onChange={(event) =>
                      setAnnouncementContent(event.target.value)
                    }
                    placeholder="Write your announcement..."
                    rows={6}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />

                  <label style={{ fontSize: "13px", color: "#4f4a44", fontWeight: 600 }}>
                    Attach a document (optional)
                  </label>
                  <input
                    type="file"
                    onChange={(event) => setAnnouncementFile(event.target.files?.[0])}
                    style={inputStyle}
                  />

                  <button
                    type="submit"
                    disabled={savingAnnouncement}
                    style={buttonStyle}
                  >
                    {savingAnnouncement ? "Posting..." : "Post Announcement"}
                  </button>
                </form>
              </div>

              {announcementMessage && (
                <p style={messageStyle}>{announcementMessage}</p>
              )}
            </div>

            <h4>Latest Announcements</h4>

            <p style={subtitleStyle}> </p>

            {announcements.length === 0 ? (
              <EmptyMessage>
                No announcements have been posted yet.
              </EmptyMessage>
            ) : (
              <div style={listStyle}>
                {filteredAnnouncements.map((announcement) => (
                  <article key={announcement.id} style={projectCardStyle}>
                    {editingAnnouncementId === announcement.id ? (
                      <form
                        onSubmit={(event) =>
                          handleUpdateAnnouncement(event, announcement)
                        }
                        style={announcementEditFormStyle}
                      >
                        <input
                          type="text"
                          value={editingAnnouncementTitle}
                          onChange={(event) =>
                            setEditingAnnouncementTitle(event.target.value)
                          }
                          placeholder="Announcement title"
                          style={inputStyle}
                        />
                        <textarea
                          value={editingAnnouncementContent}
                          onChange={(event) =>
                            setEditingAnnouncementContent(event.target.value)
                          }
                          placeholder="Write your announcement..."
                          rows={6}
                          style={{
                            ...inputStyle,
                            resize: "vertical",
                            fontFamily: "inherit",
                          }}
                        />
                        <div style={announcementEditActionRowStyle}>
                          <button
                            type="submit"
                            disabled={savingAnnouncementEdit}
                            style={buttonStyle}
                          >
                            {savingAnnouncementEdit ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingAnnouncement}
                            disabled={savingAnnouncementEdit}
                            style={secondaryButtonStyle}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h4
                          style={{
                            marginTop: 0,
                            marginBottom: "8px",
                            fontSize: "20px",
                          }}
                        >
                          {announcement.title}
                        </h4>

                        <p
                          style={{
                            margin: 0,
                            color: "#4f4a44",
                            lineHeight: 1.7,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {announcement.content}
                        </p>

                        {announcement.file_url && (
                          <a
                            href={announcement.file_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ ...linkButtonStyle, marginTop: "10px" }}
                          >
                            Download {announcement.file_name || "attachment"}
                          </a>
                        )}
                      </>
                    )}

                    <div
                      style={{
                        marginTop: "18px",
                        paddingTop: "14px",
                        borderTop: "1px solid #e5dfd6",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#8a8175",
                          fontSize: "13px",
                        }}
                      >
                        Posted {formatDate(announcement.created_at)}
                      </span>

                      <div style={announcementRowActionsStyle}>
                        {editingAnnouncementId !== announcement.id && (
                          <button
                            type="button"
                            onClick={() => startEditingAnnouncement(announcement)}
                            style={announcementEditButtonStyle}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(announcement)}
                          disabled={deletingAnnouncementId === announcement.id}
                          style={announcementDeleteButtonStyle}
                        >
                          {deletingAnnouncementId === announcement.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="leaderboard" style={managerSectionVisibility(activeSection, "leaderboard")}>
            <h3 style={{ marginTop: 0 }}>Leaderboard</h3>
            <p style={subtitleStyle}></p>
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

          <section id="settings" style={managerSectionVisibility(activeSection, "settings")}>
            <h3 style={{ marginTop: 0 }}>Settings</h3>
            <p style={subtitleStyle}>
              Manage your profile, profile picture, and password.
            </p>
            {settingsMessage && <p style={successMessageStyle}>{settingsMessage}</p>}
            {settingsError && <p style={errorMessageStyle}>{settingsError}</p>}

            <div style={settingsGridStyle}>
              <article style={projectCardStyle}>
                <h4 style={{ marginTop: 0 }}>Profile picture</h4>
                <div style={avatarSettingsStyle}>
                  {manager.avatar_url ? (
                    <img
                      src={manager.avatar_url}
                      alt="Your profile"
                      style={avatarImageStyle}
                    />
                  ) : (
                    <span style={avatarFallbackStyle}>
                      {(manager.full_name || manager.email).charAt(0).toUpperCase()}
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
                  {manager.avatar_url && (
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
                <p style={settingsHintStyle}>Use an image smaller than 5 MB.</p>
              </article>

              <article style={projectCardStyle}>
                <h4 style={{ marginTop: 0 }}>Account information</h4>
                <form onSubmit={handleProfileUpdate} style={settingsFormStyle}>
                  <label style={settingsLabelStyle}>Full name</label>
                  <input
                    value={settingsFullName}
                    onChange={(event) => setSettingsFullName(event.target.value)}
                    style={inputStyle}
                    required
                  />
                  <label style={settingsLabelStyle}>Email address</label>
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

              <article style={projectCardStyle}>
                <h4 style={{ marginTop: 0 }}>Reset password</h4>
                <form onSubmit={handlePasswordUpdate} style={settingsFormStyle}>
                  <label style={settingsLabelStyle}>New password</label>
                  <input
                    type="password"
                    value={settingsPassword}
                    onChange={(event) => setSettingsPassword(event.target.value)}
                    style={inputStyle}
                    minLength={6}
                    required
                  />
                  <label style={settingsLabelStyle}>Confirm new password</label>
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
      {inspectedProject && (
        <div
          onClick={() => setInspectedProject(null)}
          style={projectInspectionModalBackdropStyle}
        >
          <article
            onClick={(event) => event.stopPropagation()}
            style={projectInspectionModalCardStyle}
          >
            <div style={cardHeaderStyle}>
              <div>
                <p style={eyebrowStyle}>{inspectedProject.project_id}</p>
                <h4 style={{ margin: "6px 0" }}>
                  Inspecting {inspectedProject.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectedProject(null)}
                style={secondaryButtonStyle}
              >
                Close Inspection
              </button>
            </div>

            {inspectedProject.description && (
              <p style={bodyTextStyle}>{inspectedProject.description}</p>
            )}
            <div style={projectInspectionGridStyle}>
              <ProjectDetail
                label="Status"
                value={inspectedProject.status.replaceAll("_", " ")}
              />
              <ProjectDetail
                label="Assignment"
                value={
                  inspectedProject.assignment_type === "team"
                    ? getTeamName(inspectedProject.team_id)
                    : getEmployeeName(inspectedProject.assigned_to)
                }
              />
              <ProjectDetail
                label="Deadline"
                value={formatDeadline(inspectedProject.deadline)}
              />
            </div>
            <div style={statusActionsStyle}>
              <button
                type="button"
                onClick={() => handleProjectStatusChange("complete")}
                style={
                  inspectedProject.status === "complete"
                    ? buttonStyle
                    : secondaryButtonStyle
                }
              >
                Mark Complete
              </button>
              <button
                type="button"
                onClick={() => handleProjectStatusChange("incomplete")}
                style={
                  inspectedProject.status === "incomplete"
                    ? buttonStyle
                    : secondaryButtonStyle
                }
              >
                Mark Incomplete
              </button>
            </div>
            <div style={actionsStyle}>
              {inspectedProject.project_link && (
                <a
                  href={inspectedProject.project_link}
                  target="_blank"
                  rel="noreferrer"
                  style={projectLinkStyle}
                >
                  Open Project Link
                </a>
              )}
              {inspectedProject.project_zip_url && (
                <a
                  href={inspectedProject.project_zip_url}
                  target="_blank"
                  rel="noreferrer"
                  style={projectLinkStyle}
                >
                  Download Project ZIP
                </a>
              )}
            </div>

            <h4 style={{ marginTop: "28px" }}>Project checklist</h4>
            {projectTasks.length === 0 ? (
              <EmptyMessage>No tasks have been added yet.</EmptyMessage>
            ) : (
              <div style={taskListStyle}>
                {projectTasks.map((task) => (
                  <label key={task.id} style={taskRowStyle}>
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
            <form onSubmit={handleAddProjectTask} style={taskFormStyle}>
              <input
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Add a project task..."
                style={inputStyle}
                required
              />
              <button
                type="submit"
                disabled={savingTask || !newTaskTitle.trim()}
                style={buttonStyle}
              >
                {savingTask ? "Adding..." : "Add Task"}
              </button>
            </form>
            {taskMessage && <p style={messageStyle}>{taskMessage}</p>}

            <h4 style={{ marginTop: "28px" }}>Employee submissions</h4>
            {projectSubmissions.length === 0 ? (
              <EmptyMessage>No employee submissions yet.</EmptyMessage>
            ) : (
              <div style={listStyle}>
                {projectSubmissions.map((submission) => (
                  <div key={submission.id} style={submissionRowStyle}>
                    <strong>{getEmployeeName(submission.employee_id)}</strong>
                    {submission.file_url && (
                      <a href={submission.file_url} target="_blank" rel="noreferrer" style={projectLinkStyle}>
                        Download {submission.file_name || "file"}
                      </a>
                    )}
                    {submission.submission_link && (
                      <a href={submission.submission_link} target="_blank" rel="noreferrer" style={projectLinkStyle}>
                        Open submitted link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <h4 style={{ marginTop: "28px" }}>Comments</h4>
            {loadingProjectComments ? (
              <p style={subtitleStyle}>Loading comments...</p>
            ) : projectComments.length === 0 ? (
              <EmptyMessage>No comments have been added yet.</EmptyMessage>
            ) : (
              <div style={listStyle}>
                {projectComments.map((projectComment) => (
                  <div key={projectComment.id} style={commentStyle}>
                    <strong>
                      {projectComment.profiles?.full_name ||
                        projectComment.profiles?.email ||
                        "Manager"}
                    </strong>
                    <p style={bodyTextStyle}>{projectComment.content}</p>
                    <p style={commentMetaStyle}>
                      {formatDate(projectComment.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <form
              onSubmit={handleAddProjectComment}
              style={projectCommentFormStyle}
            >
              <textarea
                value={projectCommentText}
                onChange={(event) => setProjectCommentText(event.target.value)}
                placeholder="Add an inspection comment..."
                rows={4}
                style={textareaStyle}
                required
              />
              <button
                type="submit"
                disabled={savingProjectComment || !projectCommentText.trim()}
                style={buttonStyle}
              >
                {savingProjectComment ? "Adding..." : "Add Comment"}
              </button>
            </form>
            {projectCommentMessage && (
              <p style={messageStyle}>{projectCommentMessage}</p>
            )}
          </article>
        </div>
      )}

      {activeEmployeeProfile && (
        <div
          onClick={closeEmployeeProfile}
          style={{
            ...employeeModalBackdropStyle,
            opacity: showEmployeeProfileModal ? 1 : 0,
            pointerEvents: showEmployeeProfileModal ? "auto" : "none",
          }}
        >
          <article
            onClick={(event) => event.stopPropagation()}
            style={{
              ...employeeModalCardStyle,
              opacity: showEmployeeProfileModal ? 1 : 0,
              transform: showEmployeeProfileModal
                ? "translateY(0) scale(1)"
                : "translateY(16px) scale(0.96)",
            }}
          >
            <button
              type="button"
              onClick={closeEmployeeProfile}
              style={employeeModalCloseStyle}
              aria-label="Close employee profile"
            >
              Close
            </button>
            <div style={employeeModalHeaderStyle}>
              {activeEmployeeProfile.avatar_url ? (
                <img
                  src={activeEmployeeProfile.avatar_url}
                  alt={activeEmployeeProfile.full_name || "Employee profile"}
                  style={employeeModalAvatarStyle}
                />
              ) : (
                <span style={employeeModalAvatarFallbackStyle}>
                  {getEmployeeInitials(activeEmployeeProfile)}
                </span>
              )}
              <div>
                <p style={employeeModalEyebrowStyle}>Employee Profile</p>
                <h4 style={employeeModalNameStyle}>
                  {activeEmployeeProfile.full_name || "Unnamed employee"}
                </h4>
                <p style={employeeModalEmailStyle}>{activeEmployeeProfile.email}</p>
              </div>
            </div>
            <div style={employeeModalGridStyle}>
              <ProjectDetail label="Role" value={activeEmployeeProfile.role} />
              <ProjectDetail
                label="Team count"
                value={String(activeEmployeeTeamNames.length)}
              />
            </div>
            <div style={{ marginTop: "16px" }}>
              <p style={employeeModalTeamsHeadingStyle}>Teams</p>
              {activeEmployeeTeamNames.length === 0 ? (
                <p style={teamMemberEmptyStyle}>No team memberships found.</p>
              ) : (
                <div style={employeeModalTagListStyle}>
                  {activeEmployeeTeamNames.map((teamName) => (
                    <span key={teamName} style={employeeModalTagStyle}>
                      {teamName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      )}

      {activeEvaluationEmployee && (
        <div
          onClick={closeEvaluation}
          style={{
            ...employeeModalBackdropStyle,
            opacity: showEvaluationModal ? 1 : 0,
            pointerEvents: showEvaluationModal ? "auto" : "none",
          }}
        >
          <article
            onClick={(event) => event.stopPropagation()}
            style={{
              ...employeeModalCardStyle,
              opacity: showEvaluationModal ? 1 : 0,
              transform: showEvaluationModal
                ? "translateY(0) scale(1)"
                : "translateY(16px) scale(0.96)",
            }}
          >
            <button
              type="button"
              onClick={closeEvaluation}
              style={employeeModalCloseStyle}
              aria-label="Close evaluation"
            >
              Close
            </button>
            <div style={employeeModalHeaderStyle}>
              {activeEvaluationEmployee.avatar_url ? (
                <img
                  src={activeEvaluationEmployee.avatar_url}
                  alt={activeEvaluationEmployee.full_name || "Employee profile"}
                  style={employeeModalAvatarStyle}
                />
              ) : (
                <span style={employeeModalAvatarFallbackStyle}>
                  {getEmployeeInitials(activeEvaluationEmployee)}
                </span>
              )}
              <div>
                <p style={employeeModalEyebrowStyle}>POE Evaluation</p>
                <h4 style={employeeModalNameStyle}>
                  {activeEvaluationEmployee.full_name || "Unnamed employee"}
                </h4>
                <p style={employeeModalEmailStyle}>{activeEvaluationEmployee.email}</p>
              </div>
            </div>

            {loadingEvaluation ? (
              <p style={subtitleStyle}>Loading documents...</p>
            ) : (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {POE_DOCUMENT_TYPES.filter((documentType) => documentType !== "poe_brief").map((documentType) => {
                  const template = poeTemplates[documentType];
                  const submission = evaluationSubmissions[documentType];
                  return (
                    <div key={documentType} style={poeEvaluationCardStyle}>
                      <h4 style={{ margin: "0 0 8px" }}>{POE_DOCUMENT_LABELS[documentType]}</h4>

                      {template?.file_url ? (
                        <a href={template.file_url} target="_blank" rel="noreferrer" style={linkButtonStyle}>
                          Download blank form
                        </a>
                      ) : (
                        <p style={teamMemberEmptyStyle}>Blank form not uploaded yet.</p>
                      )}

                      <div style={{ marginTop: "8px" }}>
                        <label style={{ fontSize: "12px", color: "#8a8175" }}>
                          {template?.file_url ? "Replace blank form" : "Upload blank form"}
                        </label>
                        <input
                          type="file"
                          onChange={(event) =>
                            setTemplateUploadFiles((current) => ({
                              ...current,
                              [documentType]: event.target.files?.[0],
                            }))
                          }
                          style={{ ...inputStyle, marginTop: "6px" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleUploadPoeTemplate(documentType)}
                          disabled={uploadingTemplate === documentType}
                          style={{ ...secondaryButtonStyle, marginTop: "8px" }}
                        >
                          {uploadingTemplate === documentType ? "Uploading..." : "Upload blank form"}
                        </button>
                      </div>

                      {submission?.file_url ? (
                        <p style={teamMemberLabelStyle}>
                          Employee&apos;s signed upload: {submission.file_name} —{" "}
                          <a href={submission.file_url} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        </p>
                      ) : (
                        <p style={teamMemberEmptyStyle}>The employee has not uploaded this form yet.</p>
                      )}

                      {submission?.signed_file_url && (
                        <p style={teamMemberLabelStyle}>
                          Countersigned: {submission.signed_file_name} —{" "}
                          <a href={submission.signed_file_url} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        </p>
                      )}

                      {submission?.file_url && (
                        <div style={{ marginTop: "10px" }}>
                          <label style={{ fontSize: "13px", color: "#4f4a44", fontWeight: 600 }}>
                            Upload countersigned form
                          </label>
                          <input
                            type="file"
                            onChange={(event) =>
                              setSigningDocumentFiles((current) => ({
                                ...current,
                                [documentType]: event.target.files?.[0],
                              }))
                            }
                            style={{ ...inputStyle, marginTop: "6px" }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSignPoeDocument(documentType)}
                            disabled={signingDocument === documentType}
                            style={{ ...buttonStyle, marginTop: "10px" }}
                          >
                            {signingDocument === documentType ? "Uploading..." : "Upload signed form"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {evaluationMessage && <p style={messageStyle}>{evaluationMessage}</p>}
              </div>
            )}
          </article>
        </div>
      )}
    </main>
  );
}

function managerSectionVisibility(
  activeSection: ManagerSection,
  section: ManagerSection,
) {
  return {
    ...sectionStyle,
    display: activeSection === section ? "block" : "none",
  };
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "22px",
        border: "1px solid #e5dfd6",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#8a8175",
          fontSize: "14px",
        }}
      >
        {title}
      </p>

      <strong
        style={{
          display: "block",
          fontSize: "30px",
          marginTop: "8px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ProjectDetail({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#f8f5ef",
        borderRadius: "10px",
        padding: "12px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#8a8175",
          fontSize: "12px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: "5px 0 0",
          fontWeight: 600,
          fontSize: "14px",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: "#716b63",
        background: "#f8f5ef",
        borderRadius: "12px",
        padding: "18px",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function statusStyle(status: string) {
  const normalized = status.toLowerCase();

  let background = "#eee9e2";
  let color = "#625d56";

  if (normalized === "complete") {
    background = "#e3eee4";
    color = "#35613d";
  }

  if (normalized === "in_progress") {
    background = "#eee8d8";
    color = "#765d24";
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

const subtitleStyle = {
  color: "#716b63",
  marginTop: 0,
  marginBottom: "24px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  border: "1px solid #d8d0c5",
  borderRadius: "10px",
  background: "#ffffff",
  fontSize: "14px",
};

const linkButtonStyle = {
  display: "inline-block",
  color: "#4f5f70",
  fontSize: "13px",
  fontWeight: 600,
  textDecoration: "none",
};

const poeEvaluationCardStyle = {
  padding: "16px 18px",
  border: "1px solid #e5dfd6",
  borderRadius: "12px",
  background: "#f8f5ef",
};

const buttonStyle = {
  padding: "12px 18px",
  border: "none",
  borderRadius: "10px",
  background: "#222222",
  color: "#ffffff",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "11px 17px",
  border: "1px solid #d8d0c5",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#222222",
  cursor: "pointer",
};

const successMessageStyle = {
  marginTop: "10px",
  color: "#35613d",
};

const errorMessageStyle = {
  marginTop: "10px",
  color: "#a33a3a",
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

const settingsLabelStyle = {
  marginTop: "12px",
  marginBottom: "6px",
  color: "#4f4a44",
  fontSize: "13px",
  fontWeight: 600,
};

const avatarSettingsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
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

const settingsHintStyle = {
  marginTop: "10px",
  color: "#8a8175",
  fontSize: "13px",
};

const deleteButtonStyle = {
  padding: "11px 17px",
  border: "1px solid #d7bcbc",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#9a3e3e",
  cursor: "pointer",
};

const subtleDeleteButtonStyle = {
  marginTop: "12px",
  padding: "5px 10px",
  border: "1px solid #ddd4c8",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#8a8175",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const announcementDeleteButtonStyle = {
  padding: "6px 11px",
  border: "1px solid #d7bcbc",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#9a3e3e",
  fontSize: "12px",
  cursor: "pointer",
};

const announcementEditButtonStyle = {
  padding: "6px 11px",
  border: "1px solid #d8d0c5",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#625d56",
  fontSize: "12px",
  cursor: "pointer",
};

const announcementEditFormStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};

const announcementEditActionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const announcementRowActionsStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const messageStyle = {
  marginTop: "14px",
  color: "#716b63",
};

const createTeamHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const createTeamBodyStyle = {
  overflow: "hidden",
  transition: "max-height 220ms ease, opacity 220ms ease, margin-top 220ms ease",
};

const itemStyle = {
  padding: "18px",
  border: "1px solid #e5dfd6",
  borderRadius: "12px",
};

const employeeCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  padding: "14px 18px",
  border: "1px solid #e5dfd6",
  borderRadius: "12px",
};

const employeeInfoStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "2px",
  minWidth: 0,
  flex: 1,
};

const employeeAvatarButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const employeeAvatarStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  objectFit: "cover" as const,
  flexShrink: 0,
};

const employeeAvatarFallbackStyle = {
  ...employeeAvatarStyle,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#222222",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 700,
};

const employeeEmailStyle = {
  margin: "5px 0 0",
  color: "#716b63",
};

const evaluateButtonStyle = {
  padding: "6px 10px",
  border: "1px solid #d8d0c5",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#4f4a44",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  lineHeight: 1.2,
};

const teamMemberLabelStyle = {
  margin: "12px 0 0",
  color: "#716b63",
  fontSize: "13px",
};

const teamMemberEmptyStyle = {
  margin: "6px 0 0",
  color: "#8a8175",
  fontSize: "13px",
};

const teamMemberListStyle = {
  margin: "6px 0 0",
  paddingLeft: "18px",
  color: "#4f4a44",
  lineHeight: 1.7,
};

const profileIconStyle = {
  marginLeft: "auto",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  border: "1px solid #d8d0c5",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#716b63",
};

const employeeModalBackdropStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 90,
  background: "rgba(20, 17, 13, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  transition: "opacity 180ms ease",
};

const employeeModalCardStyle = {
  width: "min(560px, 100%)",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #fffaf2 0%, #ffffff 100%)",
  border: "1px solid #e4d6bf",
  boxShadow: "0 24px 60px rgba(34, 28, 20, 0.22)",
  padding: "22px",
  position: "relative" as const,
  transition: "opacity 180ms ease, transform 180ms ease",
};

const employeeModalCloseStyle = {
  position: "absolute" as const,
  right: "14px",
  top: "14px",
  border: "1px solid #d8d0c5",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#4f4a44",
  fontSize: "12px",
  fontWeight: 700,
  padding: "7px 11px",
  cursor: "pointer",
};

const employeeModalHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  paddingRight: "80px",
};

const employeeModalAvatarStyle = {
  width: "78px",
  height: "78px",
  borderRadius: "50%",
  objectFit: "cover" as const,
};

const employeeModalAvatarFallbackStyle = {
  ...employeeModalAvatarStyle,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#222222",
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 700,
};

const employeeModalEyebrowStyle = {
  margin: 0,
  color: "#8a8175",
  fontSize: "11px",
  letterSpacing: "1.2px",
  textTransform: "uppercase" as const,
  fontWeight: 700,
};

const employeeModalNameStyle = {
  margin: "6px 0 4px",
  fontSize: "24px",
  color: "#2e2a24",
};

const employeeModalEmailStyle = {
  margin: 0,
  color: "#625d56",
};

const employeeModalGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
  marginTop: "18px",
};

const employeeModalTeamsHeadingStyle = {
  margin: "0 0 10px",
  color: "#4f4a44",
  fontWeight: 700,
};

const employeeModalTagListStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
};

const employeeModalTagStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid #decfb7",
  background: "#fff4df",
  color: "#5a4d3b",
  fontSize: "12px",
  fontWeight: 600,
};

const projectCardStyle = {
  padding: "22px",
  border: "1px solid #e5dfd6",
  borderRadius: "14px",
  background: "#ffffff",
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

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const eyebrowStyle = {
  margin: 0,
  color: "#8a8175",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase" as const,
};

const bodyTextStyle = {
  margin: "14px 0 0",
  color: "#4f4a44",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap" as const,
};

const projectInspectionGridStyle = {
  marginTop: "18px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

const projectInspectionModalBackdropStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 95,
  background: "rgba(20, 17, 13, 0.35)",
  backdropFilter: "blur(7px)",
  WebkitBackdropFilter: "blur(7px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const projectInspectionModalCardStyle = {
  width: "min(980px, 100%)",
  maxHeight: "88vh",
  overflowY: "auto" as const,
  ...projectCardStyle,
  marginTop: 0,
  boxShadow: "0 24px 60px rgba(16, 13, 9, 0.25)",
};
const statusActionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginTop: "16px",
};
const submissionRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
  padding: "12px",
  background: "#f8f5ef",
  borderRadius: "8px",
};

const actionsStyle = {
  marginTop: "18px",
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const commentStyle = {
  padding: "16px",
  borderRadius: "10px",
  background: "#f8f5ef",
};

const commentMetaStyle = {
  margin: "10px 0 0",
  color: "#8a8175",
  fontSize: "13px",
};

const messageSenderStyle = {
  margin: "0 0 6px",
  color: "#625d56",
  fontSize: "12px",
  fontWeight: 700,
};

const projectCommentFormStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginTop: "18px",
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  border: "1px solid #d8d0c5",
  borderRadius: "10px",
  background: "#ffffff",
  fontSize: "14px",
  resize: "vertical" as const,
};

const taskListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const taskRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  padding: "10px 12px",
  background: "#f8f5ef",
  borderRadius: "8px",
  color: "#4f4a44",
};

const taskFormStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "12px",
  flexWrap: "wrap" as const,
};

const taskCompletedStyle = {
  color: "#8a8175",
  textDecoration: "line-through",
};

const listStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "12px",
};

const navStyle = {
  display: "block",
  padding: "12px 14px",
  borderRadius: "10px",
  color: "#ffffff",
  textDecoration: "none",
};

const projectLinkStyle = {
  color: "#4f5f70",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
};

const signOutStyle = {
  marginTop: "40px",
  width: "100%",
  padding: "12px",
  border: "1px solid #555555",
  borderRadius: "10px",
  background: "transparent",
  color: "#ffffff",
  cursor: "pointer",
};

const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f1ea",
  color: "#222222",
};
