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

interface FormCondition {
    form_id: string;
    threshold: number;
    operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq';
}

interface GroupAssignmentRule {
    id: string;
    name: string;
    group_id: string;
    rule_type: string;
    rule_config: {
        forms?: FormCondition[];
        logic_operator?: 'AND' | 'OR';
    };
    is_active: boolean;
}

interface PatientScore {
    form_id: string;
    score: number;
    submission_id: string;
    submission_date: string;
}

console.log("Auto-assign groups function started");

Deno.serve(async (req) => {
    try {
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

        const payload: SubmissionPayload = await req.json();

        console.log('Received payload:', JSON.stringify(payload, null, 2));

        if (payload.type !== 'INSERT' && payload.type !== 'UPDATE') {
            console.log('Skipping non-INSERT/UPDATE event');
            return new Response('OK', { status: 200 });
        }

        const { patient_id, form_id } = payload.record;

        if (!patient_id || !form_id) {
            console.log('Missing patient_id or form_id');
            return new Response('Missing required fields', { status: 400 });
        }

        // Get all active score_based assignment rules
        const { data: rules, error: rulesError } = await supabaseClient
            .from('group_assignment_rules')
            .select('*')
            .eq('is_active', true)
            .eq('rule_type', 'score_based');

        if (rulesError) {
            console.error('Error fetching assignment rules:', rulesError);
            return new Response('Error fetching rules', { status: 500 });
        }

        if (!rules || rules.length === 0) {
            console.log('No active assignment rules found');
            return new Response('OK', { status: 200 });
        }

        // Get patient's latest scores per form
        const patientScores = await getPatientScores(supabaseClient, patient_id);
        console.log('Patient scores:', Object.fromEntries(patientScores));

        if (patientScores.size === 0) {
            console.log('No scores found for patient');
            return new Response('OK', { status: 200 });
        }

        // Evaluate all rules and assign patient to all matching groups
        let newMemberships = 0;

        for (const rule of rules as GroupAssignmentRule[]) {
            const forms = rule.rule_config?.forms;
            if (!forms || forms.length === 0) continue;

            const logicOp = rule.rule_config?.logic_operator ?? 'AND';
            let formsChecked = 0;
            let formsPassed = 0;

            for (const formCondition of forms) {
                if (!formCondition.form_id) continue;

                formsChecked++;
                const patientScore = patientScores.get(formCondition.form_id);

                if (!patientScore) {
                    // No submission for this form — condition not met
                    continue;
                }

                const threshold = formCondition.threshold ?? 0;
                const operator = formCondition.operator ?? 'gte';
                let satisfied = false;

                switch (operator) {
                    case 'gte': satisfied = patientScore.score >= threshold; break;
                    case 'gt':  satisfied = patientScore.score > threshold; break;
                    case 'lte': satisfied = patientScore.score <= threshold; break;
                    case 'lt':  satisfied = patientScore.score < threshold; break;
                    case 'eq':  satisfied = patientScore.score === threshold; break;
                    default:    satisfied = false;
                }

                if (satisfied) formsPassed++;
            }

            if (formsChecked === 0) continue;

            // Combine form results with logic operator
            const ruleSatisfied = logicOp === 'OR'
                ? formsPassed > 0
                : formsPassed === formsChecked;

            if (!ruleSatisfied) {
                console.log(`Rule "${rule.name}": not satisfied (${formsPassed}/${formsChecked} forms passed, logic: ${logicOp})`);
                continue;
            }

            console.log(`Rule "${rule.name}": satisfied (${formsPassed}/${formsChecked} forms passed)`);

            // Add patient to the group (skip if already a member)
            const { error: membershipError, count } = await supabaseClient
                .from('patient_group_memberships')
                .upsert(
                    {
                        patient_id,
                        group_id: rule.group_id,
                        assigned_by_rule_id: rule.id,
                        assignment_reason: `Auto-assigned by rule "${rule.name}" (passed ${formsPassed}/${formsChecked} form conditions)`,
                        submission_id: payload.record.id
                    },
                    { onConflict: 'patient_id,group_id', ignoreDuplicates: true }
                );

            if (membershipError) {
                console.error(`Error inserting membership for rule "${rule.name}":`, membershipError);
                continue;
            }

            // Record in assignment history
            const { error: historyError } = await supabaseClient
                .from('patient_group_assignments')
                .insert({
                    patient_id,
                    old_group_id: null,
                    new_group_id: rule.group_id,
                    assignment_reason: `Auto-assigned by rule "${rule.name}" (passed ${formsPassed}/${formsChecked} form conditions)`,
                    assigned_by_rule_id: rule.id,
                    submission_id: payload.record.id
                });

            if (historyError) {
                console.error('Error recording assignment history:', historyError);
            }

            newMemberships++;
        }

        console.log(`Done: patient ${patient_id} added to ${newMemberships} new group(s)`);

        return new Response(JSON.stringify({
            success: true,
            patient_id,
            new_memberships: newMemberships
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in auto-assign-groups function:', error);
        return new Response('Internal server error', { status: 500 });
    }
});

/**
 * Get the latest score per form for a patient
 */
async function getPatientScores(
    supabaseClient: any,
    patientId: string
): Promise<Map<string, PatientScore>> {
    const scoresMap = new Map<string, PatientScore>();

    const { data: submissions, error } = await supabaseClient
        .from('submissions')
        .select('id, form_id, total_evaluation_score, submitted_at')
        .eq('patient_id', patientId)
        .not('total_evaluation_score', 'is', null)
        .not('form_id', 'is', null)
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error fetching patient submissions:', error);
        return scoresMap;
    }

    // Keep only the latest submission per form
    for (const submission of submissions || []) {
        if (!scoresMap.has(submission.form_id)) {
            scoresMap.set(submission.form_id, {
                form_id: submission.form_id,
                score: submission.total_evaluation_score,
                submission_id: submission.id,
                submission_date: submission.submitted_at
            });
        }
    }

    return scoresMap;
}
