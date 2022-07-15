const { Eureka } = require('eureka-js-client')

module.exports = class EurekaClient {

    /**
     * Initialize the Eureka client to register with Eureka Server.
     * @param {any} parameters Eureka main configuration parameters. 'port' and 'eurekaHost' are required.
     * @param {any} options Eureka other configuration parameters.
     */
    constructor({ port,
        appName,
        hostName,
        ipAddress,
        eurekaPort,
        eurekaHost,
        useAws,
        logLevel },
        options) {

        if (!options.port) {
            throw new Error('Eureka Client: Port is required');
        }

        if (!options.eurekaHost) {
            throw new Error('Eureka Client: Eureka host is required');
        }

        // Main parameters
        this.port = port;
        this.appName = appName || 'myApp';
        this.hostName = hostName || useAws ? undefined : 'localhost';
        this.ipAddress = ipAddress || useAws ? undefined : '127.0.0.1';
        this.eurekaPort = eurekaPort || 8761;
        this.eurekaHost = eurekaHost;
        this.useAws = useAws || false;
        this.logLevel = logLevel || 'debug';

        // Other instance parameters
        this.appGroupName = options.appGroupName || undefined;
        this.sid = options.sid || undefined;
        this.securePort = options.securePort || undefined;
        this.statusPagePath = options.statusPagePath || null;
        this.healthCheckPath = options.healthCheckPath || null;
        this.secureHealthCheckUrl = options.secureHealthCheckUrl || undefined;
        this.secureVipAddress = options.secureVipAddress || undefined;
        this.countryId = options.countryId || undefined;
        this.isCoordinatingDiscoveryServer = options.isCoordinatingDiscoveryServer || false;
        this.metadata = options.metadata || undefined;

        // Other Eureka parameters
        this.heartbeatInterval = options.heartbeatInterval || undefined;
        this.registryFetchInterval = options.registryFetchInterval || undefined;
        this.maxRetries = options.maxRetries || 10;
        this.requestRetryDelay = options.requestRetryDelay || 2000;
        this.fetchRegistry = options.fetchRegistry || true;
        this.filterUpInstances = options.filterUpInstances || false;
        this.eurekaServicePath = options.eurekaServicePath || '/eureka/apps/';
        this.useSsl = options.useSsl || false;
        this.useDns = options.useDns || false;
        this.preferSameZone = options.preferSameZone || false;
        this.clusterRefreshInterval = options.clusterRefreshInterval || undefined;
        this.fetchMetadata = options.fetchMetadata || true;
        this.useLocalMetadata = options.useLocalMetadata || true;
        this.preferIpAddress = options.preferIpAddress || true;
        this.eurekaServiceUrls = options.eurekaServiceUrls || undefined;
    }


    /**
     * Register Eureka client to Eureka Server.
     */
    register() {
        const client = new Eureka({
            instance: {
                app: this.appName,
                instanceId: `${this.appName}-${this.ipAddress}-${this.port}`,
                hostName: this.hostName,
                ipAddr: this.ipAddress,
                port: {
                    '$': this.port,
                    '@enabled': 'true',
                },
                vipAddress: this.appName,
                dataCenterInfo: this.useAws ? {
                    '@class': 'com.netflix.appinfo.AmazonInfo',
                    name: 'Amazon',
                } : {
                    '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
                    name: 'MyOwn',
                },
                healthCheckUrl: this.healthCheckPath ?? `http://${this.useAws ? '__HOST__' : this.ipAddress}:${this.port}/health-check`,
                statusPageUrl: this.statusPagePath ?? `http://${this.useAws ? '__HOST__' : this.ipAddress}:${this.port}/health-check`,
                homePageUrl: `http://${this.useAws ? '__HOST__' : this.ipAddress}:${this.port}`,
                appGroupName: this.appGroupName,
                sid: this.sid,
                securePort: this.securePort,
                secureHealthCheckUrl: this.secureHealthCheckUrl,
                secureVipAddress: this.secureVipAddress,
                countryId: this.countryId,
                isCoordinatingDiscoveryServer: this.isCoordinatingDiscoveryServer,
                metadata: this.metadata,
            },
            //retry 10 time for 3 minute 20 seconds.
            eureka: {
                host: this.eurekaHost,
                port: this.eurekaPort,
                servicePath: this.eurekaServicePath,
                maxRetries: this.maxRetries,
                requestRetryDelay: this.requestRetryDelay,
                useLocalMetadata: this.useLocalMetadata,
                preferIpAddress: this.preferIpAddress,
                fetchMetadata: this.fetchMetadata,
                fetchRegistry: this.fetchRegistry,
                heartbeatInterval: this.heartbeatInterval,
                registryFetchInterval: this.registryFetchInterval,
                ssl: this.useSsl,
                useDns: this.useDns,
                preferSameZone: this.preferSameZone,
                clusterRefreshInterval: this.clusterRefreshInterval,
                serviceUrls: this.eurekaServiceUrls,
            },
        });

        client.logger.level(this.logLevel);

        client.start(error => {
            console.log(error || `${this.appName} is registered with Eureka`);
        });

        function exitHandler(options, exitCode) {
            if (options.cleanup) {
            }
            if (exitCode || exitCode === 0) console.log(exitCode);
            if (options.exit) {
                client.stop();
            }
        }

        client.on('deregistered', () => {
            console.log('Eureka client deregistered.');
            process.exit();
        })

        client.on('started', () => {
            console.log(`Eureka started at ${this.eurekaHost}:${this.eurekaPort}`);
        })

        process.on('SIGINT', exitHandler.bind(null, { exit: true }));
    }
}