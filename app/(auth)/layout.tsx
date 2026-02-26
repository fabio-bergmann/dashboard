export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-surface rounded-2xl shadow-sm border border-border p-8">
        {children}
      </div>
    </div>
  );
}
