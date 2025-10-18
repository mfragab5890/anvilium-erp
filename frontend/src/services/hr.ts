import api from '../api'

export type Employee = {
  id: number; code?: string; first_name: string; last_name: string;
  email?: string; phone?: string; branch_id?: number; status?: string;
  hire_date?: string|null; termination_date?: string|null; base_salary?: number|null;
  meta?: any;
}

export async function getEmployees(q='') {
  const { data } = await api.get('/hr/employees', { params: { q } })
  return data as Employee[]
}
export async function createEmployee(payload: Partial<Employee>) {
  const { data } = await api.post('/hr/employees', payload)
  return data as Employee
}
export async function updateEmployee(id: number, payload: Partial<Employee>) {
  const { data } = await api.patch(`/hr/employees/${id}`, payload)
  return data as Employee
}
export async function deleteEmployee(id: number) {
  const { data } = await api.delete(`/hr/employees/${id}`)
  return data as { deleted: boolean }
}
