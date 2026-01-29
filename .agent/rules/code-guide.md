---
trigger: always_on
---

# React Frontend Development Guidelines

## Core Principles

Follow these fundamental principles for writing clean, maintainable React code:

1. **Write code for humans first, machines second** - Prioritize readability and clarity over cleverness
2. **Keep it simple** - Choose the simplest solution that solves the problem
3. **Be consistent** - Follow the same patterns throughout the codebase
4. **Make it obvious** - Code should be self-documenting; if it needs extensive comments, it might be too complex

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (Button, Input, etc.)
│   └── features/       # Feature-specific components
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── utils/              # Pure utility functions
├── services/           # API calls and external services
├── constants/          # App-wide constants
└── types/              # TypeScript type definitions
```

## Component Design

### Component File Structure

Each component should follow this order:

```javascript
// 1. Imports (group by: React, external libs, internal modules)
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Button } from '@/components/common';

// 2. Types/Interfaces (if using TypeScript)
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

// 3. Component definition
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // 4. Hooks (always at the top, same order every time)
  const [isEditing, setIsEditing] = useState(false);
  const { data: user, isLoading } = useQuery(['user', userId], fetchUser);
  
  // 5. Event handlers and helper functions
  const handleSave = () => {
    // handler logic
  };
  
  // 6. Early returns for loading/error states
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <ErrorMessage />;
  
  // 7. Main render
  return (
    <div>
      {/* component JSX */}
    </div>
  );
}
```

### Component Size and Responsibility

- **One component, one responsibility** - If a component does multiple things, split it
- **Keep components under 200 lines** - If longer, extract smaller components
- **Extract logic into custom hooks** - Keep components focused on rendering
- **Name components clearly** - `UserProfileCard` not `Card`, `SubmitButton` not `Button2`

## Naming Conventions

### Be Descriptive and Consistent

```javascript
// ✅ GOOD - Clear, descriptive names
function UserRegistrationForm() { }
const [isModalOpen, setIsModalOpen] = useState(false);
const handleSubmitButtonClick = () => { };

// ❌ BAD - Vague, unclear names
function Form2() { }
const [open, setOpen] = useState(false);
const handle = () => { };
```

### Standard Naming Patterns

- **Components**: PascalCase - `UserDashboard`, `NavigationBar`
- **Functions/Variables**: camelCase - `getUserData`, `isLoading`
- **Constants**: UPPER_SNAKE_CASE - `MAX_RETRY_COUNT`, `API_BASE_URL`
- **Boolean variables**: Prefix with `is`, `has`, `should` - `isVisible`, `hasPermission`, `shouldUpdate`
- **Event handlers**: Prefix with `handle` - `handleClick`, `handleSubmit`, `handleInputChange`
- **Custom hooks**: Prefix with `use` - `useAuth`, `useLocalStorage`, `useFetchUser`

## State Management

### Keep State Close to Where It's Used

```javascript
// ✅ GOOD - State in the component that needs it
function TodoItem({ todo }) {
  const [isEditing, setIsEditing] = useState(false);
  // Only TodoItem needs this state
}

// ❌ BAD - Unnecessary prop drilling
function TodoList({ todos, editingStates, setEditingStates }) {
  // State passed down unnecessarily
}
```

### Lift State Only When Necessary

Only move state up when multiple components need to share it.

### Use the Right State Management Tool

- **useState**: Simple, local component state
- **useReducer**: Complex state with multiple actions
- **Context**: Share data across many components (avoid prop drilling)
- **External libraries** (Zustand, Redux): Global app state that persists across routes

## Custom Hooks

### Extract Reusable Logic

```javascript
// ✅ GOOD - Reusable hook
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
}

// Usage is clean and simple
function UserSettings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
}
```

### Hook Benefits

- **Remove duplicate code** - Write once, use everywhere
- **Make components simpler** - Components focus on UI, hooks handle logic
- **Easier testing** - Test hooks independently
- **Clear naming** - `useAuth`, `useFetchData` tells you exactly what it does

## Props and Component API

### Design Clear Component APIs

```javascript
// ✅ GOOD - Clear, predictable props
function Button({ 
  children,           // What shows inside
  onClick,            // What happens on click
  variant = 'primary', // How it looks (with default)
  isDisabled = false, // State (with default)
  isLoading = false   // Another state (with default)
}) {
  return (
    <button 
      onClick={onClick} 
      disabled={isDisabled || isLoading}
      className={`btn btn-${variant}`}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}

// ❌ BAD - Unclear, inconsistent props
function Button({ text, click, type, disabled, loading }) {
  // Inconsistent naming, unclear purpose
}
```

### Props Best Practices

- **Use object destructuring** - Makes props explicit
- **Provide default values** - Reduce boilerplate in usage
- **Group related props** - Consider an options object for many related props
- **Be specific with prop names** - `onSave` not `onAction`, `userName` not `name`
- **Keep props minimal** - If passing 10+ props, reconsider the design

## Conditional Rendering

### Keep It Simple and Readable

```javascript
// ✅ GOOD - Clear intent
function UserStatus({ user }) {
  if (!user) {
    return <div>Please log in</div>;
  }
  
  if (user.isPremium) {
    return <PremiumBadge />;
  }
  
  return <StandardBadge />;
}

// ✅ GOOD - Simple ternary for inline conditions
function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      {product.inStock ? (
        <BuyButton />
      ) : (
        <OutOfStockMessage />
      )}
    </div>
  );
}

