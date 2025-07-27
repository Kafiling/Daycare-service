# Automatic Patient Group Assignment System

This system automatically assigns patients to groups based on their form submission scores and admin-defined rules.

## Components

### 1. Database Schema

The system uses the following tables:

- **`patient_groups`**: Defines available patient groups
- **`group_assignment_rules`**: Defines rules for automatic assignment
- **`patient_group_assignments`**: Tracks assignment history
- **`group_assignment_thresholds`**: (Legacy) Simple threshold-based assignments

### 2. Edge Functions

#### `auto-assign-groups`
- **Purpose**: Automatically assigns patients to groups when form submissions are updated
- **Trigger**: Database trigger on `form_submissions` table
- **Location**: `/supabase/functions/auto-assign-groups/`

#### `manage-groups` 
- **Purpose**: CRUD operations for patient groups
- **Location**: `/supabase/functions/manage-groups/`

### 3. Frontend Components

#### Admin UI: `/admin/manage-group-assignments`
- Create and manage assignment rules
- View patients and their groups
- Manual group assignment
- Assignment history
- Bulk recalculation tools

## Setup Instructions

### 1. Database Setup

Run the migrations in order:
```sql
-- 1. Create patient groups table
\i supabase/migrations/20250127000001_create_patient_groups.sql

-- 2. Create assignment system tables
\i supabase/migrations/20250127000002_create_group_assignment_system.sql

-- 3. Create triggers and functions
\i supabase/migrations/20250127000003_create_group_assignment_triggers.sql
```

### 2. Supabase Edge Functions Setup

Deploy the edge functions:
```bash
# Deploy auto-assign-groups function
supabase functions deploy auto-assign-groups

# Deploy manage-groups function (optional)
supabase functions deploy manage-groups
```

### 3. Environment Setup

Make sure your Supabase environment has:
- HTTP extension enabled (for webhook triggers)
- Proper RLS policies for the new tables
- Service role key configured

### 4. Admin Configuration

1. Navigate to `/admin/manage-group-assignments`
2. Create patient groups if they don't exist
3. Set up assignment rules with:
   - Form configurations and weights
   - Score thresholds
   - Target groups
   - Priority levels

## How It Works

### Automatic Assignment Flow

1. **Trigger**: Patient completes a form submission with a score
2. **Database Trigger**: `trigger_group_assignment()` function fires
3. **Edge Function Call**: Calls `auto-assign-groups` edge function
4. **Rule Evaluation**: 
   - Gets all active assignment rules (ordered by priority)
   - Calculates patient's weighted scores across forms
   - Finds first matching rule
5. **Assignment**: Updates patient's group and logs history

### Rule Configuration Example

```json
{
  "name": "High Risk Patients",
  "group_id": "emergency-group-uuid",
  "rule_type": "score_based",
  "rule_config": {
    "forms": [
      {
        "form_id": "health-assessment",
        "weight": 1.0,
        "threshold": 80
      },
      {
        "form_id": "risk-evaluation", 
        "weight": 2.0,
        "threshold": 70
      }
    ],
    "min_score": 75,
    "operator": "gte"
  },
  "priority": 10
}
```

### Score Calculation

For each rule, the system:
1. Gets patient's latest score for each required form
2. Calculates weighted average: `(score1 × weight1 + score2 × weight2) / (weight1 + weight2)`
3. Checks if weighted average meets the rule threshold
4. Assigns to the first matching rule (highest priority)

## Admin Features

### Rule Management
- **Create Rules**: Define complex scoring rules with multiple forms
- **Priority System**: Higher priority rules are evaluated first
- **Form Weights**: Different forms can have different importance
- **Flexible Thresholds**: Support for ≥, ≤, =, and range operators

### Patient Management
- **View Assignments**: See all patients and their current groups
- **Manual Assignment**: Manually trigger assignment for specific patients
- **Bulk Recalculation**: Recalculate all patient groups

### Monitoring
- **Assignment History**: Track all group changes with reasons
- **Rule Tracking**: See which rules triggered assignments
- **Submission References**: Link assignments to specific form submissions

## API Usage

### Manual Assignment
```typescript
import { manuallyAssignPatientGroup } from '@/app/service/group-assignment';

const result = await manuallyAssignPatientGroup('patient-id');
```

### Bulk Recalculation
```typescript
import { recalculateAllPatientGroups } from '@/app/service/group-assignment';

const result = await recalculateAllPatientGroups();
```

### Database Functions
```sql
-- Manual assignment for one patient
SELECT manually_assign_patient_group('patient-id');

-- Recalculate all assignments
SELECT recalculate_all_patient_groups();
```

## Troubleshooting

### Common Issues

1. **Edge Function Not Triggering**
   - Check that HTTP extension is enabled in Supabase
   - Verify webhook URL in trigger function
   - Check edge function logs

2. **No Group Assignment**
   - Verify patient has completed required forms
   - Check rule priorities and thresholds
   - Ensure rules are active

3. **Incorrect Assignments**
   - Review rule configurations
   - Check form score calculations
   - Verify rule priority order

### Debugging

Enable debug logging in the edge function:
```typescript
console.log('Patient scores:', patientScores);
console.log('Rule evaluation:', rule.name, 'Score:', averageScore);
```

Check Supabase logs:
```bash
supabase functions logs auto-assign-groups
```

## Performance Considerations

- Rules are evaluated in priority order (highest first)
- Only latest submission per form is used
- Assignments are logged for audit trail
- System handles concurrent submissions safely

## Security

- All operations require authentication
- RLS policies protect sensitive data
- Service role used for system operations
- Assignment history is immutable
