package cl.humboldt.credencial.service;

import com.oracle.bmc.objectstorage.ObjectStorage;
import com.oracle.bmc.objectstorage.requests.GetObjectRequest;
import com.oracle.bmc.objectstorage.requests.HeadObjectRequest;
import com.oracle.bmc.objectstorage.requests.PutObjectRequest;
import com.oracle.bmc.objectstorage.responses.GetObjectResponse;
import com.oracle.bmc.objectstorage.responses.HeadObjectResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
public class UserPhotoStorageService {

    private final ObjectStorage objectStorage;
    private final String namespace;
    private final String bucket;

    public UserPhotoStorageService(
            ObjectStorage objectStorage,
            @Value("${oci.objectstorage.namespace}") String namespace,
            @Value("${oci.objectstorage.bucket}") String bucket
    ) {
        this.objectStorage = objectStorage;
        this.namespace = namespace;
        this.bucket = bucket;
    }

    /**
     * Genera una ruta privada para la foto.
     * Recomendación: evita usar RUT en el path (dato sensible / identificable).
     * Ej: institucion/1/socios/123/profile.jpg
     */
    public String buildObjectName(Long institucionId, Long socioId) {
        return "institucion/" + institucionId + "/socios/" + socioId + "/profile.jpg";
    }

    /**
     * Compatibilidad (no recomendado): si ya tienes código que usa RUT.
     * Normaliza el RUT removiendo puntos y espacios.
     * Ej: 16.664.641-3 -> 16664641-3
     */
    public String buildObjectName(Long institucionId, String rut) {
        String safeRut = rut == null ? "" : rut.trim().toUpperCase();
        safeRut = safeRut.replace(".", "").replace(" ", "");
        return "institucion/" + institucionId + "/socios/" + safeRut + "/profile.jpg";
    }

    public void uploadPhoto(String objectName, InputStream data, long contentLength, String contentType) {
        PutObjectRequest req = PutObjectRequest.builder()
                .namespaceName(namespace)
                .bucketName(bucket)
                .objectName(objectName)
                .putObjectBody(data)
                .contentLength(contentLength)
                .contentType(contentType != null ? contentType : "image/jpeg")
                .build();

        objectStorage.putObject(req);
    }

    public GetObjectResponse getPhoto(String objectName) {
        GetObjectRequest req = GetObjectRequest.builder()
                .namespaceName(namespace)
                .bucketName(bucket)
                .objectName(objectName)
                .build();

        return objectStorage.getObject(req);
    }

    public boolean exists(String objectName) {
        try {
            HeadObjectRequest req = HeadObjectRequest.builder()
                    .namespaceName(namespace)
                    .bucketName(bucket)
                    .objectName(objectName)
                    .build();
            HeadObjectResponse r = objectStorage.headObject(req);
            return r != null;
        } catch (Exception e) {
            return false;
        }
    }
}