# Frontend - Space Cargo Stowage Mgmt System

This folder contains the frontend implementation of our Space Container Management System. Built with React and TypeScript, the application provides an intuitive interface for managing storage containers, items, and their placement in a space station environment. It utilizes Material-UI (MUI) for a consistent and responsive design, and integrates Three.js for 3D visualization of container contents.

The frontend communicates with a backend API to fetch, create, and manipulate container and item data, ensuring efficient space utilization and placement optimization for space missions.

## Project Overview

The frontend is designed to address key functionalities:
- **Container Management**: Add, import, and list storage containers with their dimensions and zones.
- **Item Placement**: Visualize, simulate, and execute item placement within containers, prioritizing space efficiency and mission-critical requirements.
- **Real-Time Visualization**: Display 3D representations of containers and their contents using Three.js.
- **User Interaction**: Enable manual and automated placement strategies with simulation capabilities.

This codebase is modular and extensible, allowing seamless addition of new views, components, and services as the project evolves.

## Directory Structure


```
frontend/
├── public/                  # Static assets (e.g., icons, index.html)
├── src/                     # Source code
│   ├── App.tsx              # Root component with routing and theme setup
│   ├── index.tsx            # Entry point for React rendering
│   ├── components/          # Reusable UI components grouped by feature
│   │   ├── common/          # Shared components (e.g., Header, Sidebar)
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── containers/      # Container-related components
│   │   │   ├── ContainersList.tsx    # Displays list of containers
│   │   │   ├── ContainerForm.tsx     # Form for adding a new container
│   │   │   └── ContainerImport.tsx   # Import containers from CSV/Excel
│   │   ├── items/           # Item-related components (extendable)
│   │   │   ├── ItemsList.tsx
│   │   │   ├── ItemForm.tsx
│   │   │   └── ItemImport.tsx
│   │   └── placement/       # Placement-related components
│   │       ├── PlacementView.tsx      # Main view for item placement
│   │       ├── ContainerVisualizer.tsx # 3D visualization of a container
│   │       ├── ContainerGrid.tsx      # Grid of containers by zone
│   │       ├── ItemPlacement.tsx      # Table of items with placement status
│   │       └── PlacementControls.tsx  # Controls for placement execution
│   ├── services/            # API service modules
│   │   ├── api.ts           # Axios instance for API calls
│   │   ├── containerService.ts  # Container-related API functions
│   │   ├── itemService.ts       # Item-related API functions
│   │   └── placementService.ts  # Placement-related API functions
│   ├── types/               # TypeScript type definitions
│   │   ├── Container.ts     # Container interfaces
│   │   ├── Item.ts          # Item interfaces
│   │   └── Placement.ts     # Placement-related interfaces
│   ├── utils/               # Utility functions
│   │   ├── colors.ts        # Color generation for visualization
│   │   └── spatial.ts       # Spatial calculations (extendable)
│   └── styles/              # Styling configuration
│       └── theme.ts         # MUI theme customization
└── package.json             # Dependencies and scripts
```

### Key Components and Flow

1. **`App.tsx`**  
   - Acts as the entry point for routing and wraps the app with a Material-UI theme.
   - Uses `react-router-dom` to define routes (e.g., `/containers`, `/placement`).
   - Integrates `Header` and `Sidebar` for consistent navigation.

2. **`components/`**  
   - Organized by feature (e.g., `containers/`, `placement/`) to keep related UI logic together.
   - New features (e.g., waste management, retrieval) can be added as subfolders with their own components.
   - Example: `ContainersList.tsx` fetches data via `containerService.ts` and renders a table, with dialogs for adding (`ContainerForm.tsx`) or importing (`ContainerImport.tsx`) containers.

3. **`placement/`**  
   - Core feature for the hackathon: `PlacementView.tsx` orchestrates container selection, item listing, and placement controls.
   - `ContainerVisualizer.tsx` uses Three.js to render a 3D view of a selected container, showing placed items and placement suggestions.
   - `PlacementControls.tsx` allows users to select items, toggle simulation mode, and run placement algorithms.

