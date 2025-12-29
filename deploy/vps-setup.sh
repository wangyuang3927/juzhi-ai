#!/bin/bash
# ============================================
# FocusAI VPS 部署脚本
# 使用方法: bash vps-setup.sh
# ============================================

set -e  # 遇到错误立即退出

echo "🚀 开始部署 FocusAI..."

# ============================================
# 1. 安装系统依赖
# ============================================
echo "📦 安装系统依赖..."
apt update
apt install -y python3 python3-pip python3-venv nodejs npm nginx git

# ============================================
# 2. 克隆代码
# ============================================
echo "📥 克隆代码..."
cd /opt
if [ -d "focusai" ]; then
    echo "代码目录已存在，拉取最新代码..."
    cd focusai
    git pull
else
    git clone https://github.com/wangyuang3927/juzhi-ai.git focusai
    cd focusai
fi

# ============================================
# 3. 部署后端
# ============================================
echo "🐍 部署后端..."
cd /opt/focusai/backend

# 创建虚拟环境
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 创建 .env 文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "⚠️  请手动配置 /opt/focusai/backend/.env 文件"
    cp .env.example .env
fi

# ============================================
# 4. 部署前端
# ============================================
echo "⚛️  部署前端..."
cd /opt/focusai/focusai

# 安装依赖
npm install

# 构建生产版本
npm run build

# ============================================
# 5. 配置 Nginx
# ============================================
echo "🌐 配置 Nginx..."

# 获取 VPS IP
VPS_IP=$(curl -s ifconfig.me)

cat > /etc/nginx/sites-available/focusai << EOF
server {
    listen 80;
    server_name $VPS_IP;

    # 前端静态文件
    location / {
        root /opt/focusai/focusai/dist;
        try_files \$uri \$uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API 文档（可选，生产环境建议删除）
    location /docs {
        proxy_pass http://127.0.0.1:8000;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/focusai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx

# ============================================
# 6. 配置 systemd 服务
# ============================================
echo "⚙️  配置后端服务..."

cat > /etc/systemd/system/focusai-backend.service << EOF
[Unit]
Description=FocusAI Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/focusai/backend
Environment="PATH=/opt/focusai/backend/venv/bin"
ExecStart=/opt/focusai/backend/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 重载 systemd
systemctl daemon-reload

# 启动服务
systemctl enable focusai-backend
systemctl restart focusai-backend

# ============================================
# 7. 配置防火墙
# ============================================
echo "🔒 配置防火墙..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ============================================
# 完成
# ============================================
echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 重要信息："
echo "   - 网站地址: http://$VPS_IP"
echo "   - 后端 API: http://$VPS_IP/api"
echo "   - API 文档: http://$VPS_IP/docs"
echo ""
echo "🔧 管理命令："
echo "   - 查看后端日志: journalctl -u focusai-backend -f"
echo "   - 重启后端: systemctl restart focusai-backend"
echo "   - 重启 Nginx: systemctl restart nginx"
echo ""
echo "⚠️  下一步："
echo "   1. 编辑 /opt/focusai/backend/.env 配置文件"
echo "   2. 重启后端服务: systemctl restart focusai-backend"
echo ""
