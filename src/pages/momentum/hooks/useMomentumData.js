import { useState, useEffect, useCallback } from 'react';
import { computeProgramStats } from '../utils/scoring';
import axiosInstance from '../../../api/axios';

export function useMomentumData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/momentum');
      setData({ programs: res.data.programs, logs: res.data.logs });
    } catch (err) {
      console.error('Failed to load momentum data', err);
      setData({ programs: [], logs: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Program CRUD ────────────────────────────────────────────────────────────

  const addProgram = async (prog) => {
    try {
      const res = await axiosInstance.post('/momentum/programs', prog);
      setData(prev => ({
        programs: [...(prev?.programs ?? []), res.data],
        logs: prev?.logs ?? [],
      }));
    } catch (err) {
      console.error('Failed to add program', err?.response?.data || err.message);
    }
  };

  const updateProgram = async (progId, updates) => {
    try {
      const res = await axiosInstance.put(`/momentum/programs/${progId}`, updates);
      setData(prev => ({
        ...prev,
        programs: (prev?.programs ?? []).map(p => p.id === progId ? { ...p, ...res.data } : p),
      }));
    } catch (err) {
      console.error('Failed to update program', err?.response?.data || err.message);
    }
  };

  const deleteProgram = async (progId) => {
    try {
      await axiosInstance.delete(`/momentum/programs/${progId}`);
      setData(prev => ({
        programs: (prev?.programs ?? []).filter(p => p.id !== progId),
        logs: (prev?.logs ?? []).filter(l => l.programId !== progId),
      }));
    } catch (err) {
      console.error('Failed to delete program', err?.response?.data || err.message);
    }
  };

  const logDay = async (logData) => {
    try {
      const res = await axiosInstance.post('/momentum/log', logData);
      const saved = res.data;
      setData(prev => {
        const prevLogs = prev?.logs ?? [];
        const existingIdx = prevLogs.findIndex(
          l => l.programId === saved.programId && l.date === saved.date
        );
        const newLogs = [...prevLogs];
        if (existingIdx >= 0) newLogs[existingIdx] = saved;
        else newLogs.push(saved);
        return { ...(prev ?? {}), logs: newLogs };
      });
    } catch (err) {
      console.error('Failed to log day', err?.response?.data || err.message);
    }
  };

  // ── Computed stats ──────────────────────────────────────────────────────────

  const getStats = () => {
    if (!data) return { programsWithStats: [], overallScore: 0, activeStreakCount: 0 };

    let overallScore = 0;
    let activeStreakCount = 0;

    const statsByProg = data.programs.map(p => {
      const stats = computeProgramStats(p, data.logs);
      overallScore += stats.totalScore;
      if (stats.currentStreak > 0) activeStreakCount++;
      return { ...p, stats };
    });

    statsByProg.sort((a, b) => {
      if (b.stats.currentStreak !== a.stats.currentStreak) return b.stats.currentStreak - a.stats.currentStreak;
      return a.name.localeCompare(b.name);
    });

    return { programsWithStats: statsByProg, overallScore, activeStreakCount };
  };

  return {
    data,
    isLoading,
    addProgram,
    updateProgram,
    deleteProgram,
    logDay,
    refetch: fetchAll,
    stats: getStats(),
  };
}
