package cl.humboldt.credencial.model.auth;

public class RegisterResponse {

    private Long id;
    private String rut;
    private String nombreCompleto;
    private String email;

    public RegisterResponse() {}

    public RegisterResponse(Long id, String rut, String nombreCompleto, String email) {
        this.id = id;
        this.rut = rut;
        this.nombreCompleto = nombreCompleto;
        this.email = email;
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

    public String getEmail() {
        return email;
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

    public void setEmail(String email) {
        this.email = email;
    }
}