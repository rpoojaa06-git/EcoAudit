# Security Specification for EcoAudit Ledger

## Data Invariants
1. **Category Validity**: The category field must be one of the six predefined categories: `PLASTIC`, `E-WASTE`, `ORGANIC`, `METAL`, `GLASS`, `OTHER`.
2. **Weight Positive**: The weight field must be a number greater than 0 and less than or equal to 10000 kg.
3. **Coordinates Bounds**: Latitude must be between -90 and 90 or null. Longitude must be between -180 and 180 or null.
4. **Immutability (Ledger Contract)**: Logs represent an immutable ledger of community waste audits. Once created, a log cannot be modified or deleted by standard clients.
5. **Id Schema**: The document ID must be a non-empty string.

## The "Dirty Dozen" Payloads (Invariants Verification)
Here are 12 malicious or malformed payloads designed to break system invariants:

1. **Negative Weight**:
```json
{
  "category": "PLASTIC",
  "weight": -5.5,
  "latitude": 28.6139,
  "longitude": 77.2090,
  "isVerified": true,
  "notes": "Malicious weight"
}
```

2. **Zero Weight**:
```json
{
  "category": "E-WASTE",
  "weight": 0,
  "latitude": 28.6139,
  "longitude": 77.2090,
  "isVerified": true,
  "notes": "Zero weight"
}
```

3. **Invalid Category**:
```json
{
  "category": "HAZARDOUS_NUKE_WASTE",
  "weight": 12.4,
  "latitude": 28.6139,
  "longitude": 77.2090,
  "isVerified": false,
  "notes": "Invalid category"
}
```

4. **Out of bounds Latitude**:
```json
{
  "category": "METAL",
  "weight": 5.0,
  "latitude": 120.0,
  "longitude": 77.2090,
  "isVerified": true
}
```

5. **Out of bounds Longitude**:
```json
{
  "category": "GLASS",
  "weight": 3.0,
  "latitude": 28.6139,
  "longitude": -200.0,
  "isVerified": true
}
```

6. **String Weight instead of Number**:
```json
{
  "category": "PLASTIC",
  "weight": "12.5",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "isVerified": true
}
```

7. **Extremely large reporterName (DDoS/Overflow)**:
```json
{
  "category": "PLASTIC",
  "weight": 2.5,
  "reporterName": "A".repeat(10000)
}
```

8. **Extremely large notes field (DDoS/Overflow)**:
```json
{
  "category": "PLASTIC",
  "weight": 2.5,
  "notes": "A".repeat(10000)
}
```

9. **Modifying an existing log (Update breach)**:
```json
{
  "weight": 100.0,
  "notes": "Overwriting a verified entry manually"
}
```

10. **Deleting an audit log entry (Integrity breach)**:
- Action: `DELETE /databases/{database}/documents/logs/{docId}`

11. **Malformed category type**:
```json
{
  "category": true,
  "weight": 5.5
}
```

12. **Missing required weight field**:
```json
{
  "category": "PLASTIC"
}
```

## Security Rules Implementation Strategy
We enforce public read and write (create) for standard logs so that anonymous community eco-citizens can participate, but strictly enforce shape validation on create and deny all update and delete actions to preserve ledger integrity.
