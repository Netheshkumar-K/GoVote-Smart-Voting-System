import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Mock data generator for testing UI offline
const generateMockElections = () => [
  {
    id: 1, title: 'Presidential Election 2026', status: 'ACTIVE',
    candidates: [{ id: 101, name: 'Alice Smith' }, { id: 102, name: 'Bob Johnson' }]
  },
  {
    id: 2, title: 'Student Council President', status: 'ENDED',
    candidates: [{ id: 201, name: 'Charlie Dave' }, { id: 202, name: 'Eve Carter' }]
  }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [resultsByElection, setResultsByElection] = useState({});
  const [hasVoted, setHasVoted] = useState({});

  // In a real app, you'd fetch this from /api/elections
  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      // try {
      //   const res = await axios.get('/api/elections');
      //   return res.data;
      // } catch (e) { console.error(e); }
      return generateMockElections();
    }
  });

  // Mock SSE connection for real-time results
  useEffect(() => {
    // In production: const eventSource = new EventSource('/api/results/stream');
    // For demo purposes, we will mock updates
    const interval = setInterval(() => {
      setResultsByElection(prev => {
        // Randomly bump votes for an active election demo
        return {
          ...prev,
          1: {
            101: (prev[1]?.[101] || 0) + Math.floor(Math.random() * 2),
            102: (prev[1]?.[102] || 0) + Math.floor(Math.random() * 2)
          }
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (electionId, candidateId) => {
    if (hasVoted[electionId]) return;
    
    // In production:
    // await axios.post('/api/votes', { electionId, candidateId });
    // This will hit the Spring Boot logic ensuring 1 vote per user via DB Constraints & Redis Locks
    
    setHasVoted(prev => ({ ...prev, [electionId]: true }));
    // Optimistic UI update
    setResultsByElection(prev => ({
      ...prev,
      [electionId]: {
        ...prev[electionId],
        [candidateId]: (prev[electionId]?.[candidateId] || 0) + 1
      }
    }));
  };

  if (isLoading) return <div className="animate-fade-in">Loading elections...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2>Active Elections</h2>
        <p className="text-secondary">Cast your vote. Remember, you can only vote once per election!</p>
      </div>

      <div className="grid grid-cols-2">
        {elections?.map(election => (
          <div key={election.id} className="card election-card">
            <div className="election-header">
              <span className={`election-status ${election.status === 'ACTIVE' ? 'status-active' : 'status-ended'}`}>
                {election.status}
              </span>
              <h3>{election.title}</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {election.candidates.map(candidate => {
                const votes = resultsByElection[election.id]?.[candidate.id] || 0;
                const totalVotes = Object.values(resultsByElection[election.id] || {}).reduce((a, b) => a + b, 0) || 1; // avoid /0
                const percent = Math.min(100, Math.round((votes / totalVotes) * 100));

                return (
                  <div key={candidate.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '500' }}>{candidate.name}</span>
                      <span className="text-secondary">{percent}% ({votes} votes)</span>
                    </div>
                    {election.status === 'ACTIVE' && !hasVoted[election.id] && (
                      <button 
                        className="btn btn-primary btn-block" 
                        style={{ marginTop: '0.5rem', padding: '0.5rem' }}
                        onClick={() => handleVote(election.id, candidate.id)}
                      >
                        Vote for {candidate.name}
                      </button>
                    )}
                    {hasVoted[election.id] && election.status === 'ACTIVE' && (
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${percent}%` }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="election-footer">
              <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                {hasVoted[election.id] ? '✓ You have voted in this election' : 'You have not voted yet'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
