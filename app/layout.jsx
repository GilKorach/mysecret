import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'MySecret',
  description: 'רשת חברתית אנונימית לשיתוף סודות. מקום שבו אפשר להגיד הכל!!!'
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="app-shell">
          <header className="topbar">
            <Link className="brand" href="/">MySecret</Link>
            <nav aria-label="ניווט ראשי">
              <Link href="/create">פרסום</Link>
              <Link href="/search">חיפוש</Link>
              <Link href="/notifications">התראות</Link>
              <Link href="/login">כניסה</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