4. **`services/`**  
   - Contains API call logic (e.g., `getContainers()`, `placeItems()`).
   - Each service file corresponds to a backend endpoint group (e.g., `/containers`, `/placement`).
   - Extend this folder with new service files (e.g., `wasteService.ts`) as backend APIs grow.

5. **`types/`**  
   - Defines shared TypeScript interfaces (e.g., `Container`, `Item`, `PlacementResult`).
   - New types can be added here and imported across components and services.

6. **`utils/`**  
   - Houses reusable functions like `stringToColor()` for consistent visualization.
   - Additional utilities (e.g., volume calculations, sorting) can be added here.

## Getting Started

Follow these steps to set up and run the Space Container Management System frontend locally. Since this frontend relies on a backend API, instructions for starting the backend are also included.

### Prerequisites

- **Node.js**: Version 16.x or higher (includes npm).
- **Python**: Version 3.9 or higher (for the backend).
- **Git**: For cloning the repository.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd frontend/
```

### 2. Install Frontend Dependencies

Navigate to the `frontend/` directory and install the required packages:

```bash
npm install
```


### 3. Start the Backend (Required)

The frontend communicates with a backend API at `http://localhost:8000/api`. Before running the frontend, ensure the backend is active.

#### Backend Activation Steps

1. **Navigate to the Backend Directory**  
   From the project root:

   ```bash
   cd backend/
   ```

2. **Set Up a Virtual Environment**  
   Create and activate a virtual environment:

   - On Windows:
     ```bash
     python -m venv .venv
     .\.venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Backend Dependencies**  
   With the virtual environment active, install the required packages:

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Backend Server**  
   Start the FastAPI server with Uvicorn, enabling hot-reloading for development:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   - `--reload`: Automatically restarts the server on code changes.
   - `--host 0.0.0.0`: Makes the server accessible externally.
   - `--port 8000`: Default port (adjust if needed).

   Verify the backend is running by visiting `http://localhost:8000/docs` in your browser, which displays the API documentation.

### 4. Run the Frontend

With the backend running, return to the `frontend/` directory and start the development server:

```bash
cd ../frontend/
npm start
```

The app will launch at `http://localhost:3000`. Open this URL in your browser to interact with the application.

### 5. Build for Production (Optional)

To create a production-ready bundle:

```bash
npm run build
```

The optimized output will be in the `build/` folder, ready for deployment.


## Adding New Features

To integrate new functionality:
- **Components**: Create a new subfolder under `components/` (e.g., `waste/`) and add related `.tsx` files. Import them into `App.tsx` and define a route.
- **Services**: Add a new service file in `services/` (e.g., `wasteService.ts`) with API calls, and use it in your components.
- **Types**: Define new interfaces in `types/` if your feature introduces new data structures.
- **Styling**: Update `theme.ts` for consistent design across new components.

For example, to add a "Waste Management" view:
1. Create `components/waste/WasteView.tsx`.
2. Add `wasteService.ts` with functions like `getWasteItems()`.
3. Update `App.tsx` with a new route: `<Route path="/waste" element={<WasteView />} />`.

## Key Features in Action

- **Container Management**: Navigate to `/containers` to view, add, or import containers. The `ContainersList.tsx` component fetches data on mount and refreshes after updates.
- **Item Placement**: Go to `/placement` to select containers, visualize their contents, and place items. The 3D visualization updates in real-time as items are added.
- **Simulation Mode**: Toggle simulation in `PlacementControls.tsx` to test placement without affecting the backend.

## Dependencies

- **React & TypeScript**: Core framework and type safety.
- **Material-UI**: UI components and theming.
- **Three.js**: 3D visualization for containers.
- **Axios**: API communication.
- **react-router-dom**: Client-side routing.

See `package.json` for the full list and versions.

## Notes for Development

- The backend API is assumed to be at `http://localhost:8000/api`. Update `services/api.ts` if the URL changes.
- The 3D visualization in `ContainerVisualizer.tsx` requires careful management of Three.js objects to avoid memory leaks—ensure cleanup in `useEffect` hooks.
- Components are designed to be reusable; leverage props (e.g., `onClose`, `onRefresh`) to maintain consistency across dialogs and views.



For questions or contributions, feel free to open an issue or pull request on the repository!
