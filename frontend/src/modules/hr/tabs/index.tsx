import { Navigate } from 'react-router-dom'

export default function HrIndexRedirect() {
  // When user hits /app/hr, redirect into the employees tab
  return <Navigate to="/app/hr/employees" replace />
}
