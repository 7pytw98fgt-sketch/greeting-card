# 部署指南 (DEPLOY.md)

本文档介绍如何将"贺卡祝福动画短片"项目部署到线上。

---

## Vercel 部署（推荐）

1. 注册 [vercel.com](https://vercel.com) 账号（支持 GitHub / GitLab 登录）
2. 在 Vercel Dashboard 点击 **"New Project"**
3. 导入 `greeting-card` 的 Git 仓库
4. Framework Preset 选择 **"Vite"**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. 点击 **Deploy**
8. 部署完成后，在 Settings → Domains 绑定自定义域名（如果有）
9. **免费额度：** 100GB 带宽/月，足够日常使用

---

## Cloudflare Pages 部署（国内访问更优）

1. 注册 [Cloudflare](https://cloudflare.com) 账号
2. 进入 **Workers & Pages** → **Create** → **Pages**
3. 连接 Git 仓库
4. Build command: `npm run build`
5. Build output directory: `dist`
6. 部署后自动分配 `*.pages.dev` 域名
7. 可在 Cloudflare 设置自定义域名（无需备案）

---

## GitHub Pages 部署

1. 在仓库 Settings → Pages → Source 选择 **"GitHub Actions"**
2. 创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/
      - uses: actions/deploy-pages@v4
```

---

## 国内外访问优化建议

* **Cloudflare Pages + 自定义域名：** 自带亚太 CDN 节点，国内大部分地区可访问
* **如需更快的国内访问：** 在又拍云或阿里云 CDN 上添加回源配置，回源到 Vercel/Cloudflare 的域名
* **国内自定义域名需要 ICP 备案**（如长期使用建议备案）

---

## 项目配置参考

| 项目 | 值 |
|------|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 开发命令 | `npm run dev` |
| 预览命令 | `npm run preview` |
| Node 版本 | >= 18 |
| 框架 | Vite 7 |
