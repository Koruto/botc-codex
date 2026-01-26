# Backend - BotC Grimoire Parser API

FastAPI backend service for parsing Blood on the Clocktower grimoire images.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows**:
     ```bash
     venv\Scripts\activate
     ```
   - **Linux/Mac**:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Project

### Easy Way (Recommended)

Simply run the provided script:

- **Windows (Git Bash or Command Prompt)**:
  ```bash
  ./run.sh
  ```
  or
  ```bash
  run.bat
  ```

- **Linux/Mac**:
  ```bash
  ./run.sh
  ```

The script will automatically activate your virtual environment and start the server.

### Manual Way

1. Make sure you're in the `backend` directory and your virtual environment is activated.

2. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

   The `--reload` flag enables auto-reload on code changes (useful for development).

3. The API will be available at:
   - **API Base URL**: `http://localhost:8000`
   - **Interactive API Docs (Swagger)**: `http://localhost:8000/docs`
   - **Alternative API Docs (ReDoc)**: `http://localhost:8000/redoc`

## Accessing Swagger Documentation

The FastAPI framework automatically generates interactive API documentation using Swagger UI. Here's how to access it:

1. **Start the server** (see "Running the Project" above)

2. **Open your web browser** and navigate to:
   ```
   http://localhost:8000/docs
   ```

3. **Explore the API**:
   - You'll see a list of all available endpoints
   - Click on any endpoint to expand it and see details
   - Click "Try it out" to test endpoints directly from the browser
   - Enter any required parameters and click "Execute"
   - View the response, including status codes and response bodies

4. **Test Endpoints**:
   - **GET /** - Root endpoint to verify the API is running
   - **GET /api/health** - Health check endpoint

## API Endpoints

### Root Endpoint
- **GET** `/`
  - Returns a simple status message confirming the API is running
  - Response includes a link to the documentation

### Health Check
- **GET** `/api/health`
  - Returns the health status of the service
  - Useful for monitoring and health checks

## Development

The project uses FastAPI with automatic API documentation. Any changes to the code will be reflected in the Swagger UI when using `--reload` mode.

## Troubleshooting

- **Port already in use**: If port 8000 is already in use, you can specify a different port:
  ```bash
  uvicorn app.main:app --reload --port 8001
  ```

- **Module not found**: Make sure you're in the `backend` directory and have activated your virtual environment before installing dependencies.

- **Swagger UI not loading**: Ensure the server is running and accessible at `http://localhost:8000` before trying to access the docs.
