# Task Management Frontend

## Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

### 2. Set up .env

```bash
    cp .env.example .env
    # fill
```

### 3. Start the development server

```bash
   npm run dev
   ```

## Project Structure

```
task-management-frontend/
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── tasks/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── api.ts
├── .env.example
├── .gitignore
├── Dockerfile
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md

```

Try the application [here](https://go-invoice-frontend-58444507601.asia-southeast1.run.app)