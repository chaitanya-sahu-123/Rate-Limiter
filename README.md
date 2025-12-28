# Redis-Based Rate Limiter

A high-performance, Redis-based Rate Limiter middleware implementing the **Fixed Window algorithm** for Node.js applications. Designed to handle **500+ requests per second** with consistent and reliable rate limiting to prevent API abuse.

## Features

- **High Performance**: Handles 500+ requests per second
- **Fixed Window Algorithm**: Fair API usage enforcement with time windows
- **Redis Backend**: Distributed rate limiting with Redis for scalability
- **Multiple Rate Limiting Policies**: Default (100/min), API (500/min), Strict (10/min)
- **Real-time Metrics**: Built-in monitoring and analytics

## Quick Start

```bash
# Install dependencies
npm install

# Start Redis (WSL or local)
redis-server --port 6379

# Start the server
npm start

# Test the API
curl -H "user-id: test_user" http://localhost:7005/ping

# Run load test (10,000 requests)
npm run test

# Run interactive demo
npm run demo
```

## Architecture

### Fixed Window Algorithm
- **Time Windows**: 60-second fixed intervals
- **Request Counting**: Atomic Redis operations for accuracy
- **Limit Enforcement**: Blocks requests exceeding limits
- **Window Reset**: Automatic counter reset at boundaries

### Rate Limiting Policies
| Policy | Window | Max Requests | Use Case |
|--------|--------|--------------|----------|
| **Default** | 60s | 100 | General endpoints |
| **API** | 60s | **500** | High-throughput APIs |
| **Strict** | 60s | 10 | Authentication |

## API Endpoints

- `GET /ping` - Basic endpoint with default rate limiting
- `GET /api/users` - High throughput API (500 req/min)
- `POST /auth/login` - Strict rate limiting (10 req/min)
- `GET /metrics` - Real-time performance metrics
- `GET /health` - Server health check

## Technical Implementation

- **Redis Integration**: ioredis with connection pooling
- **Atomic Operations**: Pipeline operations for consistency
- **Error Handling**: Graceful degradation and fail-open design
- **Standard Headers**: RFC-compliant rate limit headers
- **Monitoring**: Real-time metrics and health checks

---

*Built for enterprise-grade API protection with proven performance*
