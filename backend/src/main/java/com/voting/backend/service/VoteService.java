package com.voting.backend.service;

import com.voting.backend.entity.Vote;
import com.voting.backend.repository.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class VoteService {

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    /**
     * Core voting logic enforcing "one vote per user" rule.
     * 1. Redis distributed lock (prevents race conditions)
     * 2. DB uniqueness check via Application Layer (throws exception)
     * 3. (Fallback) DB schema UNIQUE constraint
     */
    @Transactional
    public Vote castVote(Long userId, Long electionId, Long candidateId) throws Exception {
        String lockKey = "vote:" + userId + ":" + electionId;
        
        // 1. Redis distributed lock (TTL 5 seconds)
        Boolean acquiredLock = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", Duration.ofSeconds(5));
        
        if (Boolean.FALSE.equals(acquiredLock)) {
            throw new Exception("DuplicateVoteException: Vote request is already being processed.");
        }

        try {
            // 2. Application Layer uniqueness check
            if (voteRepository.existsByUserIdAndElectionId(userId, electionId)) {
                throw new Exception("DuplicateVoteException: You have already voted in this election.");
            }

            // Save the vote
            Vote vote = new Vote();
            // In a real application, fetch User by ID first
            // vote.setUser(user);
            vote.setElectionId(electionId);
            vote.setCandidateId(candidateId);
            vote.setCastAt(LocalDateTime.now());
            
            Vote savedVote = voteRepository.save(vote);
            
            // 4. Publish Event to RabbitMQ for real-time SSE chart updates
            publishVoteEventToQueue(electionId, candidateId);
            
            return savedVote;

        } finally {
            // Release the lock after processing
            redisTemplate.delete(lockKey);
        }
    }
    
    private void publishVoteEventToQueue(Long electionId, Long candidateId) {
        // Here we would push "VOTE_CAST" message to RabbitMQ.
        // Another service listens to this, tallies it in Redis, and pushes it up to the React UI via Server-Sent Events (SSE).
        // Example: rabbitTemplate.convertAndSend("vote-exchange", "", "Vote for " + candidateId);
    }
}
