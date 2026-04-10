import AdminSidebar from "@/components/admin/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar - Desktop and mobile drawer combined in this component */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-3 md:p-8 lg:p-10 lg:pl-56 pt-20 lg:pt-10 min-h-screen">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
