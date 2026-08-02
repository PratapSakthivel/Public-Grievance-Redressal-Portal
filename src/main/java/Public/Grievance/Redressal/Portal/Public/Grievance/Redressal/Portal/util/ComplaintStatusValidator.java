package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.util;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.InvalidStatusTransitionException;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Enforces the complaint status state machine:
 *
 *   FILED       → ASSIGNED
 *   ASSIGNED    → IN_PROGRESS
 *   IN_PROGRESS → RESOLVED
 *   RESOLVED    → REOPENED
 *   RESOLVED    → CLOSED
 *   REOPENED    → ASSIGNED
 */
@Component
public class ComplaintStatusValidator {

    private static final Map<Status, Set<Status>> VALID_TRANSITIONS = new EnumMap<>(Status.class);

    static {
        VALID_TRANSITIONS.put(Status.FILED,       EnumSet.of(Status.ASSIGNED));
        VALID_TRANSITIONS.put(Status.ASSIGNED,    EnumSet.of(Status.IN_PROGRESS));
        VALID_TRANSITIONS.put(Status.IN_PROGRESS, EnumSet.of(Status.RESOLVED));
        VALID_TRANSITIONS.put(Status.RESOLVED,    EnumSet.of(Status.REOPENED, Status.CLOSED));
        VALID_TRANSITIONS.put(Status.REOPENED,    EnumSet.of(Status.ASSIGNED));
        VALID_TRANSITIONS.put(Status.CLOSED,      EnumSet.noneOf(Status.class)); // terminal state
    }

    public void validate(Status from, Status to) {
        Set<Status> allowed = VALID_TRANSITIONS.getOrDefault(from, EnumSet.noneOf(Status.class));
        if (!allowed.contains(to)) {
            throw new InvalidStatusTransitionException(from, to);
        }
    }

    public boolean isValidTransition(Status from, Status to) {
        return VALID_TRANSITIONS.getOrDefault(from, EnumSet.noneOf(Status.class)).contains(to);
    }
}
