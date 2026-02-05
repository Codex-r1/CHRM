import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';
import Papa from 'papaparse'; // npm install papaparse

export async function POST(request: NextRequest) {
  try {
    // Get uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read CSV content
    const text = await file.text();
    
    // Parse CSV
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid CSV format', details: parsed.errors },
        { status: 400 }
      );
    }

    const members = parsed.data as any[];
    let imported = 0;
    let skipped = 0;
    const errors = [];

    // Import each member
    for (const member of members) {
      try {
        // Validate required fields
        if (!member.membership_number || !member.email || !member.full_name) {
          errors.push(`Skipping row: Missing required fields`);
          skipped++;
          continue;
        }

        // Check if member already exists
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('membership_number', member.membership_number.toUpperCase().trim())
          .maybeSingle();

        if (existing) {
          console.log(`Member ${member.membership_number} already exists`);
          skipped++;
          continue;
        }

        // Insert profile (NO auth user yet - they'll create it when claiming)
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: crypto.randomUUID(), // Generate UUID for profile
            email: member.email.toLowerCase().trim(),
            full_name: member.full_name.trim(),
            phone_number: member.phone?.trim() || null,
            graduation_year: member.graduation_year ? parseInt(member.graduation_year) : null,
            course: member.course?.trim() || null,
            county: member.county?.trim() || null,
            membership_number: member.membership_number.toUpperCase().trim(),
            role: 'member',
            status: 'inactive', // Will become active after they claim
            registration_source: 'manual',
            needs_password_setup: true
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          errors.push(`${member.membership_number}: ${insertError.message}`);
          skipped++;
        } else {
          imported++;
          console.log(`✅ Imported: ${member.membership_number}`);
        }

      } catch (error: any) {
        console.error('Row processing error:', error);
        errors.push(`${member.membership_number}: ${error.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported} members, skipped ${skipped}`
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}