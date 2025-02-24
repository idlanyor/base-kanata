const groupCache = new Map();

export async function cacheGroupMetadata(sock, id) {
    if (groupCache.has(id)) {
        return groupCache.get(id);
    }

    const metadata = await sock.groupMetadata(id);
    groupCache.set(id, metadata);

    setTimeout(() => groupCache.delete(id), 60000);
    return metadata;
}