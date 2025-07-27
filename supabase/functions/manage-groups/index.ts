// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface PatientGroup {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

console.log("Manage Groups function started")

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const method = req.method

    switch (method) {
      case 'GET':
        return handleGetGroups(supabaseClient, corsHeaders)
      case 'POST':
        return handleCreateGroup(req, supabaseClient, corsHeaders)
      case 'PUT':
        return handleUpdateGroup(req, supabaseClient, corsHeaders, url)
      case 'DELETE':
        return handleDeleteGroup(supabaseClient, corsHeaders, url)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in manage-groups function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleGetGroups(supabaseClient: any, corsHeaders: Record<string, string>) {
  try {
    const { data: groups, error } = await supabaseClient
      .from('patient_groups')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ groups }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch groups' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleCreateGroup(req: Request, supabaseClient: any, corsHeaders: Record<string, string>) {
  try {
    const { name, description, color }: PatientGroup = await req.json()

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Group name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: group, error } = await supabaseClient
      .from('patient_groups')
      .insert({
        name,
        description,
        color: color || '#3B82F6', // Default blue color
      })
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ group }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create group' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleUpdateGroup(req: Request, supabaseClient: any, corsHeaders: Record<string, string>, url: URL) {
  try {
    const groupId = url.searchParams.get('id')
    if (!groupId) {
      return new Response(
        JSON.stringify({ error: 'Group ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { name, description, color }: Partial<PatientGroup> = await req.json()

    const updates: Partial<PatientGroup> = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (color !== undefined) updates.color = color

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: group, error } = await supabaseClient
      .from('patient_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ group }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update group' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleDeleteGroup(supabaseClient: any, corsHeaders: Record<string, string>, url: URL) {
  try {
    const groupId = url.searchParams.get('id')
    if (!groupId) {
      return new Response(
        JSON.stringify({ error: 'Group ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if group has patients assigned
    const { data: patients, error: checkError } = await supabaseClient
      .from('patients')
      .select('id')
      .eq('group_id', groupId)
      .limit(1)

    if (checkError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check group usage' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (patients && patients.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete group with assigned patients' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { error } = await supabaseClient
      .from('patient_groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Group deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete group' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/manage-groups' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
