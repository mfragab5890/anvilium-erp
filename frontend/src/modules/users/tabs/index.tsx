import { Navigate } from 'react-router-dom'

export default function UsersIndexRedirect() {
  // When user hits /app/users (module only), land on the 'users' tab
  return <Navigate to="/app/users/users" replace />
}
