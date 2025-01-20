'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const stored = localStorage.getItem('language');
        if (stored === 'en' || stored === 'ta') {
            setLanguage(stored);
        }
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguage(prev => {
            const next = prev === 'en' ? 'ta' : 'en';
            localStorage.setItem('language', next);
            return next;
        });
    }, []);

    const t = useCallback((key) => {
        if (translations[language] && translations[language][key]) {
            return translations[language][key];
        }
        if (translations.en && translations.en[key]) {
            return translations.en[key];
        }
        return key;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}