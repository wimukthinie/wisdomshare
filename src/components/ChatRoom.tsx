"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  body: string | null;
  attachment_path: string | null;
  attachment_type: string | null;
  created_at: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function Attachment({ message }: { message: Message }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.storage
      .from("attachments")
      .createSignedUrl(message.attachment_path!, 3600)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [message.attachment_path]);

  if (!url) return <p className="text-sm">Loading file</p>;
  if (message.attachment_type?.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={message.body ?? "Shared image"} className="max-h-60 rounded-md" />
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="font-semibold underline">
      {message.body ?? "Download file"}
    </a>
  );
}

export default function ChatRoom({ matchId, userId }: { matchId: string; userId: string }) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("messages")
      .select("id, sender_id, body, attachment_path, attachment_type, created_at")
      .eq("match_id", matchId)
      .order("created_at")
      .then(({ data }) => {
        if (active) setMessages((data ?? []) as Message[]);
      });

    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setError(null);
    const { error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: userId, body: text });
    if (error) setError(error.message);
  }

  async function upload(file: File) {
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError("Files must be smaller than 10 MB.");
      return;
    }
    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${matchId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    const { error: insertError } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: userId,
      body: file.name,
      attachment_path: path,
      attachment_type: file.type,
    });
    if (insertError) setError(insertError.message);
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-line bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && <p>No messages yet. Say hello to start the conversation.</p>}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-4 py-2 ${mine ? "ml-auto bg-pine text-white" : "bg-mist"}`}
            >
              {m.attachment_path ? <Attachment message={m} /> : <p className="whitespace-pre-wrap">{m.body}</p>}
              <p className={`mt-1 text-xs ${mine ? "text-white/80" : "text-ink/60"}`}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p role="alert" className="px-4 text-sm text-red-700">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
        <label className="btn btn-ghost cursor-pointer">
          Attach
          <input
            type="file"
            className="sr-only"
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </label>
        <label htmlFor="message" className="sr-only">Message</label>
        <input
          id="message" value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message" className="field" autoComplete="off"
        />
        <button className="btn btn-primary">Send</button>
      </form>
    </div>
  );
}
