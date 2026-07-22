package cl.humboldt.credencial.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name="members", indexes={@Index(name="idx_members_inst_rut", columnList="institucion_id,rut", unique=true)})
public class Member {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="institucion_id", nullable=false) private Long institucionId;
 @Column(nullable=false,length=20) private String rut;
 @Column(nullable=false,length=120) private String nombreCompleto;
 @Column(length=120) private String email; @Column(length=30) private String telefono;
 @Column(length=20) private String estadoSindicato; private Boolean alDiaCuotas; private LocalDate ultimaCuotaPagada;
 public Long getId(){return id;}
 public Long getInstitucionId(){return institucionId;} public void setInstitucionId(Long v){institucionId=v;}
 public String getRut(){return rut;} public void setRut(String v){rut=v;}
 public String getNombreCompleto(){return nombreCompleto;} public void setNombreCompleto(String v){nombreCompleto=v;}
 public String getEmail(){return email;} public void setEmail(String v){email=v;}
 public String getTelefono(){return telefono;} public void setTelefono(String v){telefono=v;}
 public String getEstadoSindicato(){return estadoSindicato;} public void setEstadoSindicato(String v){estadoSindicato=v;}
 public Boolean getAlDiaCuotas(){return alDiaCuotas;} public void setAlDiaCuotas(Boolean v){alDiaCuotas=v;}
 public LocalDate getUltimaCuotaPagada(){return ultimaCuotaPagada;} public void setUltimaCuotaPagada(LocalDate v){ultimaCuotaPagada=v;}
}
