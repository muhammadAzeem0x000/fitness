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
