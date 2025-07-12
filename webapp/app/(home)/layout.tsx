import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className="h-full bg-[var(--lk-bg)]">
      <Navbar session={session} />
      {children}
    </div>
  );
}
