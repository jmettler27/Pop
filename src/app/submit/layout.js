import AppFooter from '@/frontend/components/AppFooter';

export default function SubmitLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
