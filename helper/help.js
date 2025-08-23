import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pluginsDir = path.join(__dirname, '../plugins');

async function loadPlugins(dir) {
    let plugins = {};

    const list = fs.readdirSync(dir);

    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Hanya proses file .js langsung dari direktori plugins, tidak rekursif
        if (stat && stat.isFile() && file.endsWith('.js')) {
            const { default: plugin, description, handler } = await import(pathToFileURL(filePath).href);
            const folderName = 'main'; // Semua plugin langsung dari folder plugins masuk kategori main
            if (!plugins[folderName]) {
                plugins[folderName] = [];
            }
            plugins[folderName].push({
                subfolder: folderName, 
                file: file, 
                handler: handler || 'Belum ada handler',
                description: description || 'Belum ada deskripsi',
            });
        }
    }

    return plugins;
}

export async function helpMessage() {
    const plugins = await loadPlugins(pluginsDir);
    // console.log(plugins)

    let caption = "🌟 Hai, aku Kanata! Senang sekali bisa membantu kamu hari ini. Berikut adalah daftar perintah yang bisa kamu gunakan:\n";

    for (const kanata in plugins) {
        // Nambah header folder
        caption += `❏┄┅━┅┄〈 〘 ${kanata.toUpperCase()} 〙\n`;

        plugins[kanata].forEach(plugin => {
            const command = plugin.handler; 
            caption += `- *${command}*\n`;
        });

        caption += '\n';
    }
    caption += 'Klik list untuk detail lebih lanjut';

    return { caption, plugins };
}

