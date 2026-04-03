import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Download } from 'lucide-react';
import { getElections, addElection, addCandidate, endElection } from '../mockData';
import emailjs from '@emailjs/browser';

const AdminPanel = () => {
  const [authStep, setAuthStep] = useState(1);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminOtpInput, setAdminOtpInput] = useState('');
  const [sentAdminOtp, setSentAdminOtp] = useState('');
  
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const [newElectionTitle, setNewElectionTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [candidateNameMap, setCandidateNameMap] = useState({});
  const [candidateRoleMap, setCandidateRoleMap] = useState({});
  const queryClient = useQueryClient();

  // Admin Double Authentication using EmailJS
  const requestAdminAccess = (e) => {
    e.preventDefault();
    if (!adminName || !adminEmail) return setAdminError("Name and Admin Email are required.");
    setAdminError('');
    setAdminLoading(true);

    setTimeout(async () => {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSentAdminOtp(generatedOtp);

      try {
        await emailjs.send(
          'service_tz7doac',
          'template_omqtvnl',
          {
            email: adminEmail,
            passcode: generatedOtp
          },
          'Y1xrAkRxO0qvulxk1'
        );
        console.log(`📡 [ADMIN DISPATCH]: OTP sent gracefully via EmailJS to ${adminEmail}`);
      } catch (err) {
        console.error('[EMAILJS ERROR]:', err);
        alert('Failed to send real email. Check keys.');
      }

      setAuthStep(2);
      setAdminLoading(false);
    }, 1000);
  };

  const handleAdminVerify = (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    if (adminOtpInput === sentAdminOtp) {
      setIsUnlocked(true);
    } else {
      setAdminError("Invalid Admin OTP Token. Access Denied.");
      setAdminLoading(false);
    }
  };

  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => getElections(),
    refetchInterval: 2000 // Poll to auto-close and see live votes
  });

  const handleCreateElection = (e) => {
    e.preventDefault();
    if (!newElectionTitle || durationMinutes < 180 || durationMinutes > 720) {
      alert("Duration must be between 180 and 720 minutes.");
      return;
    }
    addElection(newElectionTitle, durationMinutes);
    setNewElectionTitle('');
    setDurationMinutes(180);
    queryClient.invalidateQueries(['elections']);
  };

  const handleAddCandidate = (e, electionId) => {
    e.preventDefault();
    const candidateName = candidateNameMap[electionId];
    const candidateRole = candidateRoleMap[electionId];
    if (!candidateName) return;
    
    addCandidate(electionId, candidateName, candidateRole);
    setCandidateNameMap({ ...candidateNameMap, [electionId]: '' });
    setCandidateRoleMap({ ...candidateRoleMap, [electionId]: '' });
    queryClient.invalidateQueries(['elections']);
  };

  const handleEndElection = (electionId) => {
    endElection(electionId);
    queryClient.invalidateQueries(['elections']);
  };

  const handleDownloadResults = (election) => {
    // Determine winner(s) per role and total votes
    let totalVotes = 0;
    const roleStats = {};

    election.candidates.forEach(c => {
      const v = c.votes || 0;
      totalVotes += v;
      const role = c.role || 'Member';
      if (!roleStats[role]) roleStats[role] = { maxVotes: -1, winners: [], candidates: 0 };
      
      roleStats[role].candidates += 1;
      if (v > roleStats[role].maxVotes) {
        roleStats[role].maxVotes = v;
        roleStats[role].winners = [c];
      } else if (v === roleStats[role].maxVotes) {
        roleStats[role].winners.push(c);
      }
    });

    const uniqueRoles = Object.keys(roleStats).join(', ');
    const displayWinners = Object.entries(roleStats).map(([r, stats]) => {
      return `${r}: ${stats.winners.map(w => w.name).join(' & ')} (${stats.maxVotes} votes)`;
    }).join('<br>');
    
    // Generate Beautiful HTML Document for Printing
    const downloadTime = new Date().toLocaleString();
    const openTime = election.startTime ? new Date(election.startTime).toLocaleString() : 'N/A';
    const closeTime = election.endTime ? new Date(election.endTime).toLocaleString() : 'N/A';
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Election Results - ${election.title}</title>
        <style>
          body { font-family: 'Inter', Helvetica, Arial, sans-serif; color: #0f172a; padding: 20px; margin: 0 auto; max-width: 800px; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 15px; }
          .title { color: #0ea5e9; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 13px; color: #475569; margin-top: 2px; }
          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; font-size: 12px; color: #334155; }
          .grid-info div { background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; }
          th { background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 8px 10px; text-align: left; font-weight: 600; color: #475569; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .winner-banner { background-color: #ecfdf5; border: 2px dashed #10b981; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
          .winner-label { color: #059669; font-weight: bold; font-size: 16px; margin: 0 0 5px 0; letter-spacing: 1px; text-transform: uppercase; }
          .winner-names { font-size: 14px; color: #047857; margin: 0; font-weight: bold; line-height: 1.5; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #94a3b8; }
          .print-btn { display: block; width: 100%; padding: 10px; background: #0ea5e9; color: white; border: none; font-size: 14px; font-weight: bold; cursor: pointer; border-radius: 8px; margin-bottom: 10px; }
          .print-btn:hover { background: #0284c7; }
          @media print {
            body { padding: 0; margin: 0; height: 100vh; overflow: hidden; page-break-inside: avoid; }
            .no-print { display: none !important; }
            .winner-banner { border: 2px solid #10b981; }
            @page { margin: 0.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="print-btn" onclick="window.print()">🖨️ Print Official Certificate</button>
        </div>
        
        <div class="header">
          <p style="margin:0; font-weight: bold; color:#94a3b8; letter-spacing:3px;">OFFICIAL REPORT</p>
          <h1 class="title">${election.title}</h1>
          <p class="subtitle">Securely Managed by GoVote System</p>
        </div>
        
        <div class="grid-info">
          <div><strong>Election Name:</strong><br>${election.title}</div>
          <div><strong>Category Types (Roles):</strong><br>${uniqueRoles || 'None'}</div>
          <div><strong>Date Open Time:</strong><br>${openTime}</div>
          <div><strong>Closing Time:</strong><br>${closeTime}</div>
          <div><strong>Bill Download Time:</strong><br>${downloadTime}</div>
          <div><strong>Total System Votes:</strong><br>${totalVotes.toLocaleString()} Votes</div>
        </div>
        
        <div class="winner-banner">
          <p class="winner-label">🏆 Officially Elected Winners Breakdown</p>
          <div class="winner-names">${displayWinners || 'No votes cast'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Category (Role)</th>
              <th style="text-align: right;">Total Votes Recieved</th>
            </tr>
          </thead>
          <tbody>
    `;

    election.candidates.forEach(c => {
      const v = c.votes || 0;
      const roleObj = roleStats[c.role || 'Member'];
      const isWinner = roleObj && roleObj.winners.find(w => w.id === c.id);
      
      htmlContent += `
        <tr>
          <td style="font-weight: ${isWinner ? 'bold' : 'normal'}">${c.name} ${isWinner ? '⭐' : ''}</td>
          <td>${c.role || 'Member'}</td>
          <td style="text-align: right; color: ${isWinner ? '#10b981' : 'inherit'}; font-weight: ${isWinner ? 'bold' : 'normal'};">${v.toLocaleString()}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        
        <div class="summary">
          Total Votes Cast Across Platform: ${totalVotes.toLocaleString()}
        </div>
        
        <div class="footer">
          Document generated mathematically by Smart Voting System.<br>
          Verification Signature: ${Math.random().toString(36).substring(2, 15).toUpperCase()}
        </div>
        
        <script>
          // Auto-trigger print prompt when opened
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Election_Invoice_${election.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div>Loading Admin Panel...</div>;

  if (!isUnlocked) {
    return (
      <div className="auth-container animate-fade-in">
        <div className="card text-center">
          <h2 style={{ marginBottom: '1rem', color: 'var(--danger-color)' }}>Admin Verification Required</h2>
          <p className="text-secondary" style={{ marginBottom: '2rem' }}>
            To manage or create elections, please verify your Administrative credentials via physical OTP Email.
          </p>
          
          {adminError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{adminError}</div>}
          
          {authStep === 1 ? (
            <form onSubmit={requestAdminAccess}>
              <div className="form-group text-left" style={{ textAlign: 'left' }}>
                <label className="form-label" htmlFor="admin-name">Admin Name</label>
                <input
                  type="text"
                  id="admin-name"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group text-left" style={{ textAlign: 'left' }}>
                <label className="form-label" htmlFor="admin-email">Admin Email Address</label>
                <input
                  type="email"
                  id="admin-email"
                  className="form-control"
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-block" disabled={adminLoading}>
                {adminLoading ? 'Requesting Clearance...' : 'Request Admin Access OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminVerify}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter 6-digit Admin OTP"
                  maxLength="6"
                  value={adminOtpInput}
                  onChange={(e) => setAdminOtpInput(e.target.value)}
                  style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={adminLoading}>
                 {adminLoading ? 'Verifying...' : 'Verify Identity & Unlock Admin Controls'}
              </button>
              <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: '0.5rem' }} onClick={() => setAuthStep(1)} disabled={adminLoading}>Back</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Admin Control Panel</h2>
          <p className="text-secondary">Manage elections, set duration periods, and download official results.</p>
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
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="duration">Voting Period (Minutes, 180 - 720)</label>
              <input
                type="number"
                id="duration"
                className="form-control"
                min="180"
                max="720"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              <PlusCircle size={18} /> Create Election
            </button>
          </form>
        </div>

        <div className="col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {elections?.map(election => {
            const totalVotes = election.candidates.reduce((acc, curr) => acc + (curr.votes || 0), 0);
            
            // Time left logic
            let timeLeftStr = "";
            if (election.status === 'ACTIVE' && election.endTime) {
              const diffMs = election.endTime - Date.now();
              if (diffMs > 0) {
                const mins = Math.floor(diffMs / 60000);
                const secs = Math.floor((diffMs % 60000) / 1000);
                timeLeftStr = ` (Closes in ${mins}m ${secs}s)`;
              }
            }

            return (
              <div key={election.id} className="card">
                <div className="election-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className={`election-status ${election.status === 'ACTIVE' ? 'status-active' : 'status-ended'}`}>
                      {election.status} {timeLeftStr}
                    </span>
                    <h3 style={{ marginTop: '0.5rem' }}>{election.title}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Total System Votes: {totalVotes}</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {election.status === 'ACTIVE' ? (
                      <button className="btn btn-danger" onClick={() => handleEndElection(election.id)} style={{ padding: '0.4rem 1rem', height: 'fit-content' }}>
                        Force End
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={() => handleDownloadResults(election)} style={{ padding: '0.4rem 1rem', height: 'fit-content', backgroundColor: 'var(--success-color)' }}>
                        <Download size={16} /> Download
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Candidates & Live Tallies</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {election.candidates.map(candidate => (
                      <div key={candidate.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '500' }}>{candidate.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{candidate.role || 'Member'}</span>
                        </div>
                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{candidate.votes || 0} Votes</span>
                      </div>
                    ))}
                    {election.candidates.length === 0 && (
                      <div className="text-secondary" style={{ fontStyle: 'italic', fontSize: '0.875rem' }}>No candidates added yet.</div>
                    )}
                  </div>

                  {election.status === 'ACTIVE' && (
                    <form onSubmit={(e) => handleAddCandidate(e, election.id)} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Candidate Name"
                        value={candidateNameMap[election.id] || ''}
                        onChange={(e) => setCandidateNameMap({ ...candidateNameMap, [election.id]: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Role (e.g. President)"
                        value={candidateRoleMap[election.id] || ''}
                        onChange={(e) => setCandidateRoleMap({ ...candidateRoleMap, [election.id]: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <button type="submit" className="btn btn-secondary">Add Candidate</button>
                    </form>
                  )}
                </div>
              </div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
