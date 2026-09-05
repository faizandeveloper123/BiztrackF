"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import CRMService from "@/src/services/CRMService";
import {
  Lead,
  CALL_RESULTS,
  LeadNoteItem,
  LeadTaskItem,
  LeadEmailItem,
  LeadSmsItem,
  LeadCampaignItem,
  LeadCampaignAssignment,
  LeadSaleItem,
  LeadPipelineHistoryItem,
} from "@/src/models/crm";
import { LeadNotesTab } from "./LeadNotesTab";
import { LeadTimelineTab } from "./LeadTimelineTab";
import { LeadTasksTab } from "./LeadTasksTab";
import { LeadEmailsTab } from "./LeadEmailsTab";
import { LeadSmsTab } from "./LeadSmsTab";
import { LeadCampaignsTab } from "./LeadCampaignsTab";
import { LeadSoldTab } from "./LeadSoldTab";

type Props = {
  lead: Lead;
  leadId: string;
  patchLead: (data: Record<string, unknown>) => Promise<void>;
  reload: () => Promise<void>;
};

export function LeadWorkspaceTabs({ lead, leadId, patchLead, reload }: Props) {
  const [tab, setTab] = useState("notes");
  const [hideSystem, setHideSystem] = useState(false);
  const [notes, setNotes] = useState<LeadNoteItem[]>([]);
  const [tasks, setTasks] = useState<LeadTaskItem[]>([]);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [emails, setEmails] = useState<LeadEmailItem[]>([]);
  const [emailDir, setEmailDir] = useState<"outgoing" | "incoming">("outgoing");
  const [sms, setSms] = useState<LeadSmsItem[]>([]);
  const [campaigns, setCampaigns] = useState<LeadCampaignItem[]>([]);
  const [assignments, setAssignments] = useState<LeadCampaignAssignment[]>([]);
  const [sales, setSales] = useState<LeadSaleItem[]>([]);
  const [timeline, setTimeline] = useState<LeadPipelineHistoryItem[]>([]);

  const [noteType, setNoteType] = useState<"note" | "call">("call");
  const [noteContent, setNoteContent] = useState("");
  const [callResult, setCallResult] = useState<string>(CALL_RESULTS[0]);
  const [noteAt, setNoteAt] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDetails, setTaskDetails] = useState("");
  const [taskDue, setTaskDue] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  );
  const [taskStatus, setTaskStatus] = useState("not_started");

  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showCompose, setShowCompose] = useState(false);

  const [smsBody, setSmsBody] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");

  const [saleRole, setSaleRole] = useState("");
  const [saleMls, setSaleMls] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState("");

  const loadTabData = useCallback(async () => {
    if (!leadId) return;
    if (tab === "notes") {
      setNotes(await CRMService.getLeadNotes(leadId, hideSystem));
    } else if (tab === "timeline") {
      setTimeline(await CRMService.getLeadTimeline(leadId));
    } else if (tab === "tasks") {
      setTasks(await CRMService.getLeadTasks(leadId, showCompletedTasks));
    } else if (tab === "emails") {
      setEmails(await CRMService.getLeadEmails(leadId, emailDir));
    } else if (tab === "sms") {
      setSms(await CRMService.getLeadSms(leadId));
    } else if (tab === "campaigns") {
      setCampaigns(await CRMService.getLeadCampaigns());
      setAssignments(await CRMService.getLeadCampaignAssignments(leadId));
    } else if (tab === "sold") {
      setSales(await CRMService.getLeadSales(leadId));
    }
  }, [leadId, tab, hideSystem, showCompletedTasks, emailDir]);

  useEffect(() => {
    loadTabData().catch(() => undefined);
  }, [loadTabData]);

  return (
    <div className="rounded-lg border bg-card p-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
          <TabsTrigger value="notes">
            Notes & Calls ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="emails">
            E-mails ({lead.emailCount || 0})
          </TabsTrigger>
          <TabsTrigger value="sms">SMS ({lead.smsCount || 0})</TabsTrigger>
          <TabsTrigger value="campaigns">E-campaigns</TabsTrigger>
          <TabsTrigger value="sold">Sold Details</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <LeadNotesTab
            leadId={leadId}
            notes={notes}
            noteType={noteType}
            setNoteType={setNoteType}
            noteContent={noteContent}
            setNoteContent={setNoteContent}
            callResult={callResult}
            setCallResult={setCallResult}
            noteAt={noteAt}
            setNoteAt={setNoteAt}
            hideSystem={hideSystem}
            setHideSystem={setHideSystem}
            loadTabData={loadTabData}
            reload={reload}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <LeadTimelineTab timeline={timeline} />
        </TabsContent>

        <TabsContent value="tasks">
          <LeadTasksTab
            leadId={leadId}
            tasks={tasks}
            taskTitle={taskTitle}
            setTaskTitle={setTaskTitle}
            taskDetails={taskDetails}
            setTaskDetails={setTaskDetails}
            taskDue={taskDue}
            setTaskDue={setTaskDue}
            taskStatus={taskStatus}
            setTaskStatus={setTaskStatus}
            showCompletedTasks={showCompletedTasks}
            setShowCompletedTasks={setShowCompletedTasks}
            loadTabData={loadTabData}
            reload={reload}
          />
        </TabsContent>

        <TabsContent value="emails">
          <LeadEmailsTab
            lead={lead}
            leadId={leadId}
            emails={emails}
            emailDir={emailDir}
            setEmailDir={setEmailDir}
            emailSubject={emailSubject}
            setEmailSubject={setEmailSubject}
            emailBody={emailBody}
            setEmailBody={setEmailBody}
            showCompose={showCompose}
            setShowCompose={setShowCompose}
            loadTabData={loadTabData}
            reload={reload}
          />
        </TabsContent>

        <TabsContent value="sms">
          <LeadSmsTab
            lead={lead}
            leadId={leadId}
            sms={sms}
            smsBody={smsBody}
            setSmsBody={setSmsBody}
            patchLead={patchLead}
            loadTabData={loadTabData}
            reload={reload}
          />
        </TabsContent>

        <TabsContent value="campaigns">
          <LeadCampaignsTab
            lead={lead}
            leadId={leadId}
            campaigns={campaigns}
            assignments={assignments}
            selectedCampaign={selectedCampaign}
            setSelectedCampaign={setSelectedCampaign}
            loadTabData={loadTabData}
          />
        </TabsContent>

        <TabsContent value="sold">
          <LeadSoldTab
            leadId={leadId}
            sales={sales}
            saleRole={saleRole}
            setSaleRole={setSaleRole}
            saleMls={saleMls}
            setSaleMls={setSaleMls}
            salePrice={salePrice}
            setSalePrice={setSalePrice}
            saleDate={saleDate}
            setSaleDate={setSaleDate}
            loadTabData={loadTabData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
