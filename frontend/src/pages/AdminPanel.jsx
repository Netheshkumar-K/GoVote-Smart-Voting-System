import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Search } from 'lucide-react';

const AdminPanel = () => {
  const [newElectionTitle, setNewElectionTitle] = useState('');
  const [candidateName, setCandidateName] = useState('');

  // Mock data generator for testing UI offline
  const [elections, setElections] = useState([
    {
      id: 1, title: 'Presidential Election 2026', status: 'ACTIVE',
      candidates: [{ id: 101, name: 'Alice Smith' }, { id: 102, name: 'Bob Johnson' }]
    }
  ]);

  const handleCreateElection = (e) => {
    e.preventDefault();
    if (!newElectionTitle) return;

    const newElection = {
      id: Date.now(),
      title: newElectionTitle,
      status: 'ACTIVE',
      candidates: []
    };
    
    // In production: await axios.post('/api/elections', { title: newElectionTitle })
    setElections([...elections, newElection]);
    setNewElectionTitle('');
  };

  const handleAddCandidate = (e, electionId) => {
    e.preventDefault();
    if (!candidateName) return;

    // In production: await axios.post(`/api/elections/${electionId}/candidates`, { name: candidateName })
    setElections(elections.map(el => {
      if (el.id === electionId) {
        return {
          ...el,
          candidates: [...el.candidates, { id: Date.now(), name: candidateName }]
        };
      }
      return el;
    }));
    setCandidateName('');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Admin Control Panel</h2>
          <p className="text-secondary">Manage elections, candidates, and system status.</p>
        </div>
      </div>

      <div className="grid grid-cols-3">
        <div className="card col-span-1" style={{ height: 'fit-content' }}>
          <h3>Create New Election</h3>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
          <form onSubmit={handleCreateElection}>
            <div className="form-group">
              <label className="form-label" htmlFor="electionTitle">Election Title</label>
              <input
                type="text"
                id="electionTitle"
                className="form-control"
                placeholder="e.g. Board of Directors 2026"
                value={newElectionTitle}
                onChange={(e) => setNewElectionTitle(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              <PlusCircle size={18} /> Create Election
            </button>
          </form>
        </div>

        <div className="col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {elections.map(election => (
            <div key={election.id} className="card">
              <div className="election-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span className={`election-status ${election.status === 'ACTIVE' ? 'status-active' : 'status-ended'}`}>
                    {election.status}
                  </span>
                  <h3 style={{ marginTop: '0.5rem' }}>{election.title}</h3>
                </div>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', height: 'fit-content' }}>
                  End Election
                </button>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Candidates</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {election.candidates.map(candidate => (
                    <div key={candidate.id} style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      {candidate.name}
                    </div>
                  ))}
                  {election.candidates.length === 0 && (
                    <div className="text-secondary" style={{ fontStyle: 'italic', fontSize: '0.875rem' }}>No candidates added yet.</div>
                  )}
                </div>

                <form onSubmit={(e) => handleAddCandidate(e, election.id)} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Candidate Name"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-secondary">Add Candidate</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
