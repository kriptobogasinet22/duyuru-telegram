"use client"

import * as React from "react"

// Tabs bileşeni için basit bir implementasyon
// Radix UI'ın TabsPrimitive'ini taklit eder

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className = "" }) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange })
        }
        return child
      })}
    </div>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

const TabsList: React.FC<TabsListProps> = ({ children, className = "" }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  onValueChange?: (value: string) => void
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = "", onValueChange }) => {
  const parentValue = React.useContext(TabsContext)
  const isActive = parentValue === value

  const handleClick = () => {
    if (onValueChange) {
      onValueChange(value)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive ? "bg-background text-foreground shadow-sm" : ""
      } ${className}`}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

const TabsContext = React.createContext<string>("")

const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = "" }) => {
  const parentValue = React.useContext(TabsContext)
  const isActive = parentValue === value

  if (!isActive) return null

  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </div>
  )
}

// TabsProvider bileşeni, TabsContext'i sağlar
interface TabsProviderProps {
  value: string
  children: React.ReactNode
}

const TabsProvider: React.FC<TabsProviderProps> = ({ value, children }) => {
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

// Tabs bileşenini TabsProvider ile sarmalayın
const TabsWithProvider: React.FC<TabsProps> = (props) => {
  return (
    <TabsProvider value={props.value}>
      <Tabs {...props} />
    </TabsProvider>
  )
}

export { TabsWithProvider as Tabs, TabsList, TabsTrigger, TabsContent }
