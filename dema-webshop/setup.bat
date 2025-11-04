@echo off
echo Setting up DemaWebshop project...

cd /d %~dp0

:: Install dependencies
echo Installing dependencies...
npm install

:: Install TypeScript and type definitions
echo Installing TypeScript and type definitions...
npm install -D typescript @types/react @types/node @types/react-dom

:: Install Next.js and React
echo Installing Next.js and React...
npm install next@latest react@latest react-dom@latest

:: Install Tailwind CSS and plugins
echo Installing Tailwind CSS...
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms
npx tailwindcss init -p

:: Install additional dependencies
echo Installing additional dependencies...
npm install @heroicons/react next-auth react-hook-form zod

echo.
echo Setup complete! Run 'npm run dev' to start the development server.
pause
