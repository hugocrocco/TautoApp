package cl.humboldt.credencial.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_users", indexes = {
    @Index(name = "idx_app_users_rut", columnList = "rut", unique = true),
    @Index(name = "idx_app_users_email", columnList = "email")
})
public class AppUser {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 20, unique = true)
  private String rut;

  @Column(nullable = false, length = 180)
  private String displayName;

  @Column(nullable = false, length = 180)
  private String email;

  @Column(nullable = false, length = 120)
  private String passwordHash;

  @Column(nullable = false)
  private boolean emailVerified = false;

  @Column(nullable = false, length = 30)
  private String status = "PENDING_EMAIL_VERIFICATION";

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime verifiedAt;

  @PrePersist
  public void prePersist() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public Long getId() { return id; }

  public String getRut() { return rut; }
  public void setRut(String rut) { this.rut = rut; }

  public String getDisplayName() { return displayName; }
  public void setDisplayName(String displayName) { this.displayName = displayName; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

  public boolean isEmailVerified() { return emailVerified; }
  public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public LocalDateTime getVerifiedAt() { return verifiedAt; }
  public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
}
