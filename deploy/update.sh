#!/bin/bash
# ============================================
# FocusAI 更新脚本
# 使用方法: bash update.sh
# ============================================

set -e

echo "🔄 开始更新 FocusAI..."

# 拉取最新代码
cd /opt/focusai
git pull

# 更新后端
echo "🐍 更新后端..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart focusai-backend

# 更新前端
echo "⚛️  更新前端..."
cd ../focusai
npm install
npm run build

# 重启 Nginx
systemctl restart nginx

echo "✅ 更新完成！"
