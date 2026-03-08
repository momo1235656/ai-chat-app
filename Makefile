# ============================================================
# AI Chat — Makefile
# ============================================================

# GCP settings
PROJECT_ID   := ai-chat-489616
REGION       := asia-northeast1
SERVICE      := ai-chat
REPO         := ai-chat
IMAGE        := $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(REPO)/app

# Derive a short git SHA for tagging (fallback to "latest" if not in a git repo)
GIT_SHA      := $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")

.PHONY: help install dev build type-check lint \
        docker-build docker-push docker-run \
        gcp-setup deploy logs

# ------------------------------------------------------------
# Default: show help
# ------------------------------------------------------------
help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "  Development"
	@echo "  ----------"
	@echo "  install       Install npm dependencies"
	@echo "  dev           Start development server (http://localhost:3000)"
	@echo "  build         Build Next.js for production"
	@echo "  type-check    Run TypeScript type check"
	@echo "  lint          Run ESLint"
	@echo ""
	@echo "  Docker"
	@echo "  ------"
	@echo "  docker-build  Build Docker image locally"
	@echo "  docker-run    Run Docker image locally (requires .env.local)"
	@echo "  docker-push   Push image to Artifact Registry"
	@echo ""
	@echo "  GCP / Cloud Run"
	@echo "  ---------------"
	@echo "  gcp-setup     Enable APIs & create Artifact Registry repo (run once)"
	@echo "  deploy        Build → Push → Deploy to Cloud Run"
	@echo "  logs          Tail Cloud Run logs"
	@echo ""

# ------------------------------------------------------------
# Development
# ------------------------------------------------------------
install:
	npm install

dev:
	npm run dev

build:
	npm run build

type-check:
	npm run type-check

lint:
	npm run lint

# ------------------------------------------------------------
# Docker
# ------------------------------------------------------------
docker-build:
	docker build -t $(IMAGE):$(GIT_SHA) -t $(IMAGE):latest .

docker-run:
	docker run --rm -p 3000:3000 --env-file .env.local $(IMAGE):latest

docker-push:
	docker push $(IMAGE):$(GIT_SHA)
	docker push $(IMAGE):latest

# ------------------------------------------------------------
# GCP — one-time setup
# ------------------------------------------------------------
gcp-setup:
	gcloud config set project $(PROJECT_ID)
	gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
	gcloud artifacts repositories create $(REPO) \
		--repository-format=docker \
		--location=$(REGION) \
		--description="AI Chat Docker images" || true
	gcloud auth configure-docker $(REGION)-docker.pkg.dev --quiet

# ------------------------------------------------------------
# Deploy (build → push → Cloud Run)
# ------------------------------------------------------------
deploy: docker-build docker-push
	gcloud run deploy $(SERVICE) \
		--image $(IMAGE):$(GIT_SHA) \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--min-instances 0 \
		--set-env-vars NODE_ENV=production,OPENAI_API_KEY=$$OPENAI_API_KEY,MONGODB_URI=$$MONGODB_URI
	@echo ""
	@echo "Deployed URL:"
	@gcloud run services describe $(SERVICE) --region $(REGION) --format "value(status.url)"

# ------------------------------------------------------------
# Logs
# ------------------------------------------------------------
logs:
	gcloud run services logs tail $(SERVICE) --region $(REGION)
