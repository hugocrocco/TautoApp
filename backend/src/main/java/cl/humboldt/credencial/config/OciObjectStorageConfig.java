package cl.humboldt.credencial.config;

import com.oracle.bmc.ConfigFileReader;
import com.oracle.bmc.Region;
import com.oracle.bmc.auth.ConfigFileAuthenticationDetailsProvider;
import com.oracle.bmc.objectstorage.ObjectStorage;
import com.oracle.bmc.objectstorage.ObjectStorageClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OciObjectStorageConfig {

    @Value("${oci.objectstorage.profile:DEFAULT}")
    private String profile;

    @Value("${oci.objectstorage.region}")
    private String region;

    @Bean
    public ObjectStorage objectStorageClient() throws Exception {

        // Lee el archivo ~/.oci/config usando el profile indicado (por defecto: DEFAULT)
        String configPath = System.getProperty("user.home") + "/.oci/config";

        ConfigFileReader.ConfigFile configFile =
                ConfigFileReader.parse(configPath, profile);

        ConfigFileAuthenticationDetailsProvider provider =
                new ConfigFileAuthenticationDetailsProvider(configFile);

        return ObjectStorageClient.builder()
                .region(Region.fromRegionId(region))
                .build(provider);
    }
}