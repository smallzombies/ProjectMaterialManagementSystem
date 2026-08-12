import { createContext, useContext, useState, ReactNode } from 'react'

export interface User {
  id: string
  username: string
  email?: string
  avatar?: string
  role?: string
}

interface AppState {
  currentUser: User | null
  login: (user: User) => void
  logout: () => void
}

const AppContext = createContext<AppState | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

  const login = (user: User) => {
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <AppContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
