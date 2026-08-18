import { useEffect } from 'react';
import api from '../services/api';

const SecurityMonitor = ({ teamId, isActive, onDisqualify }) => {
  useEffect(() => {
    if (!isActive) return;

    const reportViolation = async (event, reason) => {
      try {
        await api.post(`/team/${teamId}/violation`, { event, reason });
        onDisqualify(reason);
      } catch (err) {
        console.error("Failed to report violation", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportViolation('TAB_SWITCH', 'TAB SWITCHING DETECTED');
      }
    };

    const handleBlur = () => {
      reportViolation('WINDOW_BLUR', 'BROWSER FOCUS LOST');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportViolation('FULLSCREEN_EXIT', 'EXITED FULLSCREEN MODE');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      // Don't disqualify on just right click, but we block it.
      // Or we can report violation. Requirement says: "After grace period -> mark violation -> disqualify team -> store reason... DEVELOPER TOOLS / INSPECT DETECTED"
      reportViolation('INSPECT_ATTEMPT', 'DEVELOPER TOOLS / INSPECT DETECTED');
    };

    const handleKeyDown = (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        reportViolation('DEVTOOLS_DETECTED', 'DEVELOPER TOOLS / INSPECT DETECTED');
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        reportViolation('DEVTOOLS_DETECTED', 'DEVELOPER TOOLS / INSPECT DETECTED');
      }
    };

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Cleanup
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, teamId, onDisqualify]);

  return null;
};

export default SecurityMonitor;
