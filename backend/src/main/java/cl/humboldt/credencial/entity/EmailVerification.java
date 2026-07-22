package cl.humboldt.credencial.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name="email_verifications", indexes={
 @Index(name="idx_email_ver_inst_rut",columnList="institucion_id,rut"),
 @Index(name="idx_email_ver_inst_code",columnList="institucion_id,code")})
public class EmailVerification {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="institucion_id",nullable=false) private Long institucionId;
 @Column(nullable=false,length=20) private String rut; @Column(nullable=false,length=180) private String email;
 @Column(nullable=false,length=10) private String code; @Column(nullable=false) private boolean used=false;
 @Column(nullable=false) private LocalDateTime expiresAt; private LocalDateTime createdAt; private LocalDateTime usedAt;
 @PrePersist public void prePersist(){createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public Long getInstitucionId(){return institucionId;} public void setInstitucionId(Long v){institucionId=v;}
 public String getRut(){return rut;} public void setRut(String v){rut=v;} public String getEmail(){return email;} public void setEmail(String v){email=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;} public boolean isUsed(){return used;} public void setUsed(boolean v){used=v;}
 public LocalDateTime getExpiresAt(){return expiresAt;} public void setExpiresAt(LocalDateTime v){expiresAt=v;} public LocalDateTime getCreatedAt(){return createdAt;}
 public LocalDateTime getUsedAt(){return usedAt;} public void setUsedAt(LocalDateTime v){usedAt=v;}
}
