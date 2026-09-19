"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Goal = { id: string; title: string; done: boolean };

export default function GoalsPanel({ matchId, initial }: { matchId: string; initial: Goal[] }) {
  const [supabase] = useState(() => createClient());
  const [goals, setGoals] = useState<Goal[]>(initial);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    setError(null);
    const { data, error } = await supabase
      .from("goals")
      .insert({ match_id: matchId, title: text })
      .select("id, title, done")
      .single();
    if (error) return setError(error.message);
    setGoals((g) => [...g, data as Goal]);
    setTitle("");
  }

  async function toggle(goal: Goal) {
    setGoals((g) => g.map((x) => (x.id === goal.id ? { ...x, done: !x.done } : x)));
    const { error } = await supabase.from("goals").update({ done: !goal.done }).eq("id", goal.id);
    if (error) {
      setError(error.message);
      setGoals((g) => g.map((x) => (x.id === goal.id ? goal : x)));
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) return setError(error.message);
    setGoals((g) => g.filter((x) => x.id !== id));
  }

  const done = goals.filter((g) => g.done).length;

  return (
    <section className="card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">Goals and action items</h2>
        {goals.length > 0 && <p className="text-sm">{done} of {goals.length} done</p>}
      </div>

      {goals.length === 0 ? (
        <p className="mt-3">No goals yet. Add the first thing you want to achieve together.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {goals.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={g.done} onChange={() => toggle(g)} />
                <span className={g.done ? "text-ink/60 line-through" : ""}>{g.title}</span>
              </label>
              <button onClick={() => remove(g.id)} className="text-sm underline" aria-label={`Delete goal ${g.title}`}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 flex gap-2">
        <label htmlFor="goal" className="sr-only">New goal</label>
        <input id="goal" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
          placeholder="For example: finish the portfolio draft" className="field" />
        <button className="btn btn-primary">Add</button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}
