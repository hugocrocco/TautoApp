package cl.humboldt.credencial.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "socio_foto",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_socio_foto",
                columnNames = {"institucion_id", "rut"}
        )
)
public class SocioFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "institucion_id", nullable = false)
    private Long institucionId;

    @Column(name = "rut", nullable = false, length = 20)
    private String rut;

    @Column(name = "object_key", nullable = false, length = 255)
    private String objectKey;

    @Column(name = "bucket", nullable = false, length = 120)
    private String bucket;

    @Column(name = "etag", length = 120)
    private String etag;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    public Long getId() {
        return id;
    }

    public Long getInstitucionId() {
        return institucionId;
    }

    public void setInstitucionId(Long institucionId) {
        this.institucionId = institucionId;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public void setObjectKey(String objectKey) {
        this.objectKey = objectKey;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getEtag() {
        return etag;
    }

    public void setEtag(String etag) {
        this.etag = etag;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }
}