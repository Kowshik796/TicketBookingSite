'use client';

import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

export default function AboutPage() {
    const { t } = useLanguage();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
            <div className="mb-6 sm:mb-8">
                <h1 className="section-title mb-2">{t('aboutUs')}</h1>
                <div className="breadcrumb">
                    <Link href="/">{t('home')}</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{t('about')}</span>
                </div>
            </div>

            <div className="card p-4 sm:p-8 max-w-3xl">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                        {t('aboutText1')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mt-4">
                        {t('aboutText2')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mt-4">
                        {t('aboutText3')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mt-6 font-semibold">
                        {t('aboutText4')}
                    </p>
                </div>
            </div>
        </div>
    );
}