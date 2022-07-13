const Resilient = require('resilient')
const eurekaMiddleware = require('resilient-eureka')

module.exports = class FeignClient {
    /**
     * Initialize the Feign client to communicate with another services using Eureka Server.
     * @param {any} parameters Feign configuration parameters. 'serviceName', 'eurekaHost' and 'eurekaPort' are required.
     * @param {any} balancer Load balancing strategy. 'random' and 'roundRobin' are supported.
     */
    constructor({serviceName, eurekaHost, eurekaPort, useSsl, timeout}, balancer) {
        if (!serviceName) {
            throw new Error('Feign Client: Service name is required');
        }

        if (!eurekaHost) {
            throw new Error('Feign Client: Eureka host is required');
        }

        if (!eurekaPort) {
            throw new Error('Feign Client: Eureka port is required');
        }

        const protocol = useSsl ? 'https' : 'http'

        this.client = Resilient({
            discovery: {
                servers: [`${protocol}://${eurekaHost}:${eurekaPort}`],
                timeout: timeout || 1000
            },
            balancer: {
                random: balancer === 'random',
                roundRobin: balancer === 'roundRobin'
            }
        });
        this.client.use(eurekaMiddleware({
            serviceName: serviceName,
        }));
    }
}