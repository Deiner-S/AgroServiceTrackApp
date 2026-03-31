@echo off
chcp 65001 >nul

set "NODE_HOME=C:\Users\deiner.souza\Documents\nodejs\node-v24.14.1-win-x64"
set "PROJECT_HOME=C:\Users\deiner.souza\Documents\AgroServiceTrack\AgroServiceTrackApp"

if not exist "%NODE_HOME%\node.exe" (
  echo ERRO: node.exe nao encontrado em "%NODE_HOME%".
  goto :eof
)

if not exist "%NODE_HOME%\npm.cmd" (
  echo ERRO: npm.cmd nao encontrado em "%NODE_HOME%".
  goto :eof
)

if not exist "%PROJECT_HOME%\package.json" (
  echo ERRO: projeto nao encontrado em "%PROJECT_HOME%".
  goto :eof
)

set "PATH=%NODE_HOME%;%NODE_HOME%\node_modules\npm\bin;%PATH%"
cd /d "%PROJECT_HOME%"

echo Ambiente temporario configurado.
echo Node path: %NODE_HOME%
echo Projeto: %PROJECT_HOME%
echo.
echo Pronto. Agora voce pode usar:
echo   node -v
echo   npm -v
echo   npm install
echo   npm test
echo   npm run lint
echo   npx expo start
