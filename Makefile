# Makefile

# Define the directories for frontend and backend
FRONTEND_DIR := frontend
BACKEND_DIR := ../backend

# Define the commands for frontend
FRONTEND_START_CMD := npm start
FRONTEND_BUILD_CMD := npm run build
FRONTEND_TEST_CMD := npm test

# Define the command for backend
BACKEND_START_CMD := python -m uvicorn backend.app.main:app --reload 

# Target to start the frontend server
start-frontend:
	@echo "Starting frontend server..."
	$(FRONTEND_START_CMD)

# Target to build the frontend
build-frontend:
	@echo "Building frontend..."
	$(FRONTEND_BUILD_CMD)

# Target to test the frontend
test-frontend:
	@echo "Testing frontend..."
	$(FRONTEND_TEST_CMD)

# Target to start the backend server
start-backend:
	@echo "Starting backend server..."
	@$(BACKEND_START_CMD)

# Default target
.PHONY: start-frontend build-frontend test-frontend start-backend