package cl.humboldt.credencial.model.member;

public class MemberUpsertRequest {
    private String rut;
    private String nombreCompleto;
    private String email;
    private String telefono;

    // "ACTIVO" / "SUSPENDIDO" / "RETIRADO"
    private String estadoSindicato;

    private Boolean alDiaCuotas;

    // ISO: "2026-03-01" (opcional)
    private String ultimaCuotaPagada;

    public MemberUpsertRequest() {}

    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEstadoSindicato() { return estadoSindicato; }
    public void setEstadoSindicato(String estadoSindicato) { this.estadoSindicato = estadoSindicato; }

    public Boolean getAlDiaCuotas() { return alDiaCuotas; }
    public void setAlDiaCuotas(Boolean alDiaCuotas) { this.alDiaCuotas = alDiaCuotas; }

    public String getUltimaCuotaPagada() { return ultimaCuotaPagada; }
    public void setUltimaCuotaPagada(String ultimaCuotaPagada) { this.ultimaCuotaPagada = ultimaCuotaPagada; }
}