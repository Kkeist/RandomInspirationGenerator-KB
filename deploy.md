# 部署说明

## 部署前检查

- [ ] **图标**：根目录需有 `192pxIcon.PNG`、`512pxIcon.PNG`（与 `index.html`、`manifest.json` 引用一致）。若暂无，部署可正常进行，仅图标会 404。
- [ ] **文件齐全**：确认 `index.html`、`styles.css`、`app.js`、`manifest.json`、`SystemElementData.js`、`_seg.js` 等均在项目根目录。
- [ ] **Netlify 配置**：项目已包含 `netlify.toml`，发布目录为 `.`，无需改构建设置。

## Netlify 部署步骤

### 方法一：拖拽部署（推荐新手）
1. 访问 [Netlify](https://www.netlify.com/)
2. 注册/登录账号
3. 将整个项目文件夹拖拽到 Netlify 部署区域
4. 等待部署完成，获得访问链接

### 方法二：Git 部署（推荐）
1. 将项目上传到 GitHub 仓库
2. 在 Netlify 中点击 "New site from Git"
3. 连接 GitHub 并选择仓库
4. 构建设置会由根目录的 `netlify.toml` 自动读取（发布目录为 `.`，无构建命令），一般无需修改
5. 点击 "Deploy site"

### 方法三：Netlify CLI
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir .
```

## 其他平台部署

### Vercel
1. 访问 [Vercel](https://vercel.com/)
2. 导入 GitHub 仓库
3. 无需配置，直接部署

### GitHub Pages
1. 将代码推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择源分支（通常是 main）

### 自托管
任何支持静态文件的服务器都可以：
- Apache
- Nginx  
- IIS
- 简单的文件服务器

## 注意事项

1. **HTTPS**: 建议使用 HTTPS 以支持所有功能
2. **域名**: 可以绑定自定义域名
3. **缓存**: 已配置适当的缓存策略
4. **安全**: 包含基本的安全头设置

## 测试部署

部署完成后，请测试：
- [ ] 口令锁功能
- [ ] 基础生成功能  
- [ ] 数据导入导出
- [ ] 移动端适配
- [ ] 各种生成工具

## 故障排除

### 常见问题
1. **口令无法输入**: 检查JavaScript是否正确加载
2. **样式异常**: 确认CSS文件路径正确
3. **功能异常**: 检查浏览器控制台错误信息
4. **移动端问题**: 确认viewport设置正确

### 调试方法
- 使用浏览器开发者工具
- 检查网络请求
- 查看控制台错误
- 验证文件完整性