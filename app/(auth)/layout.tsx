import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    return redirect('/');
  }
  return (
    <main className="auth-layout">
      <section className="auth-left-section scrollbar-hide-default">
        <Link href="/" className="auth-logo">
          <Image src="/assets/icons/logo.svg" alt="Stock Express Logo" width={140} height={32} className="h-8 w-auto" />
        </Link>

        <div className="pb-6 lg:pb-8 flex-1">
          {children}
        </div>
      </section>
      <section className="auth-right-section">
        <div className="z-10 relative lg:mt-4 lg:mb-16">
          <blockquote className="auth-blockquote">
            
          </blockquote>
          <div className="flex items-center justify-between">
            <div>
              <cite className="auth-cite">- Afzal Hossan</cite>
              <p className="auth-cite-role">Retail Investor</p>
            </div>
            <div className="flex items-center gap-0.5">
              {
                Array.from({ length: 5 }).map((_, index) => (
                  <Image
                    key={index}
                    src="/assets/icons/star.svg"
                    alt="Star Icon"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                ))
              }
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <Image
            src="/assets/images/theme.png"
            alt="Dashboard Preview"
            width={1536}
            height={1024}
            className="auth-dashboard-preview absolute top-0"
          />
        </div>
      </section>
    </main>
  )
}

export default layout;