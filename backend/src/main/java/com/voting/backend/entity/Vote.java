package com.voting.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "votes",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "election_id"}) // CORE REQUIREMENT: Defense in depth DB level uniqueness!
    }
)
public class Vote {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "election_id", nullable = false)
    private Long electionId;
    
    @Column(name = "candidate_id", nullable = false)
    private Long candidateId;
    
    @Column(name = "cast_at", nullable = false)
    private LocalDateTime castAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }
    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
    public LocalDateTime getCastAt() { return castAt; }
    public void setCastAt(LocalDateTime castAt) { this.castAt = castAt; }
}
