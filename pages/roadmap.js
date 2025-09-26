import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // 路徑：pages -> lib

export default function RoadmapPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [msg, setMsg] = useState("載入中…");

  useEffect(() => {
    (async () => {
      // 1) 取得登入使用者
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) return setMsg(`Auth 錯誤：${userErr.message}`);
      if (!userData?.user) return setMsg("尚未登入，請先回首頁登入");
      setUser(userData.user);

      // 2) 取個人資料（拿職級）
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (profErr) return setMsg(`讀取個人資料失敗：${profErr.message}`);
      setProfile(prof || { level: 1, points: 0 });

      // 3) 讀課程（RLS 若沒開放，這裡會報 401/permission denied）
      const { data: rows, error: lessonErr } = await supabase
        .from("lessons")
        .select("*")
        .lte("level_required", (prof?.level ?? 1))
        .order("level_required", { ascending: true });

      if (lessonErr) return setMsg(`讀課程失敗：${lessonErr.message}`);
      setLessons(rows || []);
      setMsg("");
    })();
  }, []);

  if (msg) {
    return (
      <main style={{ maxWidth: 640, margin: "40px auto", padding: 20 }}>
        <h1>學習地圖</h1>
        <p>{msg}</p>
        <p><a href="/">回首頁</a></p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 20 }}>
      <h1>學習地圖（職級 {profile?.level ?? 1}）</h1>
      {lessons.length === 0 && <p>目前沒有符合你職級的課程。</p>}
      <ul>
        {lessons.map((l) => (
          <li key={l.id} style={{ margin: "12px 0" }}>
            <b>{l.title}</b>（需要職級 {l.level_required}）
            {" — "}
            <a href={`/lesson/${l.id}`}>開始學習</a>
            {" ｜ "}
            <a href={`/quiz/${l.id}`}>小測驗</a>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 16 }}>
        <a href="/profile">回個人資料</a>{" ｜ "}
        <a href="/">回首頁</a>
      </p>
    </main>
  );
}

