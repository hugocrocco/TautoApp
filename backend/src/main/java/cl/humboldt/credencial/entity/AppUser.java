package cl.humboldt.credencial.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_users", indexes = {
    @Index(name = "idx_app_users_inst_rut", columnList = "institucion_id,rut", unique = true),
    @Index(name = "idx_app_users_inst_email", columnList = "institucion_id,email")
})
public class AppUser {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(name="institucion_id", nullable=false) private Long institucionId;
  @Column(nullable=false, length=20) private String rut;
  @Column(nullable=false, length=180) private String displayName;
  @Column(nullable=false, length=180) private String email;
  @Column(nullable=false, length=120) private String passwordHash;
  @Column(nullable=false) private boolean emailVerified=false;
  @Column(nullable=false, length=30) private String status="PENDING_EMAIL_VERIFICATION";
  private LocalDateTime createdAt; private LocalDateTime updatedAt; private LocalDateTime verifiedAt;
  @PrePersist public void prePersist(){createdAt=LocalDateTime.now();updatedAt=LocalDateTime.now();}
  @PreUpdate public void preUpdate(){updatedAt=LocalDateTime.now();}
  public Long getId(){return id;}
  public Long getInstitucionId(){return institucionId;} public void setInstitucionId(Long v){institucionId=v;}
  public String getRut(){return rut;} public void setRut(String v){rut=v;}
  public String getDisplayName(){return displayName;} public void setDisplayName(String v){displayName=v;}
  public String getEmail(){return email;} public void setEmail(String v){email=v;}
  public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){passwordHash=v;}
  public boolean isEmailVerified(){return emailVerified;} public void setEmailVerified(boolean v){emailVerified=v;}
  public String getStatus(){return status;} public void setStatus(String v){status=v;}
  public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
  public LocalDateTime getVerifiedAt(){return verifiedAt;} public void setVerifiedAt(LocalDateTime v){verifiedAt=v;}
}
