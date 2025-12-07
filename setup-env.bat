@echo off
echo Setting up environment files...

if not exist "backend\.env" (
    echo Creating backend/.env from template...
    copy backend\env.template backend\.env >nul
    echo ✓ Backend .env created
) else (
    echo Backend .env already exists, skipping...
)

if not exist "frontend\.env" (
    echo Creating frontend/.env from template...
    copy frontend\env.template frontend\.env >nul
    echo ✓ Frontend .env created
) else (
    echo Frontend .env already exists, skipping...
)

echo.
echo ⚠️  IMPORTANT: Update the .env files with your actual credentials:
echo    - backend/.env: Database, JWT secrets, OpenAI API key
echo    - frontend/.env: API URL (if different from default)
echo.
echo Setup complete!

