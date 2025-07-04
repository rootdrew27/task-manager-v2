import { Navbar } from "@/app/(home)/_components/navbar";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full bg-[var(--lk-bg)]">
      <Navbar />
      {children}
    </div>
  );
}
