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

        if (stat && stat.isDirectory()) {


            const subPlugins = await loadPlugins(filePath);
            const folderName = path.basename(filePath);
            if (folderName === 'hidden') {
                console.log(`Subfolder ${folderName} dikecualikan`);
                continue;
            }
            if (!plugins[folderName]) {
                plugins[folderName] = [];
            }
            // Gabungake subPlugins ing folder utama
            Object.entries(subPlugins).forEach(([subFolder, pluginFiles]) => {
                if (!plugins[subFolder]) {
                    plugins[subFolder] = [];
                }
                plugins[subFolder].push(...pluginFiles);
            });
        } else if (file.endsWith('.js')) {
            const { default: plugin, description, handler } = await import(pathToFileURL(filePath).href);
            const folderName = path.basename(path.dirname(filePath)); // Nentokake folder induk
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

    let caption = "🌟 Hai, aku Sonata! Senang sekali bisa membantu kamu hari ini. Berikut adalah daftar perintah yang bisa kamu gunakan:\n";

    for (const sonata in plugins) {
        // Nambah header folder
        caption += `❏┄┅━┅┄〈 〘 ${sonata.toUpperCase()} 〙\n`;

        plugins[sonata].forEach(plugin => {
            const command = plugin.handler; 
            caption += `- *${command}*\n`;
        });

        caption += '\n';
    }
    caption += 'Klik list untuk detail lebih lanjut';

    return { caption, plugins };
}

