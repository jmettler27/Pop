import AppFooter from '@/frontend/components/AppFooter';
import NavigationBar from '@/frontend/components/home/NavigationBar';

export default function AboutLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
      <NavigationBar />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
