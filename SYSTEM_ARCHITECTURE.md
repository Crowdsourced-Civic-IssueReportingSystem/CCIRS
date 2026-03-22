## CCIRS System Architecture

```mermaid
flowchart LR
	A[Citizen App\nWeb and Mobile UI] --> B[API Gateway\nExpress + Firebase Auth]
	B --> C[AI Classification\nTensorFlow Lite Router]
	C --> D[Department Allocation]
	B --> E[Issue Store\nPostgreSQL / Geospatial]
	B --> F[Media and Geotag Metadata]
	B --> G[Transparency Ledger\nTamper-evident chain]
	G --> H[Public Transparency Dashboard]
	E --> H
	D --> H
	H --> I[Live Status Updates\nPolling + Toast Notifications]
```

### Data Path Summary

1. Citizen submits text, photos, voice note, and location.
2. API validates consent and authentication.
3. AI classifies issue and routes it to the responsible department.
4. Issue and geospatial metadata are persisted.
5. Ledger events are recorded for timeline integrity.
6. Dashboard and transparency feed render live progress and alerts.
