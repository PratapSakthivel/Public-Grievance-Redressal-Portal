package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "complaint_updates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "old_status", columnDefinition = "status")
    private Status oldStatus;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "new_status", columnDefinition = "status", nullable = false)
    private Status newStatus;

    @Column(columnDefinition = "text")
    private String remarks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
