# Deployment Skeleton (Docker)

This project uses containerized infrastructure for backend hosting.

## Important
- The mobile app is not hosted as a container for end users.
- Mobile binaries are distributed via App Store / Google Play.
- Containers host backend dependencies and API runtime.

## Production-like compose
- File: docker-compose.yml
- Services: nginx, api, mongo, redis

## Local dev compose
- File: docker-compose.dev.yml
- Services: api, mongo

## Scale API instances
Use compose scaling in environments where this is supported:

```bash
docker compose up -d --build --scale api=3
```

For large production traffic, use orchestrator-based scaling (Kubernetes or Docker Swarm) and managed MongoDB.
