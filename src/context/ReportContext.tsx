import React, { createContext, useState, useContext, ReactNode } from 'react';
import { PestReport } from '../types/Report';

interface ReportContextType {
    reports: PestReport[];
    updateReportStatus: (id: string, newStatus: PestReport['status']) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider = ({ children }: { children: ReactNode }) => {
    // Replace this initial array with your actual data source (e.g., Firestore call)
    const [reports, setReports] = useState<PestReport[]>([]);

    const updateReportStatus = (id: string, newStatus: PestReport['status']) => {
        setReports((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
    };

    return (
        <ReportContext.Provider value={{ reports, updateReportStatus }}>
            {children}
        </ReportContext.Provider>
    );
};

export const useReports = () => {
    const context = useContext(ReportContext);
    if (!context) throw new Error('useReports must be used within a ReportProvider');
    return context;
};