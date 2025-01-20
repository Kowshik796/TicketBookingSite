import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { DistrictProvider } from '../context/DistrictContext';
import { LanguageProvider } from '../context/LanguageContext';
import RequireAuth from '../components/RequireAuth';
import UserMenuClient from '../components/UserMenuClient';
import HamburgerMenu from '../components/HamburgerMenu';
import DistrictSelector from '../components/DistrictSelector';
import './globals.css';

export const metadata = {
    title: 'Watch Your Show - Movie Ticket Booking',
    description: 'Book movie tickets across Tamil Nadu',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
                <ThemeProvider>
                    <LanguageProvider>
                        <AuthProvider>
                            <DistrictProvider>
                                <RequireAuth>
                                    <header className="sticky top-0 z-50 bg-primary text-white shadow-md">
                                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                            <div className="flex items-center justify-between h-16 gap-2">
                                                <div className="flex items-center gap-2 sm:gap-6 min-w-0">
                                                    <a href="/" className="text-lg sm:text-xl font-bold hover:opacity-90 transition whitespace-nowrap">
                                                        Watch Your Show
                                                    </a>
                                                </div>
                                                <nav className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
                                                    <DistrictSelector />
                                                    <UserMenuClient />
                                                    <HamburgerMenu />
                                                </nav>
                                            </div>
                                        </div>
                                    </header>
                                    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                                        {children}
                                    </main>
                                </RequireAuth>
                            </DistrictProvider>
                        </AuthProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
