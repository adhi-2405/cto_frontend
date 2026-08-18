import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import SecurityMonitor from '../components/SecurityMonitor';
import { TerminalSquare, Send, AlertTriangle, Maximize, Play, CheckCircle, XCircle, Clock } from 'lucide-react';

const Challenge = () => {
  const [team, setTeam] = useState(null);
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('// Write your code here...\n');
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  
  // Security States
  const [countdown, setCountdown] = useState(10);
  const [securityActive, setSecurityActive] = useState(false);
  const [disqualifiedReason, setDisqualifiedReason] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    fetchAssignment();
  }, []);

  const fetchAssignment = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return navigate('/');

      const res = await api.post(`/team/${user.username}/assign`);
      const { team, question } = res.data;
      
      setTeam(team);
      setQuestion(question);
      
      if (team.status === 'DISQUALIFIED') {
        const lastVio = team.violations[team.violations.length - 1];
        setDisqualifiedReason(lastVio ? lastVio.reason : 'SECURITY VIOLATION');
      } else if (team.answer) {
        setCode(team.answer);
      }

    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 && err.response.data.error.includes('disqualified')) {
        setDisqualifiedReason('SECURITY VIOLATION');
      }
    } finally {
      setLoading(false);
    }
  };

  // 10-second grace period
  useEffect(() => {
    if (loading || disqualifiedReason || team?.status === 'SUBMITTED' || team?.status === 'COMPLETED') return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setSecurityActive(true);
    }
  }, [countdown, loading, disqualifiedReason, team]);

  // Initialize timer from loginTime
  useEffect(() => {
    if (team?.loginTime) {
      const loginDate = new Date(team.loginTime).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - loginDate) / 1000);
      const remaining = Math.max(15 * 60 - elapsedSeconds, 0);
      setTimeLeft(remaining);
    }
  }, [team]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0 || loading || team?.status === 'SUBMITTED' || team?.status === 'COMPLETED') return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, loading, team]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const requestFullscreen = async () => {
    try {
      if (containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Fullscreen request failed", err);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleDisqualify = (reason) => {
    setDisqualifiedReason(reason);
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await api.post(`/team/${team.teamId}/run`, { code, language });
      setRunResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to run code.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/team/${team.teamId}/submit`, { code });
      setTeam({ ...team, status: 'SUBMITTED' });
    } catch (err) {
      console.error('Failed to submit:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column' }}>
        <span className="loader" style={{ width: '40px', height: '40px', marginBottom: '20px' }}></span>
        <h2 className="heading-secondary text-cyan">INITIALIZING EVENT ENVIRONMENT...</h2>
      </div>
    );
  }

  if (disqualifiedReason) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', backgroundColor: '#1a0505' }}>
        <AlertTriangle size={80} color="var(--accent-red)" style={{ marginBottom: '20px' }} />
        <h1 className="heading-primary text-red" style={{ background: 'none', color: 'var(--accent-red)' }}>DISQUALIFIED</h1>
        <h2 className="heading-secondary">Team: {team?.teamId}</h2>
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'var(--accent-red)', marginTop: '20px', textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '10px' }}>Reason:</p>
          <h3 style={{ color: 'var(--accent-red)' }}>{disqualifiedReason}</h3>
        </div>
        <p style={{ marginTop: '30px', color: 'var(--text-muted)' }}>Your participation has been terminated due to a security violation.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="challenge-wrapper">
      
      {/* Security Monitor Component */}
      <SecurityMonitor teamId={team?.teamId} isActive={securityActive} onDisqualify={handleDisqualify} />

      {/* Header */}
      <header className="challenge-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TerminalSquare color="var(--accent-cyan)" />
          <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>CODE THE OUTPUT</h1>
        </div>
        
        <div className="challenge-header-right">
          
          {/* Timer Display */}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'rgba(0,0,0,0.4)', padding: '5px 12px', 
            borderRadius: '4px', border: '1px solid var(--accent-cyan)',
            color: timeLeft <= 300 ? 'var(--accent-red)' : 'white',
            fontWeight: 'bold', fontFamily: 'var(--font-mono)'
          }}>
            <Clock size={16} color={timeLeft <= 300 ? 'var(--accent-red)' : 'var(--accent-cyan)'} />
            {formatTime(timeLeft)}
          </div>

          {countdown > 0 ? (
            <div style={{ color: 'var(--accent-red)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="loader" style={{ width: '16px', height: '16px', borderTopColor: 'var(--accent-red)' }}></span>
              SECURITY INITIALIZING IN: {countdown}s
            </div>
          ) : (
            <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldIcon /> SECURITY ACTIVE
            </div>
          )}
          
          <div className="status-badge status-active">
            {team?.teamId}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="challenge-container">
          
          {/* Left Panel - Question */}
          <div className="panel-left">
            <div style={{ marginBottom: '10px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              QUESTION {question?.id}
            </div>
            <h2 className="heading-secondary" style={{ fontSize: '2rem' }}>{question?.title}</h2>
            
            <div className="glass-panel" style={{ padding: '20px', marginTop: '30px', marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Description</h4>
              <p style={{ lineHeight: '1.6' }}>{question?.description}</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px', flex: 1 }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Input Format</h4>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{question?.inputFormat}</p>
              </div>
              <div className="glass-panel" style={{ padding: '20px', flex: 1 }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Output Format</h4>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{question?.outputFormat}</p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Constraints</h4>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{question?.constraints}</p>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sample Input</h4>
              <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{question?.sampleInput}</pre>
              
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '10px', marginTop: '20px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sample Output</h4>
              <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{question?.sampleOutput}</pre>
            </div>
          </div>

          {/* Right Panel - Editor & Output */}
          <div className="panel-right">
            
            {/* Language Selector */}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
               <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Language:</span>
               <select 
                 value={language} 
                 onChange={(e) => setLanguage(e.target.value)}
                 style={{ 
                   background: 'rgba(0,0,0,0.5)', 
                   color: 'white', 
                   border: '1px solid var(--accent-cyan)', 
                   padding: '5px 10px', 
                   borderRadius: '4px',
                   fontFamily: 'var(--font-mono)'
                 }}
                 disabled={team?.status === 'SUBMITTED' || team?.status === 'COMPLETED'}
               >
                 <option value="javascript">JavaScript</option>
                 <option value="python">Python</option>
                 <option value="java">Java</option>
                 <option value="cpp">C++</option>
                 <option value="c">C</option>
               </select>
            </div>

            <div style={{ flex: runResult ? 0.6 : 1, position: 'relative', borderBottom: runResult ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <Editor
                height="100%"
                language={language}
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value)}
                options={{
                  fontSize: 16,
                  minimap: { enabled: false },
                  fontFamily: 'JetBrains Mono',
                  readOnly: team?.status === 'SUBMITTED' || team?.status === 'COMPLETED'
                }}
              />
            </div>

            {/* Output Panel */}
            {runResult && (
              <div style={{ flex: 0.4, padding: '20px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Execution Result</h4>
                
                {runResult.compilerError ? (
                  <div style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                    {runResult.compilerError}
                  </div>
                ) : (
                  <div className="output-grid">
                    {/* Sample Test Case */}
                    <div className="glass-panel" style={{ flex: 1, padding: '15px', borderColor: runResult.sampleTestPassed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        {runResult.sampleTestPassed ? <CheckCircle size={16} color="var(--accent-green)" /> : <XCircle size={16} color="var(--accent-red)" />}
                        <h5 style={{ margin: 0, color: runResult.sampleTestPassed ? 'var(--accent-green)' : 'var(--accent-red)' }}>Sample Test</h5>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Input:</span><br/>
                          <span style={{ color: 'white', whiteSpace: 'pre-wrap' }}>{question?.sampleInput}</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Expected Output:</span><br/>
                          <span style={{ color: 'white', whiteSpace: 'pre-wrap' }}>{question?.sampleOutput}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Your Output:</span><br/>
                          <span style={{ color: runResult.sampleTestPassed ? 'var(--accent-green)' : 'var(--accent-red)', whiteSpace: 'pre-wrap' }}>
                            {runResult.sampleOutputStr || 'No output'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hidden Test Case */}
                    <div className="glass-panel" style={{ flex: 1, padding: '15px', borderColor: runResult.hiddenTestPassed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        {runResult.hiddenTestPassed ? <CheckCircle size={16} color="var(--accent-green)" /> : <XCircle size={16} color="var(--accent-red)" />}
                        <h5 style={{ margin: 0, color: runResult.hiddenTestPassed ? 'var(--accent-green)' : 'var(--accent-red)' }}>Hidden Test</h5>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Input:</span><br/>
                          <span style={{ color: 'white', fontStyle: 'italic' }}>Hidden</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Expected Output:</span><br/>
                          <span style={{ color: 'white', fontStyle: 'italic' }}>Hidden</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Your Output:</span><br/>
                          <span style={{ color: runResult.hiddenTestPassed ? 'var(--accent-green)' : 'var(--accent-red)', whiteSpace: 'pre-wrap' }}>
                            {runResult.hiddenOutputStr || (runResult.hiddenTestPassed ? 'Passed' : 'Failed')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Status: <span style={{ color: team?.status === 'SUBMITTED' ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>{team?.status}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  className="btn" 
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleRun}
                  disabled={team?.status === 'SUBMITTED' || team?.status === 'COMPLETED' || isRunning}
                >
                  {isRunning ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : <Play size={18} />} 
                  RUN CODE
                </button>

                <button 
                  className={`btn ${team?.status === 'SUBMITTED' ? 'btn-success' : 'btn-primary'}`} 
                  onClick={handleSubmit}
                  disabled={team?.status === 'SUBMITTED' || team?.status === 'COMPLETED'}
                >
                  {team?.status === 'SUBMITTED' ? 'SUBMISSION RECEIVED' : (
                    <><Send size={18} /> SUBMIT ANSWER</>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
    </div>
  );
};

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export default Challenge;
