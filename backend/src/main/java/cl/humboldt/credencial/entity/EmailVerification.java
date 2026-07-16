package cl.humboldt.credencial.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_verifications", indexes = {
    @Index(name = "idx_email_verifications_rut", columnList = "rut"),
    @Index(name = "idx_email_verifications_code", columnList = "code")
})
public class EmailVerification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 20)
  private String rut;

  @Column(nullable = false, length = 180)
  private String email;

  @Column(nullable = false, length = 10)
  private String code;

  @Column(nullable = false)
  private boolean used = false;

  @Column(nullable = false)
  private LocalDateTime expiresAt;

  private LocalDateTime createdAt;
  private LocalDateTime usedAt;

  @PrePersist
  public void prePersist() {
    createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }

  public String getRut() { return rut; }
  public void setRut(String rut) { this.rut = rut; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }

  public boolean isUsed() { return used; }
  public void setUsed(boolean used) { this.used = used; }

  public LocalDateTime getExpiresAt() { return expiresAt; }
  public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

  public LocalDateTime getCreatedAt() { return createdAt; }

  public LocalDateTime getUsedAt() { return usedAt; }
  public void setUsedAt(LocalDateTime usedAt) { this.usedAt = usedAt; }
}
