import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { useAuth } from './AuthContext';

type WeightUnit = 'kg' | 'lbs';
type DistanceUnit = 'km' | 'mi';
type MeasurementUnit = 'cm' | 'in';

interface PreferencesContextType {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  measurementUnit: MeasurementUnit;
  isLoading: boolean;
  refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');
  const [isLoading, setIsLoading] = useState(true);

  async function refreshPreferences() {
    try {
      const data = await api.get('/api/settings/units');
      if (data?.weightUnit) setWeightUnit(data.weightUnit);
      if (data?.distanceUnit) setDistanceUnit(data.distanceUnit);
      if (data?.measurementUnit) setMeasurementUnit(data.measurementUnit);
    } catch {
      // Keep previous/default values on failure
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      refreshPreferences();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <PreferencesContext.Provider value={{ weightUnit, distanceUnit, measurementUnit, isLoading, refreshPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}
