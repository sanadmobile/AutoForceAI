# Digital Employee Platform Workspace

## Architecture Overview

Access various components of the Digital Employee Platform system:

### 1. Control Plane (Frontend)
- **Path**: `apps/web-console`
- **Tech**: Next.js 14, React, Tailwind CSS
- **Purpose**: User dashboard for monitoring, optimizing, and verifying.

### 2. Data Plane (Core API)
- **Path**: `services/geo-brain`
- **Tech**: FastAPI, Python 3.12, SQLite/PostgreSQL
- **Purpose**: Central nervous system. Handles analysis logic, database, and integrations.

### 3. Execution Plane (Robots)
- **Path**: `services/rpa-worker`
- **Tech**: Python, Selenium/Playwright
- **Purpose**: Distributed agents for content posting and data gathering.

### 4. Content Plane (Generation)
- **Path**: `services/digital-human` (Planned)
- **Tech**: Multimedia GenAI
- **Purpose**: Avatar rendering and video production.
