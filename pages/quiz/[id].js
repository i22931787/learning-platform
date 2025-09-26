import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function QuizPage() {
  const router = useRouter();
  const { id } = router.query; // lesson id
  const [user, setUser] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [choice, setChoice] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { window.location.href = "/login"; return; }
      setUser(data.user);

      const { data: q } = await supabase.from("quizzes").select("*").eq("lesson_id", id).maybeSingle();
      setQuiz(q || null);
    })();
  }, [id]);

  const submit = async () => {
    if (!user || !quiz || choice === null) return;
    const isCorrect = Number(choice) === quiz.answer_index;
    const score = isCorrect ? 20 : 0;

    await supabase.from("quiz_attempts").upsert({
      user_id: user.id, quiz_id: quiz.id, is_correct: isCorrect, score
    });

    if (isCorrect) {
      // 加分
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const newPoints = (prof?.points ?? 0) + score;
      await supabase.from("profiles").update({ points: newPoints }).eq("id", user.id);
      setMsg(`✅ 答對！+${score} 分，總積分 ${newPoints}`);
    } else {
      setMsg("❌ 答錯，下次再接再厲！");
    }
  };

  if (!quiz) return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 20 }}>
      <h1>尚未為此課程建立測驗</h1>
      <a href="/roadmap">回學習地圖</a>
    </main>
  );

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 20 }}>
      <h1>小測驗</h1>
      <p><b>題目：</b>{quiz.question}</p>
      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        {quiz.options.map((op, i) => (
          <label key={i}>
            <input type="radio" name="opt" value={i}
              onChange={() => setChoice(i)} /> {op}
          </label>
        ))}
      </div>
      <button onClick={submit} style={{ marginTop: 12 }} disabled={choice === null}>送出</button>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      <p style={{ marginTop: 12 }}><a href="/roadmap">回學習地圖</a></p>
    </main>
  );
}
