import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const UserPreferencesContext = createContext();

export function UserPreferencesProvider({ children }) {
    const [preferences, setPreferences] = useLocalStorage('fitness_preferences', {
        weightUnit: 'kg', // 'kg' or 'lbs'
        heightUnit: 'cm', // 'cm' or 'ft'
    });

    // Auto-heal any corrupted local storage states
    const activeWeightUnit = preferences.weightUnit || 'kg';
    const activeHeightUnit = activeWeightUnit === 'kg' ? 'cm' : 'ft';

    const toggleWeightUnit = () => {
        setPreferences(prev => {
            const isKg = prev.weightUnit === 'kg';
            return {
                ...prev,
                weightUnit: isKg ? 'lbs' : 'kg',
                heightUnit: isKg ? 'ft' : 'cm'
            };
        });
    };

    const toggleHeightUnit = () => {
        // Obsolete, but kept for safety. Units are strictly bound.
        toggleWeightUnit();
    };

    // Helper: Convert Kg to User's Unit
    const displayWeight = (kgValue) => {
        if (!kgValue) return 0;
        if (activeWeightUnit === 'kg') return parseFloat(kgValue.toFixed(1));
        return parseFloat((kgValue * 2.20462).toFixed(1));
    };

    // Helper: Convert User's Input to Kg (for DB)
    const convertWeightToDb = (inputValue) => {
        const val = parseFloat(inputValue);
        if (isNaN(val)) return 0;
        if (activeWeightUnit === 'kg') return val;
        return val / 2.20462;
    };

    // Helper: Convert Cm to User's Unit (Display string only for height usually)
    const displayHeight = (cmValue) => {
        if (!cmValue) return '';
        if (activeHeightUnit === 'cm') return `${Math.round(cmValue)}`;

        // Convert to ft/in
        const totalInches = cmValue / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        return `${feet}'${inches}"`;
    };

    const formatWeightLabel = () => activeWeightUnit === 'kg' ? 'kg' : 'lbs';
    const formatHeightLabel = () => activeHeightUnit === 'cm' ? 'cm' : '';

    const value = {
        preferences: { ...preferences, weightUnit: activeWeightUnit, heightUnit: activeHeightUnit },
        weightUnit: activeWeightUnit,
        heightUnit: activeHeightUnit,
        toggleWeightUnit,
        toggleHeightUnit,
        displayWeight,
        convertWeightToDb,
        displayHeight,
        formatWeightLabel,
        formatHeightLabel,
        convertHeightToCm: (val1, val2, unit) => {
            if (unit === 'cm') return parseFloat(val1);

            // ft + in : val1 is feet, val2 is inches
            const feet = parseFloat(val1) || 0;
            const inches = parseFloat(val2) || 0;
            return ((feet * 12) + inches) * 2.54;
        },
        formatHeightValue: (cmValue) => {
            if (!cmValue) return { val1: '', val2: '' };
            if (activeHeightUnit === 'cm') {
                return { val1: Math.round(cmValue), val2: '' };
            }
            const totalInches = cmValue / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round(totalInches % 12);
            return { val1: feet, val2: inches };
        }
    };

    return (
        <UserPreferencesContext.Provider value={value}>
            {children}
        </UserPreferencesContext.Provider>
    );
}

export function useUserPreferences() {
    const context = useContext(UserPreferencesContext);
    if (!context) {
        throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
    }
    return context;
}
