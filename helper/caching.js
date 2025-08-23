const groupCache = new Map();

export async function cacheGroupMetadata(sock, id) {
    if (groupCache.has(id)) {
        return groupCache.get(id);
    }

    try {
        const metadata = await sock.groupMetadata(id);
        if (metadata) {
            groupCache.set(id, metadata);
            setTimeout(() => groupCache.delete(id), 60000);
        }
        return metadata;
    } catch (error) {
        console.log('Failed to get group metadata for:', id, error.message);
        return null;
    }
}