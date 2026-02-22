@echo off
chcp 65001 >nul
cd /d "%~dp0medicine-box-app"

echo.
echo ========================================
echo   智能药盒APP - 快速启动
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] 检查 Node.js... 已安装
node --version

REM 检查 npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 npm
    pause
    exit /b 1
)

echo [2/3] 检查 npm... 已安装
npm --version

REM 检查 node_modules
if not exist "node_modules\" (
    echo.
    echo [3/3] 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [3/3] 依赖安装完成
) else (
    echo [3/3] 依赖已安装
)

echo.
echo ========================================
echo   所有检查完成！
echo ========================================
echo.
echo 启动应用...
echo.

REM 启动 Expo 开发服务器
npm start

pause
