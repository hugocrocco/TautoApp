package cl.humboldt.credencial.model.member;

import java.time.LocalDate;

public class MemberResponse {
    private Long id;
    private String rut;
    private String nombreCompleto;
    private String email;
    private String telefono;
    private String estadoSindicato;
    private Boolean alDiaCuotas;
    private LocalDate ultimaCuotaPagada;

    public MemberResponse() {}

    public MemberResponse(Long id, String rut, String nombreCompleto, String email, String telefono,
                          String estadoSindicato, Boolean alDiaCuotas, LocalDate ultimaCuotaPagada) {
        this.id = id;
        this.rut = rut;
        this.nombreCompleto = nombreCompleto;
        this.email = email;
        this.telefono = telefono;
        this.estadoSindicato = estadoSindicato;
        this.alDiaCuotas = alDiaCuotas;
        this.ultimaCuotaPagada = ultimaCuotaPagada;
    }

    public Long getId() { return id; }
    public String getRut() { return rut; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getEmail() { return email; }
    public String getTelefono() { return telefono; }
    public String getEstadoSindicato() { return estadoSindicato; }
    public Boolean getAlDiaCuotas() { return alDiaCuotas; }
    public LocalDate getUltimaCuotaPagada() { return ultimaCuotaPagada; }

    public void setId(Long id) { this.id = id; }
    public void setRut(String rut) { this.rut = rut; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public void setEmail(String email) { this.email = email; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public void setEstadoSindicato(String estadoSindicato) { this.estadoSindicato = estadoSindicato; }
    public void setAlDiaCuotas(Boolean alDiaCuotas) { this.alDiaCuotas = alDiaCuotas; }
    public void setUltimaCuotaPagada(LocalDate ultimaCuotaPagada) { this.ultimaCuotaPagada = ultimaCuotaPagada; }
}