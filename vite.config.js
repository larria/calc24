import { defineConfig } from 'vite'
// 1. 引入 PWA 插件
import { VitePWA } from 'vite-plugin-pwa'

// 注意：这里的 <仓库名> 要替换成你 GitHub 上的仓库名称
export default defineConfig({
    base: '/calc24/', // 核心配置：设置部署的基础路径
    build: {
        outDir: 'dist' // Vite 默认构建输出目录是 dist
    },
    // 2. 在 plugins 数组中添加配置
    plugins: [
        VitePWA({
            // 自动更新模式（用户打开网页后，后台下载新版并自动刷新）
            registerType: 'autoUpdate',

            // 自动注入相关代码
            injectRegister: 'auto',

            // manifest.json 配置
            manifest: {
                name: '咪猪头算24',      // 安装后启动画面显示的名称
                short_name: 'PiggyMi24',    // 手机桌面上显示的名称
                description: '一个快速计算24点的应用',
                theme_color: '#ffffff',  // 顶部状态栏颜色
                // 必须提供的图标配置
                icons: [
                    {
                        src: 'app.png', // 这里的路径相对于 public 目录
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'app.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },

            // 针对 Github Pages 等非根目录部署的重要配置
            // 它可以确保 sw.js 能正确找到资源
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            }
        })
    ]
})