package uk.ac.uclan.sis.sis_backend.classes.dto;

public class EmailParentsResponse {

    private int recipientsCount;

    public EmailParentsResponse() {}

    public EmailParentsResponse(int recipientsCount) {
        this.recipientsCount = recipientsCount;
    }

    public int getRecipientsCount() {
        return recipientsCount;
    }
}
