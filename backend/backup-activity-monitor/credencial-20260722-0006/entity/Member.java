package cl.humboldt.credencial.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String rut;

    @Column(nullable = false, length = 120)
    private String nombreCompleto;

    @Column(length = 120)
    private String email;

    @Column(length = 30)
    private String telefono;

    @Column(length = 20)
    private String estadoSindicato; // ACTIVO / SUSPENDIDO / RETIRADO

    private Boolean alDiaCuotas;

    private LocalDate ultimaCuotaPagada;

    public Long getId() { return id; }
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

    public LocalDate getUltimaCuotaPagada() { return ultimaCuotaPagada; }
    public void setUltimaCuotaPagada(LocalDate ultimaCuotaPagada) { this.ultimaCuotaPagada = ultimaCuotaPagada; }
}