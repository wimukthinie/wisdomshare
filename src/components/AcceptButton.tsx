"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AcceptButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("matches").update({ status: "active" }).eq("id", matchId);
    router.refresh();
  }

  return (
    <button onClick={accept} disabled={loading} className="btn btn-primary">
      {loading ? "Accepting" : "Accept"}
    </button>
  );
}
