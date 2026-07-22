package cl.humboldt.credencial.model.auth;

public class LoginResponse {

    private Long id;
    private String rut;
    private String nombreCompleto;
    private String role;

    public LoginResponse() {}

    public LoginResponse(Long id, String rut, String nombreCompleto, String role) {
        this.id = id;
        this.rut = rut;
        this.nombreCompleto = nombreCompleto;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getRut() {
        return rut;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public String getRole() {
        return role;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public void setRole(String role) {
        this.role = role;
    }
}