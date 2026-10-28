# Personal Expense Tracker Web App

A full-stack web application to manage personal expenses, track spending, and visualize category-wise expenses using interactive charts.

## Features

- User registration and login
- JWT-based authentication
- Add, view, edit, and delete expenses
- Calculate total expenses
- Category-wise expense summaries
- Pie chart for expense distribution
- Bar chart for category comparisons
- Responsive dashboard interface
- SQLite database integration

## Technologies Used

**Frontend:** React, Vite, Tailwind CSS, Chart.js, React Chart.js 2

**Backend:** Python, FastAPI, SQLAlchemy

**Database:** SQLite

**Authentication:** JWT

## Project Structure

```text
personal-expense-tracker/
├── backend/
│   ├── auth.py
│   ├── database.py
│   ├── init_db.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── security.py
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- Git

### Start the Backend

From the project root, run:

```powershell
cd backend
..\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

API documentation: http://127.0.0.1:8000/docs

### Start the Frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Security

- Keep environment variables and secret keys private.
- Do not upload `.env` files or private database records.
- Configure your own environment variables when setting up the project on another computer.

## Author

Sandhya Veldhi
