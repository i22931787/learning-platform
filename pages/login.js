"use client"
import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    setMessage(error ? error.message : "✅ 註冊成功，請去信箱確認")
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setMessage(error ? error.message : "✅ 登入成功")
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>登入 / 註冊</h2>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="密碼"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignUp}>註冊</button>
      <button onClick={handleLogin}>登入</button>
      <p>{message}</p>
    </div>
  )
}
