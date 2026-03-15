export interface PestReport {
    id: string;
    pestName: string;
    scientificName: string;
    lifeStage: string;
    riskLevel: 'High' | 'Medium' | 'Low'; // Enforce the specific values
    explanation: string;
    imageBase64: string;
    status: 'pending' | 'validated' | 'rejected';
    timestamp: any; // Firestore Timestamp
    location: {
        lat: number;
        lng: number;
        areaName: string;
    };
}