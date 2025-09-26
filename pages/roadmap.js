import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function RoadmapPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({}); // {lesson_id: completed}

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { window.location.href = "/login"; return; }
      setUser(data.user);

      // 取個人資料
      const { data: prof } = await supabase.from("profiles").select("*")
        .eq("id", data.user.id).single();
      setProfile(prof);

      // 取符合職級的課程
      const { data: ls } = await supabase.from("lessons").select("*")
        .lte("level_required", prof?.level ?? 1).order("created_at", { ascending: true });
      setLessons(ls || []);

      // 取進度
      const { data: ps } = await supabase.from("lesson_progress").select("*")
        .eq("user_id", data.user.id);
      const map = {};
      (ps || []).forEach(p => { map[p.lesson_id] = p.completed; });
      setProgress(map);
    })();
  }, []);

  if (!profile) return null;

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
      <h1>學習地圖（職級 {profile.level}）</h1>
      <ul>
        {lessons.map(l => (
          <li key={l.id} style={{ margin: "10px 0" }}>
            <b>{l.title}</b>（需要職級 {l.level_required}）
            {"  "}
            <a href={`/lesson/${l.id}`} style={{ marginLeft: 8 }}>進入教材</a>
            {"  "}
            <a href={`/quiz/${l.id}`} style={{ marginLeft: 8 }}>小測驗</a>
            {"  "}
            {progress[l.id] ? <span>✅ 已完成</span> : <span>⬜ 尚未完成</span>}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16 }}>
        <a href="/profile">回個人資料</a>
      </div>
    </main>
  );
}
