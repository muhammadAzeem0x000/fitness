export const calculateBMI = (weight, heightCm) => {
    if (!weight || !heightCm) return 0;
    const heightM = heightCm / 100;
    return (weight / (heightM * heightM)).toFixed(1);
};

export const getUserStats = (profile, weightHistory) => {
    const safeHistory = weightHistory || [];
    const currentWeight = profile?.current_weight || (safeHistory.length > 0 ? safeHistory[safeHistory.length - 1].weight : 0);
    const startWeight = safeHistory.length > 0 ? safeHistory[0].weight : currentWeight;
    return {
        height: profile?.height || 0,
        currentWeight,
        startWeight,
        goalWeight: profile?.goal_weight || 0
    };
};

export const validatePhysicalStats = (weightKg, heightCm) => {
    if (weightKg !== null && weightKg !== undefined && weightKg !== 0 && !isNaN(weightKg)) {
        if (weightKg < 20) return "Weight seems too low. Please enter a valid weight.";
        if (weightKg > 400) return "Weight seems too high. Please enter a valid weight.";
    }
    if (heightCm !== null && heightCm !== undefined && heightCm !== 0 && !isNaN(heightCm)) {
        if (heightCm < 50) return "Height seems too low. Please enter a valid height.";
        if (heightCm > 300) return "Height seems too high. Please enter a valid height.";
    }
    return null;
};
