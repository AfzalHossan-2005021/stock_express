import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    return redirect('/');
  }
  return (
    <main className="min-h-screen bg-gray-900 px-4 py-10 flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/10" />
      <div className="relative w-full max-w-5xl">
        {children}
      </div>
    </main>
  )
}

export default layout;