// Manual migration runner - execute SQL migrations through the app
import { createClient } from '@/utils/supabase/client';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function MigrationPage() {
    const runMigration = async () => {
        try {
            const supabase = createClient();
            
            // Read the migration file
            const migrationPath = join(process.cwd(), 'supabase/migrations/20250127000004_add_default_assignment_rules.sql');
            const migrationSQL = readFileSync(migrationPath, 'utf8');
            
            console.log('Running migration...');
            console.log('SQL:', migrationSQL);
            
            // Execute the migration
            const { data, error } = await supabase.rpc('exec_sql', {
                sql: migrationSQL
            });
            
            if (error) {
                console.error('Migration error:', error);
            } else {
                console.log('Migration completed successfully:', data);
            }
            
        } catch (error) {
            console.error('Error reading migration file:', error);
            // Fallback: execute SQL directly
            await runMigrationDirectly();
        }
    };
    
    const runMigrationDirectly = async () => {
        const supabase = createClient();
        
        console.log('Running migration directly...');
        
        try {
            // First, create the default rules
            const rules = [
                {
                    name: 'ผู้รับบริการเสี่ยงสูง',
                    description: 'ผู้รับบริการที่มีคะแนนประเมินสูง ต้องการการดูแลเป็นพิเศษ',
                    group_name: 'ฉุกเฉิน',
                    rule_config: {
                        operator: 'gte',
                        min_score: 80,
                        forms: []
                    },
                    priority: 100
                },
                {
                    name: 'ผู้รับบริการเสี่ยงปานกลาง',
                    description: 'ผู้รับบริการที่มีคะแนนประเมินปานกลาง ต้องติดตามเป็นพิเศษ',
                    group_name: 'ติดตามพิเศษ',
                    rule_config: {
                        operator: 'between',
                        min_score: 50,
                        max_score: 79,
                        forms: []
                    },
                    priority: 80
                },
                {
                    name: 'ผู้รับบริการเสี่ยงต่ำ',
                    description: 'ผู้รับบริการที่มีคะแนนประเมินต่ำ อยู่ในกลุ่มทั่วไป',
                    group_name: 'ทั่วไป',
                    rule_config: {
                        operator: 'lte',
                        min_score: 49,
                        forms: []
                    },
                    priority: 60
                }
            ];
            
            // Get group IDs
            const { data: groups, error: groupsError } = await supabase
                .from('patient_groups')
                .select('id, name');
                
            if (groupsError) {
                console.error('Error fetching groups:', groupsError);
                return;
            }
            
            console.log('Available groups:', groups);
            
            // Create rules
            for (const rule of rules) {
                const group = groups.find(g => g.name === rule.group_name);
                if (!group) {
                    console.error(`Group not found: ${rule.group_name}`);
                    continue;
                }
                
                const { data, error } = await supabase
                    .from('group_assignment_rules')
                    .insert({
                        name: rule.name,
                        description: rule.description,
                        group_id: group.id,
                        rule_type: 'score_based',
                        rule_config: rule.rule_config,
                        priority: rule.priority,
                        is_active: true
                    })
                    .select();
                    
                if (error && !error.message.includes('duplicate')) {
                    console.error(`Error creating rule ${rule.name}:`, error);
                } else {
                    console.log(`Created rule: ${rule.name}`, data);
                }
            }
            
            console.log('Migration completed!');
            
        } catch (error) {
            console.error('Migration error:', error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Manual Migration Runner</h1>
            <button 
                onClick={runMigrationDirectly}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
                Run Migration (Create Default Rules)
            </button>
            <p className="mt-4 text-gray-600">
                This will create default assignment rules for the group assignment system.
            </p>
        </div>
    );
}
