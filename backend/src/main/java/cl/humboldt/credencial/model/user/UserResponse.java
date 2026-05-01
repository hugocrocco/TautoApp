package cl.humboldt.credencial.model.user;

public class UserResponse {

    private Long id;
    private String rut;
    private String nombreCompleto;
    private String email;
    private String role;
    private String statusCuenta;

    public UserResponse() {}

    public UserResponse(Long id, String rut, String nombreCompleto, String email, String role, String statusCuenta) {
        this.id = id;
        this.rut = rut;
        this.nombreCompleto = nombreCompleto;
        this.email = email;
        this.role = role;
        this.statusCuenta = statusCuenta;
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

    public String getRole() {
        return role;
    }

    public String getStatusCuenta() {
        return statusCuenta;
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

    public void setRole(String role) {
        this.role = role;
    }

    public void setStatusCuenta(String statusCuenta) {
        this.statusCuenta = statusCuenta;
    }
}