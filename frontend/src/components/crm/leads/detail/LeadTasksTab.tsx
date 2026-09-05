"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { LeadTaskItem } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  leadId: string;
  tasks: LeadTaskItem[];
  taskTitle: string;
  setTaskTitle: (v: string) => void;
  taskDetails: string;
  setTaskDetails: (v: string) => void;
  taskDue: string;
  setTaskDue: (v: string) => void;
  taskStatus: string;
  setTaskStatus: (v: string) => void;
  showCompletedTasks: boolean;
  setShowCompletedTasks: React.Dispatch<React.SetStateAction<boolean>>;
  loadTabData: () => Promise<void>;
  reload: () => Promise<void>;
};

export function LeadTasksTab({
  leadId,
  tasks,
  taskTitle,
  setTaskTitle,
  taskDetails,
  setTaskDetails,
  taskDue,
  setTaskDue,
  taskStatus,
  setTaskStatus,
  showCompletedTasks,
  setShowCompletedTasks,
  loadTabData,
  reload,
}: Props) {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter Title of new task..."
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
      />
      <Textarea
        placeholder="Task details..."
        value={taskDetails}
        onChange={(e) => setTaskDetails(e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select value={taskStatus} onValueChange={setTaskStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="datetime-local"
          value={taskDue}
          onChange={(e) => setTaskDue(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTaskTitle("");
            setTaskDetails("");
          }}
        >
          Clear
        </Button>
        <Button
          size="sm"
          onClick={async () => {
            if (!taskTitle.trim()) return;
            await CRMService.createLeadTask(leadId, {
              title: taskTitle,
              details: taskDetails,
              status: taskStatus,
              dueAt: new Date(taskDue).toISOString(),
              flagged: true,
            });
            setTaskTitle("");
            setTaskDetails("");
            loadTabData();
            reload();
          }}
        >
          Save
        </Button>
      </div>
      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="border rounded-lg p-3">
            <div className="flex justify-between">
              <strong>{t.title}</strong>
              <span className="text-xs capitalize">{t.priority} Priority</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <Badge className="capitalize">{t.status}</Badge>
              <span className="text-xs text-muted-foreground">
                {t.dueAt ? new Date(t.dueAt).toLocaleString() : ""}
                {t.overdue && (
                  <span className="text-red-500 ml-1 font-medium">OVERDUE</span>
                )}
              </span>
            </div>
            <p className="text-sm mt-2">{t.details}</p>
            <div className="flex border-t mt-3 divide-x text-xs">
              <button
                className="flex-1 py-2 text-primary"
                onClick={() =>
                  CRMService.completeLeadTask(leadId, t.id).then(() => {
                    loadTabData();
                    reload();
                  })
                }
              >
                Complete
              </button>
              <button
                className="flex-1 py-2 text-primary"
                onClick={() =>
                  CRMService.pushLeadTask(leadId, t.id).then(loadTabData)
                }
              >
                Push
              </button>
              <button
                className="flex-1 py-2"
                onClick={() =>
                  CRMService.deleteLeadTask(leadId, t.id).then(() => {
                    loadTabData();
                    reload();
                  })
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCompletedTasks((v) => !v)}
        >
          {showCompletedTasks ? "Hide completed" : "Show completed"}
        </Button>
      </div>
    </div>
  );
}
