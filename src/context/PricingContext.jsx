import React, { createContext, useContext, useState } from 'react';
import { PricingDialog } from '../components/premium/PricingDialog';

const PricingContext = createContext({
    isOpen: false,
    openPricing: () => {},
    closePricing: () => {}
});

export function PricingProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);

    const openPricing = () => setIsOpen(true);
    const closePricing = () => setIsOpen(false);

    return (
        <PricingContext.Provider value={{ isOpen, openPricing, closePricing }}>
            {children}
            <PricingDialog isOpen={isOpen} onClose={closePricing} />
        </PricingContext.Provider>
    );
}

export const usePricing = () => useContext(PricingContext);
