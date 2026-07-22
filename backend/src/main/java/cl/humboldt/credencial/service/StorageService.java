package cl.humboldt.credencial.service;

import com.oracle.bmc.objectstorage.ObjectStorage;
import com.oracle.bmc.objectstorage.requests.DeleteObjectRequest;
import com.oracle.bmc.objectstorage.requests.GetObjectRequest;
import com.oracle.bmc.objectstorage.requests.HeadObjectRequest;
import com.oracle.bmc.objectstorage.requests.PutObjectRequest;
import com.oracle.bmc.objectstorage.responses.GetObjectResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

@Service
public class StorageService {

    private final ObjectStorage objectStorage;
    private final String namespace;
    private final String bucket;

    public StorageService(
            ObjectStorage objectStorage,
            @Value("${oci.objectstorage.namespace}") String namespace,
            @Value("${oci.objectstorage.bucket}") String bucket
    ) {
        this.objectStorage = objectStorage;
        this.namespace = namespace;
        this.bucket = bucket;
    }

    /**
     * Sube un MultipartFile a OCI Object Storage.
     *
     * @param folder carpeta lógica dentro del bucket, por ejemplo:
     *               hbdt/benefits
     * @param file   archivo recibido desde el frontend
     * @return nombre completo del objeto guardado en OCI
     */
    public String upload(String folder, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío.");
        }

        String extension = getExtension(file.getOriginalFilename());
        String objectName = buildUniqueObjectName(folder, extension);

        upload(
                objectName,
                file.getInputStream(),
                file.getSize(),
                file.getContentType()
        );

        return objectName;
    }

    /**
     * Sube un InputStream con un nombre de objeto definido.
     */
    public void upload(
            String objectName,
            InputStream data,
            long contentLength,
            String contentType
    ) {
        String cleanObjectName = normalizeObjectName(objectName);

        if (cleanObjectName.isBlank()) {
            throw new IllegalArgumentException(
                    "El nombre del objeto no puede estar vacío."
            );
        }

        PutObjectRequest request = PutObjectRequest.builder()
                .namespaceName(namespace)
                .bucketName(bucket)
                .objectName(cleanObjectName)
                .putObjectBody(data)
                .contentLength(contentLength)
                .contentType(
                        contentType == null || contentType.isBlank()
                                ? "application/octet-stream"
                                : contentType
                )
                .build();

        objectStorage.putObject(request);
    }

    /**
     * Descarga un objeto desde OCI.
     */
    public GetObjectResponse download(String objectName) {
        String cleanObjectName = normalizeObjectName(objectName);

        GetObjectRequest request = GetObjectRequest.builder()
                .namespaceName(namespace)
                .bucketName(bucket)
                .objectName(cleanObjectName)
                .build();

        return objectStorage.getObject(request);
    }

    /**
     * Comprueba si un objeto existe.
     */
    public boolean exists(String objectName) {
        try {
            String cleanObjectName = normalizeObjectName(objectName);

            if (cleanObjectName.isBlank()) {
                return false;
            }

            HeadObjectRequest request = HeadObjectRequest.builder()
                    .namespaceName(namespace)
                    .bucketName(bucket)
                    .objectName(cleanObjectName)
                    .build();

            objectStorage.headObject(request);
            return true;

        } catch (Exception exception) {
            return false;
        }
    }

    /**
     * Elimina un objeto del bucket.
     */
    public void delete(String objectName) {
        String cleanObjectName = normalizeObjectName(objectName);

        if (cleanObjectName.isBlank()) {
            return;
        }

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .namespaceName(namespace)
                .bucketName(bucket)
                .objectName(cleanObjectName)
                .build();

        objectStorage.deleteObject(request);
    }

    /**
     * Crea un nombre único para el objeto.
     *
     * Ejemplo:
     * hbdt/benefits/a31f9b6d-...-92c1.pdf
     */
    public String buildUniqueObjectName(String folder, String extension) {
        String cleanFolder = normalizeFolder(folder);
        String cleanExtension = normalizeExtension(extension);

        String fileName = UUID.randomUUID() + cleanExtension;

        if (cleanFolder.isBlank()) {
            return fileName;
        }

        return cleanFolder + "/" + fileName;
    }

    /**
     * Crea una ruta estable con nombre proporcionado.
     *
     * Ejemplo:
     * institucion/1/socios/12345678-9/profile.jpg
     */
    public String buildObjectName(String folder, String fileName) {
        String cleanFolder = normalizeFolder(folder);
        String cleanFileName = safeFileName(fileName);

        if (cleanFolder.isBlank()) {
            return cleanFileName;
        }

        return cleanFolder + "/" + cleanFileName;
    }

    public String getNamespace() {
        return namespace;
    }

    public String getBucket() {
        return bucket;
    }

    private String normalizeFolder(String value) {
        if (value == null) {
            return "";
        }

        String folder = value.trim()
                .replace("\\", "/")
                .replaceAll("/+", "/")
                .replaceAll("^/+", "")
                .replaceAll("/+$", "");

        if (folder.contains("..")) {
            throw new IllegalArgumentException(
                    "La carpeta contiene una ruta no permitida."
            );
        }

        return folder;
    }

    private String normalizeObjectName(String value) {
        if (value == null) {
            return "";
        }

        String objectName = value.trim()
                .replace("\\", "/")
                .replaceAll("/+", "/")
                .replaceAll("^/+", "");

        if (objectName.contains("..")) {
            throw new IllegalArgumentException(
                    "El nombre del objeto contiene una ruta no permitida."
            );
        }

        return objectName;
    }

    private String getExtension(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "";
        }

        String cleanName = originalFileName.trim();
        int lastDot = cleanName.lastIndexOf('.');

        if (lastDot < 0 || lastDot == cleanName.length() - 1) {
            return "";
        }

        String extension = cleanName.substring(lastDot)
                .toLowerCase(Locale.ROOT);

        if (!extension.matches("\\.[a-z0-9]{1,10}")) {
            return "";
        }

        return extension;
    }

    private String normalizeExtension(String extension) {
        if (extension == null || extension.isBlank()) {
            return "";
        }

        String cleanExtension = extension.trim()
                .toLowerCase(Locale.ROOT);

        if (!cleanExtension.startsWith(".")) {
            cleanExtension = "." + cleanExtension;
        }

        if (!cleanExtension.matches("\\.[a-z0-9]{1,10}")) {
            return "";
        }

        return cleanExtension;
    }

    private String safeFileName(String value) {
        String fileName = value == null ? "archivo" : value.trim();

        fileName = Normalizer.normalize(
                fileName,
                Normalizer.Form.NFD
        );

        fileName = fileName
                .replaceAll("\\p{M}", "")
                .replaceAll("[\\r\\n\\\\/]+", "_")
                .replaceAll("[^a-zA-Z0-9._-]", "_")
                .replaceAll("_+", "_");

        if (fileName.isBlank()) {
            return "archivo";
        }

        return fileName;
    }
}