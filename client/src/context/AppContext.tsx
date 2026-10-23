import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { BusinessLocation, Organization } from '../../../server/src/types/index.js';

interface AppContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  currentLocation: BusinessLocation | null;
  locations: BusinessLocation[];
  setCurrentLocation: (loc: BusinessLocation) => void;
  refreshLocation: () => Promise<void>;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isDemoMode: boolean;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<BusinessLocation | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const orgs = await api.getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setCurrentOrg(orgs[0]);
          const locs = await api.getLocations(orgs[0].id);
          setLocations(locs);
          if (locs.length > 0) {
            setCurrentLocation(locs[0]);
          }
        }
        const status = await api.getIntegrationStatus();
        setIsDemoMode(status.mode === 'DEMO_FIXTURES');
      } catch (err: any) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const refreshLocation = async () => {
    if (!currentLocation) return;
    try {
      const refreshed = await api.getLocation(currentLocation.id);
      setCurrentLocation(refreshed);
      setLocations(prev => prev.map(l => l.id === refreshed.id ? refreshed : l));
    } catch (err) {
      console.error('Failed to refresh location:', err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <AppContext.Provider
      value={{
        currentOrg,
        organizations,
        currentLocation,
        locations,
        setCurrentLocation,
        refreshLocation,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        toast,
        showToast,
        isDemoMode,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
