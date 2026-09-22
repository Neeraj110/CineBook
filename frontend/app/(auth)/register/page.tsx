"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Register flow is now embedded in the login page (Create Account tab)
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/login?mode=register"); }, [router]);
  return null;
}
