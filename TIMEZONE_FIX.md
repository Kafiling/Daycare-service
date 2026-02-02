# Timezone Fix for Vercel Deployment

## Problem
When deployed on Vercel, all date and time displays were showing in UTC instead of GMT+7 (Bangkok/Thailand timezone).

## Solution
Created a centralized timezone utility library (`lib/timezone.ts`) that ensures all date/time displays use the Bangkok timezone consistently.

## Usage

### Import the utilities:
```typescript
import { 
  toThaiDate, 
  toThaiTime, 
  toThaiTimeShort, 
  toThaiDateTime,
  getBangkokDate 
} from '@/lib/timezone';
```

### Available Functions:

#### `toThaiDate(dateString)`
Formats a date in Thai format with Bangkok timezone
```typescript
toThaiDate('2024-01-15T10:30:00Z')
// Output: "15 มกราคม 2567"
```

#### `toThaiDateShort(dateString)`
Formats a date in short Thai format with Bangkok timezone
```typescript
toThaiDateShort('2024-01-15T10:30:00Z')
// Output: "15 ม.ค. 2567"
```

#### `toThaiTime(dateString)`
Formats time with seconds in Bangkok timezone
```typescript
toThaiTime('2024-01-15T10:30:45Z')
// Output: "17:30:45"
```

#### `toThaiTimeShort(dateString)`
Formats time without seconds in Bangkok timezone
```typescript
toThaiTimeShort('2024-01-15T10:30:45Z')
// Output: "17:30"
```

#### `toThaiDateTime(dateString, options?)`
Flexible date/time formatting with custom options in Bangkok timezone
```typescript
toThaiDateTime('2024-01-15T10:30:00Z', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})
// Output: "15 มกราคม 2567 17:30"
```

#### `getBangkokDate()`
Returns current date in Bangkok timezone
```typescript
const bangkokNow = getBangkokDate();
```

## Files Updated

### Components:
- `/components/patient/PatientCheckIn.tsx` - Check-in times and dates
- `/components/patient/PatientInfo.tsx` - Birth dates and age calculation
- `/components/searchPatientByID.tsx` - Patient search results dates
- `/components/patient/AvailableSurveys.tsx` - Survey submission dates

### Pages:
- `/app/(main)/patient/[id]/history/[submissionId]/page.tsx` - Submission history dates
- `/app/(admin)/admin/manage-forms/page.tsx` - Form creation dates
- `/app/(admin)/admin/manage-group/GroupAssignmentManagementClient.tsx` - Group assignment dates

## Important Notes

1. **Always use timezone utilities** when displaying dates/times to users
2. **Storage remains in UTC** - Only display is converted to Bangkok timezone
3. **Date calculations** should use `getBangkokDate()` instead of `new Date()`
4. All functions automatically handle Bangkok timezone (GMT+7)
5. Works correctly in both local development and Vercel deployment

## Testing

Test the fix by:
1. Deploy to Vercel
2. Check any date/time display in the application
3. Verify times are showing in GMT+7 (Bangkok time) instead of UTC

Example: If a record was created at 10:00 UTC, it should display as 17:00 in the application.
