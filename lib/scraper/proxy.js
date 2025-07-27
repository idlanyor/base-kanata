import fs from 'fs';
export const proxies = fs.readFileSync('proxies.txt', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
        const [host, port, username, password] = line.split(':');
        return { host, port, username, password };
    });