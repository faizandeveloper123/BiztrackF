"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { apiService } from "@/src/services/ApiService";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { toast } from "sonner";

export interface TaskMessage {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  messageType: string;
  createdAt?: string;
  isMine?: boolean;
}

interface TaskMessagesPanelProps {
  taskId: string;
}

function formatMessageTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function TaskMessagesPanel({ taskId }: TaskMessagesPanelProps) {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getTaskMessages(taskId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load messages"));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageType: "message" | "info_request") => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      setSending(true);
      const created = await apiService.createTaskMessage(taskId, {
        body: trimmed,
        messageType,
      });
      setMessages((prev) => [...prev, created]);
      setBody("");
      toast.success(
        messageType === "info_request" ? "Info request sent" : "Message sent",
      );
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Task communication
        </h3>
      </div>
      <p className="text-xs text-slate-500">
        Ask the assigner for more details or discuss this task here.
      </p>

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border bg-white p-3">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                message.isMine
                  ? "ml-6 bg-blue-50 text-slate-900"
                  : "mr-6 bg-slate-100 text-slate-900"
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-medium">{message.authorName}</span>
                {message.messageType === "info_request" && (
                  <Badge variant="outline" className="text-[10px]">
                    Info request
                  </Badge>
                )}
                <span className="text-[11px] text-slate-500">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ask a question or share details..."
        rows={3}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={sending || !body.trim()}
          onClick={() => void sendMessage("info_request")}
        >
          Ask for more info
        </Button>
        <Button
          type="button"
          disabled={sending || !body.trim()}
          onClick={() => void sendMessage("message")}
        >
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}
