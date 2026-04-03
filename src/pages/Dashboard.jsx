import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Confetti from 'react-confetti';
import { getElections, castVote, checkHasVoted } from '../mockData';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b'];

const Dashboard = () => {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const queryClient = useQueryClient();

  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => getElections(),
    refetchInterval: 2000 // Poll regularly to catch election auto-closures
  });

  const handleVote = async (electionId, candidateId, role) => {
    const roleKey = role || 'Member';
    const stateKey = `${electionId}_${roleKey}`;
    
    if (checkHasVoted(electionId, roleKey, user?.email, user?.phone) || hasVoted[stateKey]) return;
    
    // Simulate DB interaction, enforced uniquely per email_phone + role
    try {
      castVote(electionId, candidateId, roleKey, user?.email, user?.phone);
      
      setHasVoted(prev => ({ ...prev, [stateKey]: true }));
      queryClient.invalidateQueries(['elections']); // Refresh data silently
      
      // Trigger celebration
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch(err) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="animate-fade-in">Loading elections...</div>;

  const activeElections = elections?.filter(e => e.status === 'ACTIVE') || [];

  return (
    <div className="animate-fade-in">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Live Voting Queue</h2>
        <p className="text-secondary">Cast your vote securely. Your choice is private.</p>
      </div>

      {activeElections.length === 0 ? (
        <div className="card text-center text-secondary" style={{ padding: '3rem' }}>
          <h3>No active elections right now</h3>
          <p>Please check back later or contact your administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2">
          {activeElections.map(election => {
            let timeLeftStr = "";
            if (election.endTime) {
              const diffMs = election.endTime - Date.now();
              if (diffMs > 0) {
                const mins = Math.floor(diffMs / 60000);
                const secs = Math.floor((diffMs % 60000) / 1000);
                timeLeftStr = ` (Closes in ${mins}m ${secs}s)`;
              }
            }

          return (
            <div key={election.id} className="card election-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="election-header">
                <span className={`election-status ${election.status === 'ACTIVE' ? 'status-active' : 'status-ended'}`}>
                  {election.status === 'ACTIVE' ? `🟢 LIVE${timeLeftStr}` : '🔴 CLOSED'}
                </span>
                <h3>{election.title}</h3>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {election.candidates.map((candidate, i) => {
                    const color = COLORS[i % COLORS.length];
                    const roleKey = candidate.role || 'Member';
                    const stateKey = `${election.id}_${roleKey}`;

                    return (
                      <div key={candidate.id} style={{ 
                        padding: '1rem', 
                        backgroundColor: 'var(--card-bg)', 
                        borderRadius: '8px',
                        borderLeft: `4px solid ${color}` 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '500', fontSize: '1.25rem' }}>{candidate.name}</span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{roleKey}</span>
                          </div>
                        </div>
                        
                        {election.status === 'ACTIVE' && !(checkHasVoted(election.id, roleKey, user?.email, user?.phone) || hasVoted[stateKey]) ? (
                          <button 
                            className="btn btn-primary btn-block" 
                            style={{ 
                              marginTop: '1rem',
                              padding: '0.5rem', 
                              backgroundColor: color, 
                              boxShadow: `0 4px 14px 0 transparent`,
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.boxShadow = `0 4px 14px 0 ${color}80`}
                            onMouseOut={(e) => e.currentTarget.style.boxShadow = `0 4px 14px 0 transparent`}
                            onClick={() => handleVote(election.id, candidate.id, roleKey)}
                          >
                            Vote for {candidate.name}
                          </button>
                        ) : (
                          election.status === 'ACTIVE' && (
                            <div style={{ marginTop: '1rem', color: 'var(--success-color)', fontWeight: 'bold', fontSize: '0.875rem' }}>
                              ✅ Voted for {roleKey}
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
