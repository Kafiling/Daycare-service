// Debug script to test group assignment functionality
import { createClient } from './utils/supabase/client.js';

const supabase = createClient();

async function debugGroupAssignment() {
    console.log('=== Debugging Group Assignment ===');
    
    try {
        // 1. Check if patient groups exist
        console.log('\n1. Checking patient groups...');
        const { data: groups, error: groupsError } = await supabase
            .from('patient_groups')
            .select('*');
        
        if (groupsError) {
            console.error('Error fetching groups:', groupsError);
            return;
        }
        
        console.log(`Found ${groups?.length || 0} groups:`, groups?.map(g => g.name));
        
        // 2. Check if patients exist
        console.log('\n2. Checking patients...');
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('id, first_name, last_name, group_id')
            .limit(5);
        
        if (patientsError) {
            console.error('Error fetching patients:', patientsError);
            return;
        }
        
        console.log(`Found ${patients?.length || 0} patients:`, patients);
        
        // 3. Check if submissions exist
        console.log('\n3. Checking submissions...');
        const { data: submissions, error: submissionsError } = await supabase
            .from('submissions')
            .select('id, patient_id, form_id, total_evaluation_score, submitted_at')
            .not('total_evaluation_score', 'is', null)
            .limit(5);
        
        if (submissionsError) {
            console.error('Error fetching submissions:', submissionsError);
            return;
        }
        
        console.log(`Found ${submissions?.length || 0} completed submissions:`, submissions);
        
        // 4. Check if assignment rules exist
        console.log('\n4. Checking assignment rules...');
        const { data: rules, error: rulesError } = await supabase
            .from('group_assignment_rules')
            .select('*');
        
        if (rulesError) {
            console.error('Error fetching rules:', rulesError);
            return;
        }
        
        console.log(`Found ${rules?.length || 0} assignment rules:`, rules);
        
        // 5. Test manual assignment function for first patient with submissions
        if (submissions && submissions.length > 0) {
            console.log('\n5. Testing manual assignment...');
            const testPatientId = submissions[0].patient_id;
            console.log(`Testing with patient ID: ${testPatientId}`);
            
            const { data: result, error: assignError } = await supabase
                .rpc('manually_assign_patient_group_simple', {
                    patient_id_param: testPatientId
                });
            
            if (assignError) {
                console.error('Error in manual assignment:', assignError);
            } else {
                console.log('Assignment result:', result);
            }
        }
        
        // 6. Check assignment history
        console.log('\n6. Checking assignment history...');
        const { data: assignments, error: assignmentsError } = await supabase
            .from('patient_group_assignments')
            .select('*')
            .limit(5);
        
        if (assignmentsError) {
            console.error('Error fetching assignments:', assignmentsError);
        } else {
            console.log(`Found ${assignments?.length || 0} assignment records:`, assignments);
        }
        
    } catch (error) {
        console.error('Debug script error:', error);
    }
}

// Run the debug function
debugGroupAssignment();
