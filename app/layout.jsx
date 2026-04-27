import { Rubik } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import UserWayAccessibilityButton from '@/components/UserWayAccessibilityButton';

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '900']
});

export const metadata = {
  title: 'MySecret',
  description: 'רשת חברתית אנונימית לשיתוף סודות. מקום שבו אפשר להגיד הכל.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={rubik.className} suppressHydrationWarning>
        <AppShell>{children}</AppShell>
        <UserWayAccessibilityButton />
      </body>
    </html>
  );
}
