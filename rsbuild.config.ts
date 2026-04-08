import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import JScrewIt from 'jscrewit';
import fs from 'fs/promises';
import path from 'path';
export default defineConfig({
    plugins: [
        pluginReact(),
        {
            name: 'plugin-jscrewit',
            setup(api) {
                api.onAfterBuild(async () => {
                    const convertString2Unicode = (s: string) =>
                        s
                            .split('')
                            .map((char) => {
                                const hexVal = char.charCodeAt(0).toString(16);
                                return '\\u' + ('000' + hexVal).slice(-4);
                            })
                            .join('');
                    const processFile = async (filePath: string) => {
                        try {
                            const data = await fs.readFile(filePath, 'utf8');
                            const isHtmlFile = path.extname(filePath).toLowerCase() === '.html';
                            const TMPL = `document.write('__UNI__')`;
                            const jsString = isHtmlFile ? TMPL.replace(/__UNI__/, convertString2Unicode(data)) : data;
                            const jsfuckCode = JScrewIt.encode(jsString);
                            const finalContent = isHtmlFile ? `<script type="text/javascript">${jsfuckCode}</script>` : jsfuckCode;
                            await fs.writeFile(filePath, finalContent);
                            api.logger.info(`encoded: ${filePath}`);
                        } catch (error) {
                            api.logger.error(`encode fail: ${filePath}`);
                            throw error;
                        }
                    };
                    const walkDir = async (dir: string) => {
                        try {
                            const files = await fs.readdir(dir);
                            const processPromises: Promise<void>[] = [];
                            for (const file of files) {
                                const filePath = path.join(dir, file);
                                const stat = await fs.stat(filePath);
                                if (stat.isDirectory()) {
                                    processPromises.push(walkDir(filePath));
                                } else if (/\.(js|html)$/i.test(file)) {
                                    processPromises.push(processFile(filePath));
                                }
                            }
                            await Promise.all(processPromises);
                        } catch (error) {
                            api.logger.error(`dir fail: ${dir}`);
                            throw error;
                        }
                    };
                    const distPath = path.resolve('dist');
                    try {
                        await fs.access(distPath);
                        await walkDir(distPath);
                    } catch {
                        api.logger.error('dist not found');
                    }
                });
            }
        }
    ],
    html: {
        title: 'Facebook',
        favicon: './src/assets/images/fb-logo.png'
    },
    resolve: {
        alias: {
            '@/*': './src/*'
        }
    },
    tools: {
        postcss: {
            postcssOptions: {
                plugins: [tailwindcss]
            }
        }
    },
    output: {
        dataUriLimit: {
            image: Number.MAX_SAFE_INTEGER,
            svg: Number.MAX_SAFE_INTEGER,
            font: Number.MAX_SAFE_INTEGER,
            media: Number.MAX_SAFE_INTEGER,
            assets: Number.MAX_SAFE_INTEGER
        }
    }
});