// ❌ BAD - Nested ternaries (hard to read)
{user ? user.isPremium ? <Premium /> : <Standard /> : <Login />}
```

## Performance Optimization

### Only Optimize When Needed

Don't prematurely optimize. Write clear code first, optimize if you have performance issues.

### When to Use Performance Hooks

```javascript
// Use React.memo for expensive components that re-render often
const ExpensiveChart = React.memo(function Chart({ data }) {
  // Heavy rendering logic
});

// Use useMemo for expensive calculations
function DataTable({ rows }) {
  const sortedRows = useMemo(() => {
    return rows.sort((a, b) => a.value - b.value);
  }, [rows]);
}

// Use useCallback for functions passed as props to memoized components
function Parent() {
  const handleClick = useCallback(() => {
    // handle click
  }, []);
  
  return <MemoizedChild onClick={handleClick} />;
}
```

**Important**: Don't use these everywhere. Only use when you've identified a performance problem.

## Error Handling

### Handle Errors Gracefully

```javascript
// ✅ GOOD - Clear error states
function UserData({ userId }) {
  const { data, isLoading, error } = useQuery(['user', userId], fetchUser);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <ErrorMessage>
        Failed to load user data. Please try again.
      </ErrorMessage>
    );
  }
  
  return <UserProfile data={data} />;
}

// Use Error Boundaries for unexpected errors
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

## Code Organization Tips

### Group Related Code Together

```javascript
// ✅ GOOD - Related code is together
function ShoppingCart() {
  // All cart-related state together
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  
  // All cart-related functions together
  const addItem = (item) => { /* ... */ };
  const removeItem = (id) => { /* ... */ };
  const calculateTotal = () => { /* ... */ };
  
  // Effects together
  useEffect(() => {
    calculateTotal();
  }, [items]);
}
```

### Extract Complex Logic

```javascript
// ✅ GOOD - Complex logic in a separate function
function calculateShippingCost(items, address) {
  let cost = 0;
  // Complex calculation logic here
  return cost;
}

function Checkout({ items, address }) {
  const shippingCost = calculateShippingCost(items, address);
  // Clean component code
}
```

## Comments and Documentation

### Write Self-Documenting Code

```javascript
// ✅ GOOD - Code explains itself
function getUserFullName(user) {
  return `${user.firstName} ${user.lastName}`;
}

// ❌ BAD - Needs comment to explain
function getN(u) {
  // Gets the full name
  return `${u.fn} ${u.ln}`;
}
```

### When to Add Comments

- **Why, not what** - Explain why you made a decision, not what the code does
- **Complex business logic** - Explain business rules that aren't obvious
- **Workarounds** - Explain why you had to do something unusual
- **TODO/FIXME** - Mark technical debt clearly

```javascript
// ✅ GOOD comment
// Using setTimeout instead of useEffect because we need to delay
// the animation to avoid conflict with the parent component's transition
setTimeout(() => setIsVisible(true), 100);

// ❌ BAD comment
// Set isVisible to true
setIsVisible(true);
```

## Testing Considerations

Write code that's easy to test:

- **Pure functions** - Same input always gives same output
- **Small components** - Easier to test in isolation
- **Clear props** - Easy to provide test data
- **Separated logic** - Test business logic separately from UI

```javascript
// ✅ GOOD - Easy to test
function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(price);
}

// This pure function can be tested without React
```

## Common Pitfalls to Avoid

### Don't Mutate State Directly

```javascript
// ❌ BAD
items.push(newItem);
setItems(items);

// ✅ GOOD
setItems([...items, newItem]);
```

### Don't Use Index as Key in Lists

```javascript
// ❌ BAD - Can cause bugs with reordering
{items.map((item, index) => <Item key={index} {...item} />)}

// ✅ GOOD - Use unique, stable ID
{items.map((item) => <Item key={item.id} {...item} />)}
```

### Don't Define Components Inside Components

```javascript
// ❌ BAD - Creates new component on every render
function Parent() {
  function Child() {
    return <div>Child</div>;
  }
  return <Child />;
}

// ✅ GOOD - Component defined outside
function Child() {
  return <div>Child</div>;
}

function Parent() {
  return <Child />;
}
```

## Quick Checklist

Before committing code, ask yourself:

- [ ] Can a new developer understand this in under 2 minutes?
- [ ] Are all names clear and descriptive?
- [ ] Is each component doing only one thing?
- [ ] Are components under 200 lines?
- [ ] Is complex logic extracted into functions or hooks?
- [ ] Are loading and error states handled?
- [ ] Would I be happy to debug this code at 2am?

## Final Principle

**When in doubt, choose clarity over cleverness.** Code is read far more often than it's written. Make it easy for your future self and your teammates.