import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Activity, Users, AlertTriangle, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const navigate = useNavigate();

  // Polling for live updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const resTeams = await api.get('/admin/teams');
      setTeams(resTeams.data);
      
      const resQuestions = await api.get('/admin/questions');
      setQuestions(resQuestions.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("WARNING: This will remove all participant assignments, submissions, login records, violations and results. This action cannot be undone.")) {
      try {
        await api.post('/admin/reset');
        fetchData();
        alert('Event reset successfully.');
      } catch (err) {
        alert('Failed to reset event.');
      }
    }
  };

  const handleResetTeam = async (teamId) => {
    if (window.confirm(`WARNING: This will reset all progress, submissions, and violations for team ${teamId}. Proceed?`)) {
      try {
        await api.post(`/admin/reset/${teamId}`);
        fetchData();
        alert(`Team ${teamId} reset successfully.`);
      } catch (err) {
        alert(`Failed to reset team ${teamId}.`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin-login');
  };

  const stats = {
    total: teams.length,
    loggedIn: teams.filter(t => t.loginTime).length,
    active: teams.filter(t => t.status === 'ACTIVE').length,
    submitted: teams.filter(t => t.status === 'SUBMITTED' || t.status === 'COMPLETED').length,
    disqualified: teams.filter(t => t.status === 'DISQUALIFIED').length,
    notStarted: teams.filter(t => t.status === 'NOT_STARTED').length
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column' }}>
        <span className="loader" style={{ width: '40px', height: '40px', marginBottom: '20px' }}></span>
        <h2 className="heading-secondary text-cyan">LOADING CONTROL CENTER...</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '250px', borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRadius: 0, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '1px' }}>CODE THE OUTPUT</h2>
          <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '5px' }}>CONTROL CENTER</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <SidebarBtn active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<Activity size={18} />} label="Dashboard" />
          <SidebarBtn active={activeTab === 'TEAMS'} onClick={() => setActiveTab('TEAMS')} icon={<Users size={18} />} label="Teams" />
          <SidebarBtn active={activeTab === 'QUESTIONS'} onClick={() => setActiveTab('QUESTIONS')} icon={<Activity size={18} />} label="Questions" />
        </div>
        
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn btn-danger" onClick={handleReset} style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}>
            <AlertTriangle size={14} /> EVENT RESET
          </button>
          <button className="btn" onClick={handleLogout} style={{ width: '100%', fontSize: '0.8rem', padding: '8px', color: 'var(--text-muted)' }}>
            <LogOut size={14} /> LOGOUT
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 className="heading-secondary" style={{ margin: 0 }}>{activeTab}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-green)', fontSize: '0.9rem', fontWeight: 'bold' }}>
            <span className="loader" style={{ width: '12px', height: '12px', borderTopColor: 'var(--accent-green)' }}></span> LIVE
          </div>
        </div>

        {activeTab === 'DASHBOARD' && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', marginBottom: '30px' }}>
              <StatCard title="TOTAL TEAMS" value={stats.total} />
              <StatCard title="LOGGED IN" value={stats.loggedIn} color="var(--text-main)" />
              <StatCard title="ACTIVE" value={stats.active} color="var(--accent-cyan)" />
              <StatCard title="SUBMITTED" value={stats.submitted} color="var(--accent-green)" />
              <StatCard title="DISQUALIFIED" value={stats.disqualified} color="var(--accent-red)" />
              <StatCard title="NOT STARTED" value={stats.notStarted} color="var(--text-muted)" />
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1rem', color: 'var(--text-muted)' }}>Event Progress: {stats.submitted} / {stats.total} Teams Completed</h3>
              
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Login</th>
                    <th>Question</th>
                    <th>Submission</th>
                    <th>Violations</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.teamId}>
                      <td style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{team.teamId}</td>
                      <td>{team.loginTime ? new Date(team.loginTime).toLocaleTimeString() : 'Offline'}</td>
                      <td>{team.questionTitle}</td>
                      <td>{team.submittedAt ? 'Submitted' : (team.status === 'NOT_STARTED' ? '—' : 'Pending')}</td>
                      <td style={{ color: team.violations.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        {team.violations.length}
                      </td>
                      <td>
                        <span className={`status-badge status-${team.status.toLowerCase()}`}>
                          {team.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-danger" onClick={() => handleResetTeam(team.teamId)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                          RESET
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'TEAMS' && (
          <div className="fade-in">
             <div className="glass-panel" style={{ padding: '20px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team ID</th>
                    <th>Assigned Question</th>
                    <th>Submissions Code Length</th>
                    <th>Last Event</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.teamId}>
                      <td style={{ fontWeight: 'bold' }}>{team.teamId}</td>
                      <td>{team.assignedQuestion ? `${team.assignedQuestion} - ${team.questionTitle}` : 'None'}</td>
                      <td>{team.answer ? `${team.answer.length} chars` : '—'}</td>
                      <td style={{ color: team.violations.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        {team.violations.length > 0 ? team.violations[team.violations.length-1].reason : 'None'}
                      </td>
                      <td>
                        <span className={`status-badge status-${team.status.toLowerCase()}`}>
                          {team.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-danger" onClick={() => handleResetTeam(team.teamId)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                          RESET
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        )}

        {activeTab === 'QUESTIONS' && (
          <div className="fade-in">
             <div className="glass-panel" style={{ padding: '20px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map(q => (
                    <tr key={q.id}>
                      <td>{q.id}</td>
                      <td>{q.title}</td>
                      <td>
                        <span style={{ color: q.active ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                          {q.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

const SidebarBtn = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '12px 16px', 
      background: active ? 'rgba(0, 240, 255, 0.1)' : 'transparent', 
      border: 'none', 
      borderRadius: '6px', 
      color: active ? 'var(--accent-cyan)' : 'var(--text-muted)', 
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: '0.9rem',
      transition: 'all 0.2s'
    }}
  >
    {icon}
    {label}
  </button>
);

const StatCard = ({ title, value, color = "var(--text-main)" }) => (
  <div className="glass-panel" style={{ padding: '15px', textAlign: 'center' }}>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>{title}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color }}>{value}</div>
  </div>
);

export default AdminDashboard;
