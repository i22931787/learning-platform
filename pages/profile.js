import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        window.location.href = "/login";
        return;
      }
      setUser(data.user);
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      setProfile(prof || null);
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const saveNickname = async () => {
    if (!user) return;
    const nickname = prompt("輸入暱稱（僅在目前為空時可設定一次）：", "");
    if (!nickname) return;
    const { error } = await supabase
      .from("profiles")
      .update({ nickname })
      .eq("id", user.id)
      .is("nickname", null); // 只允許在為空時設定
    setMsg(error ? `更新失敗：${error.message}` : "✅ 已設定暱稱");
    // 重新拉取
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(prof || null);
  };

  if (!user) return null;

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 20 }}>
      <h1>我的資料</h1>
      <p><b>Email：</b>{user.email}</p>
      <p><b>暱稱：</b>{profile?.nickname ?? "(尚未設定)"}</p>
      <p><b>職級：</b>{profile?.level ?? 1}</p>
      <p><b>積分：</b>{profile?.points ?? 0}</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <a href="/">回首頁</a>
        {!profile?.nickname && <button onClick={saveNickname}>設定暱稱</button>}
        <button onClick={logout}>登出</button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
