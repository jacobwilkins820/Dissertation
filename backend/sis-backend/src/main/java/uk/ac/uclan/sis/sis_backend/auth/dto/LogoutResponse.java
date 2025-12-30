package uk.ac.uclan.sis.sis_backend.auth.dto;

public class LogoutResponse {

    private final String confirm;


    public LogoutResponse(String confirm) {
        this.confirm = confirm;
    }

    public String getConfirm() { return confirm; }

}