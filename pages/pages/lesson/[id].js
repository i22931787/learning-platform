import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const LEVEL_RULES = [
  { level: 1, minPoints: 0 },
  { level: 2, minPoints: 100 },
  { level: 3, minPoints: 250 },
];

export default function LessonPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { window.location.href = "/login"; return; }
      setUser(data.user);

      const { data: l } = await supabase.from("lessons").select("*").eq("id", id).single();
      setLesson(l);

      const { data: p } = await supabase.from("lesson_progress").select("*")
        .eq("user_id", data.user.id).eq("lesson_id", id).maybeSingle();
      setCompleted(!!p?.completed);
    })();
  }, [id]);

  const markCompleted = async () => {
    if (!user || !lesson) return;
    // 1) upsert 進度
    await supabase.from("lesson_progress").upsert({
      user_id: user.id, lesson_id: lesson.id, completed: true, updated_at: new Date().toISOString()
    });
    setCompleted(true);

    // 2) 加分（完成一次 +10；可改成只在第一次完成時加分，這裡簡化為每次標記都加，實務可再限制）
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    let newPoints = (prof?.points ?? 0) + 10;

    // 3) 依規則升級
    let newLevel = prof?.level ?? 1;
    for (const r of LEVEL_RULES.slice().reverse()) {
      if (newPoints >= r.minPoints) { newLevel = Math.max(newLevel, r.level); break; }
    }

    await supabase.from("profiles").update({ points: newPoints, level: newLevel }).eq("id", user.id);
    setMsg(`✅ 已標記完成並加分。當前積分：${newPoints}，職級：${newLevel}`);
  };

  if (!lesson) return null;

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: 20 }}>
      <h1>{lesson.title}</h1>
      {lesson.content_url && (
        <p>
          教材連結：<a href={lesson.content_url} target="_blank" rel="noreferrer">{lesson.content_url}</a>
        </p>
      )}
      <p>需要職級：{lesson.level_required}</p>

      <button onClick={markCompleted} disabled={completed}>
        {completed ? "已完成" : "標記完成（+10 分）"}
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 16 }}>
        <a href={`/quiz/${lesson.id}`}>前往小測驗</a>{" | "}
        <a href="/roadmap">回學習地圖</a>
      </p>
    </main>
  );
}
