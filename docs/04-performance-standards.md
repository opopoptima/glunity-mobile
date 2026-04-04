# Performance Standards

## Performance Objectives
- Keep API responses predictable under normal load
- Keep mobile screens responsive on mid-range devices
- Ensure list and map experiences remain smooth

## API Targets
- P50 < 200 ms for simple reads
- P95 < 600 ms for typical list endpoints
- P99 < 1200 ms for heavy filtered queries

## Backend Rules
- Paginate all list endpoints
- Avoid unbounded scans
- Select only necessary fields
- Use indexes for filter/sort paths
- Prevent N+1 query patterns

## Index Baseline
- 2dsphere index on location coordinates
- text indexes for search fields
- compound index on channelId + createdAt for message pagination
- index by userId for user-centric collections

## Caching Strategy
- Start without Redis by default
- Add cache only for proven hot paths
- Define TTL and invalidation before enabling cache

## Realtime Performance
- Keep event payload minimal
- Do not broadcast heavy objects
- Apply room-targeted emissions, not global broadcast by default

## Mobile Targets
- First meaningful screen render < 2 seconds on mid-range devices
- List scroll should stay smooth without frame drops
- Avoid blocking JS thread with heavy synchronous operations

## Mobile Rules
- Use FlatList for large lists
- Use stable keyExtractor
- Apply memoization for expensive UI subtrees
- Avoid unnecessary re-renders by splitting state
- Resize media to display dimensions before rendering

## Network Rules
- Standard timeout configured
- Retry only safe idempotent requests
- Show loading and retry states for network operations

## Observability Requirements
- Track endpoint latency, error rate, throughput
- Track mobile screen load timings and crash rate
- Track socket connection failures and reconnect frequency

## Performance Validation Checklist
- Test with realistic payload volume
- Verify indexes on new query paths
- Measure API latency before and after feature merge
- Run mobile smoke test on Android and iOS

