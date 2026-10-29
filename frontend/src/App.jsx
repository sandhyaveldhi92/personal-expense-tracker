
import { useEffect, useState } from 'react'
import './App.css'
import './index.css'
import { apiRequest } from './api/api'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
)


const emptyExpense = {
  title: '',
  amount: '',
  category: 'Food',
  date: new Date().toLocaleDateString('en-CA'),
  description: '',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('access_token'))
  )

  const [authMode, setAuthMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [expenses, setExpenses] = useState([])
  const [expenseForm, setExpenseForm] = useState(emptyExpense)
  const [editingId, setEditingId] = useState(null)

  const [totalExpenses, setTotalExpenses] = useState(0)
  const [categorySummary, setCategorySummary] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadExpenses()
    }
  }, [isAuthenticated])

  async function loadExpenses() {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest('/expenses')
      setExpenses(data)

      const total = data.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      )
      setTotalExpenses(total)

      try {
        const summary = await apiRequest('/expenses/summary/category')
        setCategorySummary(summary.category_expenses || [])
      } catch {
        setCategorySummary([])
      }
    } catch (err) {
      setError(
        'Could not load expenses. Please log in again if your session has expired.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      if (authMode === 'register') {
        await apiRequest('/register', {
          method: 'POST',
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password,
          }),
        })

        setAuthMode('login')
        setPassword('')
        setMessage('Registration successful! Please log in.')
      } else {
        const result = await apiRequest('/login', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        })

        localStorage.setItem('access_token', result.access_token)
        setIsAuthenticated(true)
        setPassword('')
        setMessage('Login successful!')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    setIsAuthenticated(false)
    setExpenses([])
    setTotalExpenses(0)
    setCategorySummary([])
    setExpenseForm(emptyExpense)
    setEditingId(null)
    setError('')
    setMessage('')
    setPassword('')
  }

  function handleExpenseChange(event) {
    const { name, value } = event.target

    setExpenseForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleExpenseSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!expenseForm.title.trim()) {
      setError('Please enter an expense title.')
      return
    }

    if (expenseForm.amount === '' || Number(expenseForm.amount) <= 0) {
      setError('Please enter an amount greater than zero.')
      return
    }

    setSaving(true)

    const payload = {
      title: expenseForm.title.trim(),
      amount: Number(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
      description: expenseForm.description.trim() || null,
    }

    try {
      if (editingId !== null) {
        await apiRequest(`/expenses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setMessage('Expense updated successfully!')
      } else {
        await apiRequest('/expenses', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setMessage('Expense added successfully!')
      }

      setExpenseForm(emptyExpense)
      setEditingId(null)
      await loadExpenses()
    } catch (err) {
      setError(err.message || 'Could not save the expense.')
    } finally {
      setSaving(false)
    }
  }

  function handleEditExpense(expense) {
    setEditingId(expense.id)
    setExpenseForm({
      title: expense.title || '',
      amount: String(expense.amount ?? ''),
      category: expense.category || 'Other',
      date: String(expense.date || '').slice(0, 10),
      description: expense.description || '',
    })
    setError('')
    setMessage('Editing expense. Update the fields and save.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDeleteExpense(expenseId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this expense? This action cannot be undone.'
    )

    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      await apiRequest(`/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (editingId === expenseId) {
        setEditingId(null)
        setExpenseForm(emptyExpense)
      }

      setMessage('Expense deleted successfully!')
      await loadExpenses()
    } catch (err) {
      setError(err.message || 'Could not delete the expense.')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setExpenseForm(emptyExpense)
    setError('')
    setMessage('')
  }

  if (!isAuthenticated) {
    return (
      <main className="main-content auth-container">
        <section className="content-card auth-card">
          <h1>Personal Expense Tracker</h1>
          <p>
            Manage your expenses and understand your spending habits.
          </p>

          <h2>
            {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <label>
                Username
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete={
                  authMode === 'login'
                    ? 'current-password'
                    : 'new-password'
                }
                required
              />
            </label>

            <button type="submit" disabled={saving}>
              {saving
                ? 'Please wait...'
                : authMode === 'login'
                  ? 'Login'
                  : 'Register'}
            </button>
          </form>

          <p>
            {authMode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}
            {' '}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login')
                setError('')
                setMessage('')
              }}
            >
              {authMode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </section>
      </main>
    )
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Expense Tracker</h2>

        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#add-expense">Manage Expenses</a>
          <a href="#recent-expenses">Transactions</a>
        </nav>

        <button type="button" onClick={handleLogout}>
          Log Out
        </button>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Track and manage your personal expenses.</p>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <section className="summary-cards">
          <article className="summary-card">
            <h3>Total Expenses</h3>
            <p>{formatCurrency(totalExpenses)}</p>
          </article>

          <article className="summary-card">
            <h3>Transactions</h3>
            <p>{expenses.length}</p>
          </article>

          <article className="summary-card">
            <h3>Categories Used</h3>
            <p>
              {new Set(expenses.map((expense) => expense.category)).size}
            </p>
          </article>
        </section>

        <section className="content-card" id="add-expense">
          <h2>
            {editingId !== null ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <p>
            {editingId !== null
              ? 'Update the expense details below.'
              : 'Enter the details of your expense.'}
          </p>

          <form className="expense-form" onSubmit={handleExpenseSubmit}>
            <label>
              Expense Title
              <input
                type="text"
                name="title"
                value={expenseForm.title}
                onChange={handleExpenseChange}
                placeholder="e.g. Lunch"
                required
              />
            </label>

            <label>
              Amount (₹)
              <input
                type="number"
                name="amount"
                value={expenseForm.amount}
                onChange={handleExpenseChange}
                placeholder="e.g. 150"
                min="0.01"
                step="0.01"
                required
              />
            </label>

            <label>
              Category
              <select
                name="category"
                value={expenseForm.category}
                onChange={handleExpenseChange}
                required
              >
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Education">Education</option>
                <option value="Health">Health</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                name="date"
                value={expenseForm.date}
                onChange={handleExpenseChange}
                required
              />
            </label>

            <label className="full-width">
              Description (Optional)
              <textarea
                name="description"
                value={expenseForm.description}
                onChange={handleExpenseChange}
                placeholder="Add a note about this expense"
                rows="3"
              />
            </label>

            <div className="full-width form-actions">
              <button type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Save Changes'
                    : '+ Add Expense'}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="content-card" id="recent-expenses">
          <h2>Recent Expenses</h2>

          {loading ? (
            <p>Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <p>No expenses have been added yet.</p>
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById('add-expense')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                + Add Your First Expense
              </button>
            </div>
          ) : (
            <div className="expense-list">
              {expenses.map((expense) => (
                <div className="expense-row" key={expense.id}>
                  <div className="expense-details">
                    <h3>{expense.title}</h3>
                    <p>
                      {expense.category} ·{' '}
                      {String(expense.date).slice(0, 10)}
                    </p>

                    {expense.description && (
                      <small>{expense.description}</small>
                    )}
                  </div>

                  <div className="expense-actions">
                    <strong>{formatCurrency(expense.amount)}</strong>

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEditExpense(expense)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

       
<section className="content-card">
  <h2>Spending by Category</h2>

  {categorySummary.length === 0 ? (
    <p>Add expenses in different categories to see your summary.</p>
  ) : (
    <>
      <div className="category-summary">
        {categorySummary.map((item) => (
          <div className="category-summary-row" key={item.category}>
            <span>{item.category}</span>
            <strong>{formatCurrency(item.total)}</strong>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginTop: '24px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3>Expense Distribution</h3>
          <Pie
            data={{
              labels: categorySummary.map((item) => item.category),
              datasets: [
                {
                  data: categorySummary.map((item) => Number(item.total)),
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { position: 'bottom' },
              },
            }}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <h3>Category Comparison</h3>
          <Bar
            data={{
              labels: categorySummary.map((item) => item.category),
              datasets: [
                {
                  label: 'Expenses (₹)',
                  data: categorySummary.map((item) => Number(item.total)),
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
    </>
  )}
</section>

      </main>
    </div>
  )
}

export default App
