"use client";
// import { usePathname, useRouter } from "next/navigation";
// import { useEffect } from "react";
import SideBar from "../../components/SideBar";
import RightPanel from "../../components/RightPanel";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const pathname = usePathname();
  // const router = useRouter();

  // const isAuthenticated = typeof window !== "undefined" && localStorage.getItem("token");

  // useEffect(() => {
  //   if (!isAuthenticated) router.push("/login");
  // }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen">
      <SideBar className="flex-3"/>
      <main className="flex-8 p-6 bg-[#EDEDFA]">{children}</main>
      <RightPanel className="flex-4"/>
    </div>
  );
}
