# API Contracts

## Purpose
Define backend API behavior that mobile and backend teams must treat as stable contract.

## Base URL Convention
- Development: http://localhost:<port>/api/v1
- Production: https://api.glunity.com/api/v1

## Response Envelope (Mandatory)

Success envelope:

```json
{
	"success": true,
	"data": {},
	"message": "",
	"pagination": {
		"page": 1,
		"limit": 20,
		"total": 0,
		"pages": 0
	}
}
```

Error envelope:

```json
{
	"success": false,
	"message": "",
	"errors": [
		{
			"field": "",
			"code": "",
			"detail": ""
		}
	]
}
```

## Status Code Policy
- 200: successful read/update/delete action
- 201: resource created
- 204: success with no response body where appropriate
- 400: validation error
- 401: authentication required or invalid token
- 403: authenticated but not authorized
- 404: resource not found
- 409: conflict (duplicate or invariant violation)
- 422: semantic request error where needed
- 429: rate limited
- 500: unhandled server error

## Pagination Contract
- All list endpoints must support page and limit
- Default limit 20
- Maximum limit 100
- Include pagination object on list responses

## Filtering and Sorting Contract
- Filter parameters are explicit and documented per endpoint
- Sorting format: sort=<field>:asc|desc
- Reject unsupported filters with 400

## Authentication Contract
- Authorization header format: Bearer <token>
- Access token used for protected endpoints
- Refresh token used only with refresh endpoint

## Idempotency
- Read endpoints must be idempotent
- Update endpoints should be idempotent where possible
- Sensitive create actions may use idempotency keys

## Realtime Event Contract
- Event names are snake_case
- Payload has deterministic shape
- Every new event requires docs update in this file

## Core Endpoint Groups
- auth
- users
- locations
- products
- recipes
- events
- channels/messages
- seller dashboard
- notifications
- search

## Backward Compatibility Policy
- Additive changes (new optional fields) are allowed
- Removing or renaming fields is breaking change
- Breaking changes require version bump or migration window

## Contract Review Checklist
- Envelope shape preserved
- Status code is correct
- Validation errors are explicit
- Pagination present on list response
- No sensitive fields leaked

