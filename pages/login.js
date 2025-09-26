import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [msg, setMsg] = useState("");

  // 已登入就送去 /profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) window.location.href = "/profile";
    });
  }, []);

  const signUp = async () => {
    setMsg("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return setMsg(`註冊失敗：${error.message}`);

    // 嘗試先把暱稱寫入（若你的專案開啟了 Email 確認，第一次註冊通常沒有 session，這一步可能會被 RLS 擋下，沒關係，等登入後在 /profile 也會補寫）
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from("profiles")
          .update({ nickname })
          .eq("id", userData.user.id);
      }
    } catch (_) {}

    setMsg("✅ 註冊成功！若有開啟信箱驗證，請先到 Email 完成確認再登入。");
  };

  const signIn = async () => {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return setMsg(`登入失敗：${error.message}`);
    // 登入後補寫暱稱（只在目前為空時）
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (uid && nickname) {
        await supabase
          .from("profiles")
          .update({ nickname })
          .eq("id", uid)
          .is("nickname", null);
      }
    } catch (_) {}
    window.location.href = "/profile";
  };

  return (
    <main style={{ maxWidth: 440, margin: "40px auto", padding: 20 }}>
      <h1>登入 / 註冊</h1>

      <section style={{ marginTop: 24 }}>
        <h3>註冊</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <input placeholder="暱稱（可先填，之後在個人頁也能補）"
                 value={nickname} onChange={e => setNickname(e.target.value)} />
          <input placeholder="Email" type="email"
                 value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="密碼" type="password"
                 value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={signUp}>註冊</button>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>登入</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <input placeholder="Email" type="email"
                 value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="密碼" type="password"
                 value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={signIn}>登入</button>
        </div>
      </section>

      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}
    </main>
  );
}

