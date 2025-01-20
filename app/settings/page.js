'use client';

import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
            <div className="mb-6 sm:mb-8">
                <h1 className="section-title mb-2">Settings</h1>
                <div className="breadcrumb">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Settings</span>
                </div>
            </div>

            <div className="card p-4 sm:p-8 max-w-xl">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Theme</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Appearance</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Switch between light and dark mode
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => theme === 'dark' && toggleTheme()}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${theme === 'light'
                                ? 'bg-[#C21807] text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Light
                        </button>
                        <button
                            onClick={() => theme === 'light' && toggleTheme()}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${theme === 'dark'
                                ? 'bg-[#C21807] text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Dark
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}