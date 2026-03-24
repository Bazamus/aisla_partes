import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const StatsContext = createContext();

export const StatsProvider = ({ children }) => {
  const [globalStats, setGlobalStats] = useState({
    totalPartes: 0,
    partesPendientes: 0,
    partesCompletados: 0,
    partesAprobados: 0,
    partesHoy: 0,
    loading: true
  });

  const updateStats = useCallback((newStats) => {
    setGlobalStats(prevStats => {
      // Evitar re-render si los valores no cambiaron
      const merged = { ...prevStats, ...newStats };
      const changed = Object.keys(merged).some(key => merged[key] !== prevStats[key]);
      return changed ? merged : prevStats;
    });
  }, []);

  const value = useMemo(() => ({ globalStats, updateStats }), [globalStats, updateStats]);

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
};

StatsProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};
