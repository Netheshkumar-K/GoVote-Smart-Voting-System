// Simple mocked local database to demonstrate full flow without Spring Boot backend
const INITIAL_ELECTIONS = [];

export const getElections = () => {
  const data = localStorage.getItem('govote_elections');
  let elections = data ? JSON.parse(data) : INITIAL_ELECTIONS;
  
  // Auto-close elections algorithm
  let mutated = false;
  const now = Date.now();
  elections = elections.map(el => {
    if (el.status === 'ACTIVE' && el.endTime && now >= el.endTime) {
      mutated = true;
      return { ...el, status: 'ENDED' };
    }
    return el;
  });
  
  if (mutated || !data) {
    localStorage.setItem('govote_elections', JSON.stringify(elections));
  }
  
  return elections;
};

export const checkHasVoted = (electionId, role, email, phone) => {
  const votedKeys = JSON.parse(localStorage.getItem('govote_votes') || '{}');
  const userKey = `${electionId}_${role}_${email}_${phone}`;
  return !!votedKeys[userKey];
};

export const castVote = (electionId, candidateId, role, email, phone) => {
  if (checkHasVoted(electionId, role, email, phone)) {
      throw new Error(`You have already cast your vote for the role of ${role}!`);
  }

  const elections = getElections();
  const updatedElections = elections.map(election => {
    if (election.id === electionId && election.status === 'ACTIVE') {
      return {
        ...election,
        candidates: election.candidates.map(candidate => {
          if (candidate.id === candidateId) {
            return { ...candidate, votes: (candidate.votes || 0) + 1 };
          }
          return candidate;
        })
      };
    }
    return election;
  });
  
  localStorage.setItem('govote_elections', JSON.stringify(updatedElections));
  
  const votedKeys = JSON.parse(localStorage.getItem('govote_votes') || '{}');
  const userKey = `${electionId}_${role}_${email}_${phone}`;
  votedKeys[userKey] = true;
  localStorage.setItem('govote_votes', JSON.stringify(votedKeys));
};

export const addElection = (title, durationMinutes) => {
  const elections = getElections();
  const startTime = Date.now();
  const newElection = {
    id: startTime,
    title,
    status: 'ACTIVE',
    startTime: startTime,
    endTime: startTime + durationMinutes * 60000,
    candidates: []
  };
  localStorage.setItem('govote_elections', JSON.stringify([...elections, newElection]));
};

export const addCandidate = (electionId, name, role) => {
  const elections = getElections();
  const updatedElections = elections.map(el => {
    if (el.id === electionId) {
      return {
        ...el,
        candidates: [...el.candidates, { id: Date.now(), name, role: role || 'Member', votes: 0 }]
      };
    }
    return el;
  });
  localStorage.setItem('govote_elections', JSON.stringify(updatedElections));
};

export const endElection = (electionId) => {
  const elections = getElections();
  const updatedElections = elections.map(el => {
    if (el.id === electionId) {
      return { ...el, status: 'ENDED', endTime: Date.now() }; // force end
    }
    return el;
  });
  localStorage.setItem('govote_elections', JSON.stringify(updatedElections));
};
