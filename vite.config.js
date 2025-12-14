import { defineConfig } from 'vite'

// 注意：这里的 <仓库名> 要替换成你 GitHub 上的仓库名称（比如仓库叫 ai2512141544，就写 '/ai2512141544/'）
// 如果你的仓库是 <用户名>.github.io（即个人主页仓库），则 base 直接设为 '/'
export default defineConfig({
    base: '/calc24/', // 核心配置：设置部署的基础路径
    build: {
        outDir: 'dist' // Vite 默认构建输出目录是 dist，可保持默认
    }
})