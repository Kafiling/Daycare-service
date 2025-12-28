import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      // Create an authenticated client to get user info
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id;
    }

    // 2. Fetch Patients Data
    const { data: patients, error: patientsError } = await supabaseClient
      .from('patients')
      .select(`
        *,
        patient_checkins (
          check_in_time
        )
      `)
      .order('id')

    if (patientsError) throw patientsError

    // 2.1 Fetch patient group memberships separately
    const { data: memberships } = await supabaseClient
      .from('patient_group_memberships')
      .select(`
        patient_id,
        group_id,
        patient_groups:group_id (name)
      `)

    // Create a map of patient_id -> group names
    const patientGroupsMap = new Map<string, string[]>();
    memberships?.forEach((m: any) => {
      const groupName = m.patient_groups?.name;
      if (groupName) {
        if (!patientGroupsMap.has(m.patient_id)) {
          patientGroupsMap.set(m.patient_id, []);
        }
        patientGroupsMap.get(m.patient_id)?.push(groupName);
      }
    });

    // 3. Fetch Forms
    const { data: forms, error: formsError } = await supabaseClient
      .from('forms')
      .select('form_id, title')
      .order('title')

    if (formsError) throw formsError

    // 4. Create Workbook
    const workbook = XLSX.utils.book_new()

    // --- Sheet 1: Patients & Checkins ---
    const patientRows = patients.map((p: any) => {
      // Flatten checkins into a string or count, depending on preference. 
      // Here we list the last 5 checkins for brevity in the main sheet.
      const checkins = p.patient_checkins
        ? p.patient_checkins
            .map((c: any) => new Date(c.check_in_time).toLocaleDateString('th-TH'))
            .slice(0, 5)
            .join(', ')
        : ''

      // Destructure to remove unwanted fields
      const { profile_image_url, group_id, patient_checkins, ...rest } = p;

      // Get group names from the pre-fetched map
      const groupNames = patientGroupsMap.get(p.id)?.join(', ') || '-';

      return {
        ID: p.id,
        Name: `${p.title || ''}${p.first_name} ${p.last_name}`,
        Group: groupNames,
        Gender: p.gender,
        Age: p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : '',
        Phone: p.phone_num,
        Address: p.address,
        Underlying_Diseases: Array.isArray(p.underlying_diseases) ? p.underlying_diseases.join(', ') : '',
        Recent_Checkins: checkins,
        ...rest
      }
    })

    const patientsWorksheet = XLSX.utils.json_to_sheet(patientRows)
    XLSX.utils.book_append_sheet(workbook, patientsWorksheet, "Members Info")

    // --- Sheets 2+: Submissions per Form ---
    for (const form of forms) {
      // Fetch questions for this form to get headers
      const { data: formQuestions } = await supabaseClient
        .from('questions')
        .select('question_id, question_text')
        .eq('form_id', form.form_id)
        .order('question_id');

      // Fetch submissions for this specific form
      const { data: submissions, error: subError } = await supabaseClient
        .from('submissions')
        .select(`
          submitted_at,
          total_evaluation_score,
          evaluation_result,
          answers,
          patients (first_name, last_name),
          profiles:nurse_id (first_name, last_name)
        `)
        .eq('form_id', form.form_id)
        .order('submitted_at', { ascending: false })

      if (subError) {
        console.error(`Error fetching submissions for form ${form.title}:`, subError)
        continue
      }

      if (submissions && submissions.length > 0) {
        const submissionRows = submissions.map((s: any) => {
          // Parse answers - stored as { "1": "answer", "2": "answer" } where keys are 1-based index
          let answersData = s.answers;
          
          // Handle if answers is a string (shouldn't be, but just in case)
          if (typeof answersData === 'string') {
            try {
              answersData = JSON.parse(answersData);
            } catch (e) {
              console.error("Failed to parse answers JSON", e);
              answersData = {};
            }
          }
          
          // Ensure answersData is an object
          if (!answersData || typeof answersData !== 'object') {
            answersData = {};
          }

          // Build the row with fixed columns first
          const row: any = {
            Date: new Date(s.submitted_at).toLocaleDateString('th-TH'),
            Member: `${s.patients?.first_name || ''} ${s.patients?.last_name || ''}`.trim(),
            Staff: `${s.profiles?.first_name || ''} ${s.profiles?.last_name || ''}`.trim(),
            Score: s.total_evaluation_score,
            Result: s.evaluation_result,
          };

          // Add question columns in order
          // answersData format: { "1": "answer", "2": "answer" } - keys are 1-based sequential index
          // formQuestions is ordered by question_id, so index+1 maps to the answer key
          formQuestions?.forEach((q: any, index: number) => {
             // The answer key is the 1-based index (index + 1)
             const answerKey = String(index + 1);
             let val = answersData[answerKey];
             
             // Handle object values (like checkboxes might be)
             if (typeof val === 'object' && val !== null) {
                 val = JSON.stringify(val);
             }
             
             row[q.question_text] = val !== undefined && val !== null ? String(val) : "";
          });

          return row;
        })

        // Sanitize sheet name (max 31 chars, no special chars)
        const sheetName = form.title.replace(/[\\/?*[\]]/g, "").substring(0, 30)
        const worksheet = XLSX.utils.json_to_sheet(submissionRows)
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      }
    }

    // 5. Generate Buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 6. Log the export activity
    if (userId) {
      try {
        await supabaseClient.rpc('log_admin_export', {
          p_performed_by: userId,
          p_export_type: 'full_export',
          p_metadata: {
            patient_count: patients.length,
            form_count: forms.length,
            export_timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Error logging export activity:', logError);
        // Don't fail the export if logging fails
      }
    }

    // 7. Return Response
    return new Response(excelBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="daycare_data_dump_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
