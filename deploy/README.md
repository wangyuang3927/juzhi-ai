# FocusAI VPS 部署指南

## 📋 前置要求

- Ubuntu 20.04+ 或 Debian 11+
- 至少 1GB RAM
- Root 权限

## 🚀 快速部署

### 1. 连接到 VPS
```bash
ssh root@你的VPS_IP
```

### 2. 下载部署脚本
```bash
curl -O https://raw.githubusercontent.com/wangyuang3927/juzhi-ai/main/deploy/vps-setup.sh
chmod +x vps-setup.sh
```

### 3. 运行部署脚本
```bash
bash vps-setup.sh
```

### 4. 配置环境变量
```bash
nano /opt/focusai/backend/.env
```

必须配置的变量：
```bash
# 关闭调试模式
DEBUG=false

# SiliconFlow API Key
SILICONFLOW_API_KEY=sk-your-key-here

# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# Tavily API Key
TAVILY_API_KEYS=tvly-your-key-here

# 管理员密码（强密码）
ADMIN_PASSWORD=YourStrongPassword123!

# 允许的跨域来源（使用你的 VPS IP）
ALLOWED_ORIGINS=http://你的VPS_IP
```

### 5. 重启后端服务
```bash
systemctl restart focusai-backend
```

### 6. 访问网站
打开浏览器访问：`http://你的VPS_IP`

---

## 🔧 日常维护

### 查看后端日志
```bash
journalctl -u focusai-backend -f
```

### 查看 Nginx 日志
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 重启服务
```bash
# 重启后端
systemctl restart focusai-backend

# 重启 Nginx
systemctl restart nginx
```

### 更新代码
```bash
cd /opt/focusai/deploy
bash update.sh
```

---

## 🔒 安全加固

### 1. 更改 SSH 端口
```bash
nano /etc/ssh/sshd_config
# 修改 Port 22 为其他端口，如 2222
systemctl restart sshd
```

### 2. 配置 SSH 密钥登录
```bash
# 在本地生成密钥
ssh-keygen -t rsa -b 4096

# 上传公钥到 VPS
ssh-copy-id -p 端口 root@VPS_IP
```

### 3. 安装 fail2ban
```bash
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 4. 配置 HTTPS（可选，需要域名）
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 🌐 无域名访问方案

### 方案 1：直接使用 IP（当前方案）
- 访问地址：`http://你的VPS_IP`
- 优点：简单直接
- 缺点：无法使用 HTTPS，IP 不易记忆

### 方案 2：使用免费域名
1. **DuckDNS**（推荐）
   - 注册：https://www.duckdns.org/
   - 获得：`yourname.duckdns.org`
   - 配置 Nginx：修改 `server_name` 为你的域名

2. **Freenom**
   - 注册：https://www.freenom.com/
   - 免费域名：.tk/.ml/.ga/.cf/.gq

### 方案 3：前端部署到 Vercel
1. 前端推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量 `VITE_API_URL=http://你的VPS_IP/api`
4. 获得免费域名：`yourproject.vercel.app`

---

## ❓ 常见问题

### Q: 如何查看后端是否运行？
```bash
systemctl status focusai-backend
curl http://localhost:8000/health
```

### Q: 前端显示空白页？
1. 检查前端构建是否成功：`ls /opt/focusai/focusai/dist`
2. 检查 Nginx 配置：`nginx -t`
3. 查看浏览器控制台错误

### Q: API 请求失败？
1. 检查后端日志：`journalctl -u focusai-backend -f`
2. 检查环境变量是否配置正确
3. 检查防火墙是否开放端口

### Q: 如何备份数据？
```bash
# 备份数据库和用户数据
tar -czf focusai-backup-$(date +%Y%m%d).tar.gz /opt/focusai/backend/data
```

---

## 📞 技术支持

如遇问题，请检查：
1. 后端日志：`journalctl -u focusai-backend -f`
2. Nginx 日志：`tail -f /var/log/nginx/error.log`
3. 系统资源：`htop` 或 `free -h`
