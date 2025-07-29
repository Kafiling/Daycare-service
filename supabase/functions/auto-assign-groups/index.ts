// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface SubmissionPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: {
        id: string;
        patient_id: string;
        form_id: string;
        total_evaluation_score?: number;
        submitted_at: string;
        status?: string;
    };
    old_record?: any;
}

interface GroupAssignmentRule {
    id: string;
    name: string;
    group_id: string;
    rule_type: string;
    rule_config: {
        forms?: Array<{
            form_id: string;
            weight: number;
            threshold?: number;
        }>;
        min_score?: number;
        max_score?: number;
        operator?: 'gte' | 'lte' | 'eq' | 'between';
    };
    priority: number;
    is_active: boolean;
}

interface PatientScore {
    form_id: string;
    score: number;
    weight: number;
    submission_date: string;
}

console.log("Auto-assign groups function started");

Deno.serve(async (req) => {
    try {
        // Create Supabase client with service role for admin operations
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Parse the webhook payload from Supabase
        const payload: SubmissionPayload = await req.json();

        console.log('Received payload:', JSON.stringify(payload, null, 2));

        // Only process INSERT and UPDATE events for form submissions
        if (payload.type !== 'INSERT' && payload.type !== 'UPDATE') {
            console.log('Skipping non-INSERT/UPDATE event');
            return new Response('OK', { status: 200 });
        }

        const { patient_id, form_id } = payload.record;

        if (!patient_id || !form_id) {
            console.log('Missing patient_id or form_id');
            return new Response('Missing required fields', { status: 400 });
        }

        // Get all active assignment rules ordered by priority
        const { data: rules, error: rulesError } = await supabaseClient
            .from('group_assignment_rules')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: false });

        if (rulesError) {
            console.error('Error fetching assignment rules:', rulesError);
            return new Response('Error fetching rules', { status: 500 });
        }

        if (!rules || rules.length === 0) {
            console.log('No active assignment rules found');
            return new Response('OK', { status: 200 });
        }

        // Calculate patient's current scores for all relevant forms
        const patientScores = await calculatePatientScores(supabaseClient, patient_id);
        console.log('Patient scores:', patientScores);

        // Find the best matching group based on rules
        const assignedGroup = await findBestMatchingGroup(rules as GroupAssignmentRule[], patientScores);

        if (!assignedGroup) {
            console.log('No matching group found for patient');
            return new Response('OK', { status: 200 });
        }

        // Get current patient group
        const { data: patient, error: patientError } = await supabaseClient
            .from('patients')
            .select('id, group_id')
            .eq('id', patient_id)
            .single();

        if (patientError) {
            console.error('Error fetching patient:', patientError);
            return new Response('Error fetching patient', { status: 500 });
        }

        // Check if group assignment would change
        if (patient.group_id === assignedGroup.group_id) {
            console.log('Patient already in correct group');
            return new Response('OK', { status: 200 });
        }

        // Update patient group
        const { error: updateError } = await supabaseClient
            .from('patients')
            .update({ group_id: assignedGroup.group_id })
            .eq('id', patient_id);

        if (updateError) {
            console.error('Error updating patient group:', updateError);
            return new Response('Error updating patient group', { status: 500 });
        }

        // Record the assignment in history
        const { error: historyError } = await supabaseClient
            .from('patient_group_assignments')
            .insert({
                patient_id,
                old_group_id: patient.group_id,
                new_group_id: assignedGroup.group_id,
                assignment_reason: `Auto-assigned by rule: ${assignedGroup.name}`,
                assigned_by_rule_id: assignedGroup.id,
                submission_id: payload.record.id
            });

        if (historyError) {
            console.error('Error recording assignment history:', historyError);
            // Don't fail the whole operation for history recording errors
        }

        console.log(`Successfully assigned patient ${patient_id} to group ${assignedGroup.group_id}`);

        return new Response('OK', { status: 200 });

    } catch (error) {
        console.error('Error in auto-assign-groups function:', error);
        return new Response('Internal server error', { status: 500 });
    }
});

/**
 * Calculate patient's scores across all forms with weights
 */
async function calculatePatientScores(
    supabaseClient: any,
    patientId: string
): Promise<Map<string, PatientScore>> {
    const scoresMap = new Map<string, PatientScore>();

    // Get all submissions for this patient with scores
    const { data: submissions, error } = await supabaseClient
        .from('submissions')
        .select('form_id, total_evaluation_score, submitted_at')
        .eq('patient_id', patientId)
        .not('total_evaluation_score', 'is', null)
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error fetching patient submissions:', error);
        return scoresMap;
    }

    // Keep only the latest submission for each form
    const latestSubmissions = new Map<string, any>();
    for (const submission of submissions || []) {
        if (!latestSubmissions.has(submission.form_id)) {
            latestSubmissions.set(submission.form_id, submission);
        }
    }

    // Convert to PatientScore format with default weight of 1.0
    for (const [formId, submission] of latestSubmissions) {
        scoresMap.set(formId, {
            form_id: formId,
            score: submission.total_evaluation_score,
            weight: 1.0, // Default weight, will be overridden by rule config
            submission_date: submission.submitted_at
        });
    }

    return scoresMap;
}

/**
 * Find the best matching group based on assignment rules
 */
async function findBestMatchingGroup(
    rules: GroupAssignmentRule[],
    patientScores: Map<string, PatientScore>
): Promise<GroupAssignmentRule | null> {

    for (const rule of rules) {
        if (rule.rule_type !== 'score_based') {
            continue; // Skip non-score-based rules for now
        }

        const config = rule.rule_config;

        if (!config.forms || config.forms.length === 0) {
            continue;
        }

        let totalWeightedScore = 0;
        let totalWeight = 0;
        let hasRequiredForms = true;

        // Calculate weighted score for this rule
        for (const formConfig of config.forms) {
            const patientScore = patientScores.get(formConfig.form_id);

            if (!patientScore) {
                // Patient hasn't completed this form
                hasRequiredForms = false;
                break;
            }

            const weightedScore = patientScore.score * formConfig.weight;
            totalWeightedScore += weightedScore;
            totalWeight += formConfig.weight;
        }

        if (!hasRequiredForms || totalWeight === 0) {
            continue;
        }

        const averageScore = totalWeightedScore / totalWeight;
        console.log(`Rule "${rule.name}": Average score = ${averageScore}`);

        // Check if score meets the rule criteria
        const meetsThreshold = checkScoreThreshold(averageScore, config);

        if (meetsThreshold) {
            console.log(`Patient matches rule: ${rule.name}`);
            return rule;
        }
    }

    return null;
}

/**
 * Check if a score meets the threshold criteria
 */
function checkScoreThreshold(
    score: number,
    config: GroupAssignmentRule['rule_config']
): boolean {
    const { min_score, max_score, operator = 'gte' } = config;

    switch (operator) {
        case 'gte':
            return min_score !== undefined ? score >= min_score : true;
        case 'lte':
            return max_score !== undefined ? score <= max_score : true;
        case 'eq':
            return min_score !== undefined ? Math.abs(score - min_score) < 0.01 : true;
        case 'between':
            return (min_score !== undefined ? score >= min_score : true) &&
                (max_score !== undefined ? score <= max_score : true);
        default:
            return false;
    }
}
