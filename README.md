# ANVILIUM ERP

## Overview

ANVILIUM is an end-to-end Enterprise Resource Planning (ERP) system tailored for industrial service providers in mechanical, electrical, and civil sectors. Designed for comprehensive traceability (who/what/when/where/cost) and actionable insights, it reduces waste, improves margins, and accelerates growth. The platform supports phased deployment, English/Arabic localization, multi-branch operations, and standard workflows from proposals to project closeout, inventory management, HR/payroll, financials, and compliance.

Key design principles include business-first phrasing, role-based access, one source of truth for modules/tabs, and UAE-ready features like national holidays and document expiries. For full business specifications, refer to the [Industrial Services Provider ERP Specs](Industrial_Services_Provider_ERP_Specs.docx).

## Tech Stack

- **Backend**: Flask 3 with SQLAlchemy 2.x, Alembic for migrations, JWT for authentication, and CORS for cross-origin requests.
- **Frontend**: React 18 with TypeScript, Vite for build tooling, Material-UI (MUI) for components, and Axios for API integration.
- **Database**: Configurable (SQLite for dev, PostgreSQL/MySQL for prod) with modular blueprints for scalability.
- **Additional**: i18next for internationalization, React Router for dynamic navigation, and server-side grids for data tables.

## Architecture & Flow

The system uses a modular architecture:
- **Backend Modules**: Organized as blueprints (e.g., auth, users, hr, admin) under `/api/*` endpoints, with DB models ensuring traceability and soft deletes.
- **Frontend Modules**: Dynamic routing loads components from `src/modules/**/tabs/**/index.tsx`, preserving backend order and lock states.
- **Key Flow**: User authentication → Role-based module access → CRUD operations with full audit trails → Reports and notifications for insights.

Data flows from DB (source of truth) to API endpoints, then to React components, ensuring real-time traceability for projects, inventory, and HR.

## Current Features & Modules

### Implemented Modules
- **Users & Access**: User management, roles/permissions, profiles, audit logs, and session control.
- **Human Resources**: Employee data, attendance/timesheets, leave management, payroll integration, recruitment, and document expiries.
- **Projects & Delivery**: Project boards, planning, resource assignments, consumption tracking, variations, and closeout.
- **Admin (Internal)**: Module/tab management, branches, holidays, and system settings.
- **Core Behaviors**: Issue reporting, bulk imports, document attachments, and notification rules across modules.

### Planned/Partial Features
- **Proposals & Quotations**: Services catalog, templates, price lists, and PDF generation (next vertical slice).
- **Inventory & Assets**: Stores, items with condition states, issue/return, transfers, stocktaking, maintenance, and depreciation (per-use and days-of-usage).
- **Financials**: Invoices, expenses, payments, AR/AP, cost centers, and payroll journals.
- **Reports & Analytics**: Dashboards, ops/finance/HR/inventory reports, and custom report builder.
- **Notifications & Documents**: Advanced rules, channels (email/SMS), and expiry monitoring.
- **Task Lists & Shared Attachments**: Cross-module task management with notes, attachments, and public shares.

Refer to the business rules in the specs for detailed logic (e.g., inventory depreciation modes, HR payroll derivation).

## Installation & Setup

### Prerequisites
- Python 3.8+ (for backend)
- Node.js 16+ and npm (for frontend)
- Git for version control

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/anvilium-erp.git
   cd anvilium-erp
   ```

2. **Backend Setup**:
   - Navigate to `backend/`:
     ```bash
     cd backend
     python -m venv .venv
     source .venv/bin/activate  # On Windows: .venv\Scripts\activate
     pip install -r requirements.txt
     ```
   - Set up environment variables (copy `.env.dev` to `.env` and configure DB, JWT secrets, etc.):
     ```env
     APP_ENV=dev
     DATABASE_URI=sqlite:///instance/dev.db
     JWT_SECRET_KEY=your-secret
     ```
   - Run migrations:
     ```bash
     flask db upgrade
     ```
   - Seed data (if needed):
     ```bash
     flask shell
     >>> from modules import seed_admin_if_empty
     >>> seed_admin_if_empty()
     ```

3. **Frontend Setup**:
   - Navigate to `frontend/`:
     ```bash
     cd ../frontend
     npm install
     ```

4. **Run the Application**:
   - **Backend**: In `backend/`, run `flask run` (or `python app.py`).
   - **Frontend**: In `frontend/`, run `npm run dev`.
   - Access at `http://localhost:5000` (backend) and `http://localhost:5173` (frontend).

For production, configure `.env.prod` with a production database and deploy to a platform like Render (monorepo setup recommended).

## Usage

- **Authentication**: Log in via `/api/auth/login` with admin credentials (from `.env`).
- **Navigation**: Use the side nav to access modules based on roles; tabs reflect backend order and locks.
- **Key Workflows**:
  - Create users/roles in Admin.
  - Manage employees and attendance in HR.
  - Track projects from planning to closeout.
- **Customization**: Modules/tabs are centrally managed in Admin; extend via new blueprints/components.

## Development & Contributing

### Adding New Modules
1. Create a blueprint in `backend/modules/newmodule/`.
2. Define models and routes.
3. Add frontend tabs in `src/modules/newmodule/tabs/`.
4. Register in `modules/__init__.py` and update seeds if needed.

### Code Style
- Follow PEP 8 for Python; use TypeScript for React.
- Run linters: `flake8` (backend) and `eslint` (frontend).
- Test locally before pushing.

### Issues & Contributions
- Report bugs via GitHub Issues.
- Fork, branch, and submit PRs for enhancements.

## License

This project is proprietary. Contact the maintainers for usage rights.

## Contact

- **Maintainer**: ANVILIUM Team
- **Email**: support@anvilium.com
- **Documentation**: See [ERP Specs](Industrial_Services_Provider_ERP_Specs.docx) for business details.

---

*Built for industrial excellence—trace, optimize, grow.*
