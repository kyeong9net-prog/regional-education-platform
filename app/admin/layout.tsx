import AdminNavigation from '@/components/layout/AdminNavigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <AdminNavigation />
      {children}
    </div>
  );
}
