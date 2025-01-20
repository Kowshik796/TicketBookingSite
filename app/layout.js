import { AuthProvider } from '../context/AuthContext';
import RequireAuth from '../components/RequireAuth';
import UserMenuClient from '../components/UserMenuClient';
import './globals.css';

export const metadata = {
    title: 'Watch Your Show - Movie Ticket Booking',
    description: 'Book movie tickets across Tamil Nadu',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <RequireAuth>
                        <header className="sticky top-0 z-50 bg-primary text-white shadow-md">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex justify-between items-center h-16">
                                    <div className="flex items-center gap-6">
                                        <a href="/" className="text-xl font-bold hover:opacity-90 transition">
                                            Watch Your Show
                                        </a>
                                        <a href="/movies" className="text-sm font-semibold hover:text-[#FF6B6B] transition-colors">
                                            Movies
                                        </a>
                                    </div>
                                    <nav className="flex items-center gap-4">
                                        <UserMenuClient />
                                    </nav>
                                </div>
                            </div>
                        </header>
                        <main className="min-h-screen bg-gray-50">
                            {children}
                        </main>
                    </RequireAuth>
                </AuthProvider>
            </body>
        </html>
    );
}
