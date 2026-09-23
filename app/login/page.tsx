"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { trackAdminEvent } from "@/lib/gtag";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 追蹤管理員登入事件
      trackAdminEvent("admin_login", "success");

      router.push("/admin/stores");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "登入失敗，請檢查您的帳號密碼");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">管理員登入</h1>
          <p className="text-sm text-default-500">請使用您的管理者帳號登入</p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <Input
              isRequired
              label="電子郵件"
              placeholder="輸入您的電子郵件"
              type="email"
              value={email}
              onValueChange={setEmail}
            />
            <Input
              isRequired
              label="密碼"
              placeholder="輸入您的密碼"
              type="password"
              value={password}
              onValueChange={setPassword}
            />
            {error && (
              <div className="text-danger text-sm bg-danger-50 p-3 rounded-lg">{error}</div>
            )}
            <Button className="w-full" color="primary" isLoading={loading} type="submit">
              登入
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
