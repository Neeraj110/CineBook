// Auth pages render their own full-screen layouts — no shared shell needed
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
