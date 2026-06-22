# 🎉 贺卡祝福动画短片

> 一份会"动"的祝福 — 支持自定义祝福内容，五场景 3D 动画播放，多语言界面，移动端适配。

---

## ✨ 功能

- 🎬 **五场景动画**：开场 → 叙事 → 翻转贺卡 → 高潮 → 结尾，自动或触屏切换
- ✏️ **自定义祝福**：通过 creator 页面填写祝福内容，生成专属分享链接
- 🌐 **多语言**：简体中文、繁體中文、English、日本語、한국어、Français、Español
- 🎨 **四种主题**：温暖 🌅 / 清凉 🌊 / 金色 ✨ / 清新 🌿
- 📱 **移动端适配**：触屏滑动切换场景，粒子系统性能自适应
- 🔗 **一键分享**：生成的链接复制即用，对方打开就能看完整动画

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

---

## 📖 使用方式

### 创建祝福卡片

1. 访问 `/creator.html`
2. 填写祝福对象姓名、场景、祝福语等信息
3. 点击"生成祝福链接"
4. 复制链接发送给对方

### 查看祝福卡片

打开收到的链接即可，无需任何操作，动画自动播放。触屏左右滑动或使用键盘 ← → 切换场景。

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Vite 7](https://vitejs.dev) | 构建工具 |
| [Three.js](https://threejs.org) | 3D 粒子场景渲染 |
| [GSAP](https://gsap.com) | 动画引擎 |
| [i18next](https://www.i18next.com) | 国际化 |
| [lz-string](https://pieroxy.net/blog/pages/lz-string/index.html) | 祝福数据压缩编码 |

---

## 📁 项目结构

```
greeting-card/
├── index.html              # 主播放页
├── creator.html            # 卡片创作页
├── vite.config.js          # Vite 配置
├── public/                 # 静态资源
│   ├── favicon.svg
│   ├── manifest.json
│   └── og-image.svg
├── src/
│   ├── main.js             # 应用入口
│   ├── scenes/             # 五大场景
│   │   ├── OpeningScene.js
│   │   ├── NarrativeScene.js
│   │   ├── FlipCardScene.js
│   │   ├── ClimaxScene.js
│   │   └── ClosingScene.js
│   ├── animations/         # 动画模块
│   │   ├── flip-card.js
│   │   ├── parallax.js
│   │   ├── particles-2d.js
│   │   ├── particles-3d.js
│   │   └── text-reveal.js
│   ├── components/         # UI 组件
│   ├── i18n/               # 多语言
│   ├── styles/             # 样式
│   └── utils/              # 工具函数
└── DEPLOY.md               # 部署指南
```

---

## 📦 部署

详见 [DEPLOY.md](./DEPLOY.md)，支持 Vercel、Cloudflare Pages、GitHub Pages 三种方式。

---

## 📝 License

MIT
