import os from 'os'

export const handler = {
    command: 'cekip',
    tags: ['hidden'],
    help: 'Cek IP Host',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, id }) => {
        try {
            const networkInterfaces = os.networkInterfaces()
            const result = []

            for (const interfaceName in networkInterfaces) {
                const addresses = networkInterfaces[interfaceName]
                for (const address of addresses) {
                    if (address.family === 'IPv4' && !address.internal) {
                        result.push({
                            interface: interfaceName,
                            address: address.address,
                            mac: address.mac,
                            netmask: address.netmask
                        })
                    }
                }
            }

            for (const info of result) {
                await sock.sendMessage(id, {
                    text: `========================================
Interface : ${info.interface}
IP Address: ${info.address}
MAC Address: ${info.mac}
Netmask   : ${info.netmask}
========================================`
                }, { quoted: m })
            }

        } catch (error) {
            console.error('Error in cekip:', error)
            await m.reply('❌ Gagal mengecek IP')
        }
    }
}

export default handler
