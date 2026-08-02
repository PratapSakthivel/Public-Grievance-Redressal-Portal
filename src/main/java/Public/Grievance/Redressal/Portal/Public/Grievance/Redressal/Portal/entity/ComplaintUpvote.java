package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "complaint_upvotes",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"complaint_id", "citizen_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintUpvote {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private User citizen;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
