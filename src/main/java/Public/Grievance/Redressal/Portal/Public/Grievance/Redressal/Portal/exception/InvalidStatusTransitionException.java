package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;

public class InvalidStatusTransitionException extends RuntimeException {
    public InvalidStatusTransitionException(Status from, Status to) {
        super("Cannot transition from " + from + " to " + to + ". Invalid status transition.");
    }
}
