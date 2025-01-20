'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDistricts } from '../data/mock';

const DistrictContext = createContext(null);

export function DistrictProvider({ children }) {
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await getDistricts();
            setDistricts(data);
            // Try to load previously selected district from localStorage
            const saved = localStorage.getItem('selectedDistrictId');
            if (saved) {
                const found = data.find(d => d.id === Number(saved));
                if (found) {
                    setSelectedDistrict(found);
                    setLoading(false);
                    return;
                }
            }
            // Default to first district (Chennai in the mock data)
            if (data.length > 0) {
                setSelectedDistrict(data[0]);
            }
            setLoading(false);
        };
        fetch();
    }, []);

    const changeDistrict = useCallback((district) => {
        setSelectedDistrict(district);
        if (district) {
            localStorage.setItem('selectedDistrictId', String(district.id));
        } else {
            localStorage.removeItem('selectedDistrictId');
        }
    }, []);

    return (
        <DistrictContext.Provider value={{ selectedDistrict, districts, changeDistrict, loading }}>
            {children}
        </DistrictContext.Provider>
    );
}

export function useDistrict() {
    const context = useContext(DistrictContext);
    if (!context) {
        throw new Error('useDistrict must be used within a DistrictProvider');
    }
    return context;
}