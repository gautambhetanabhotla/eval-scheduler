import { createClient } from '@/lib/supabase/server';
import { SlotsManager } from '@/components/slots-manager';
import { SlotsList } from '@/components/slots-list';
import { Separator } from '@/components/ui/separator';

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in.</div>;
  }

  // 1. Fetch components where the user is a TA
  const { data: teachingData } = await supabase
    .from('taships')
    .select(
      `
      course,
      courses (
        name
      )
    `
    )
    .eq('ta', user.id);

  // Get component IDs for these teaching courses to populate the dropdown
  // We need components.id, name, course_code
  // But taships links to course code. We need components belonging to that course.
  // Let's do a second query or a complex join?
  // Simpler: Get all course codes I teach, then fetch all components for those courses.
  const teachingCourseCodes = teachingData?.map(td => td.course) || [];

  let teachingComponents: any[] = [];
  if (teachingCourseCodes.length > 0) {
    const { data: comps } = await supabase
      .from('components')
      .select('id, name, course')
      .in('course', teachingCourseCodes);
    teachingComponents = comps || [];
  }

  // 2. Fetch slots for courses where the user is a student
  // First get enrolled courses
  const { data: enrolledData } = await supabase
    .from('studentships')
    .select('course')
    .eq('student', user.id);

  const enrolledCourseCodes = enrolledData?.map(ed => ed.course) || [];

  // Now fetch slots belonging to components of these courses
  // We want slots connected to components where component.course in enrolledCourseCodes
  // Since we can't do deep nested filter easily in one go without !inner or similar:
  // We'll select slots with inner join on component.

  let availableSlots: any[] = [];
  if (enrolledCourseCodes.length > 0) {
    const { data: slots } = await supabase
      .from('slots')
      .select(
        `
        id,
        start,
        end,
        booked_by,
        ta:users!ta (
            name
        ),
        components!inner (
            name,
            courses!inner (
                code,
                name
            )
        )
      `
      )
      .in('components.courses.code', enrolledCourseCodes)
      .gte('start', new Date().toISOString()) // Only future slots? Or all? Let's say future 24h ago to be safe.
      .order('start', { ascending: true });

    availableSlots = slots || [];
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">
          Manage your evaluation bookings or create new slots.
        </p>
      </div>

      {/* TA Section */}
      {teachingComponents.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Manage Evaluation Slots
          </h2>
          <p className="text-sm text-muted-foreground">
            Create time slots for students to book evaluations for your courses.
          </p>
          <SlotsManager teachingComponents={teachingComponents} />
        </section>
      )}

      {teachingComponents.length > 0 && availableSlots.length > 0 && (
        <Separator />
      )}

      {/* Student Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Available Bookings
        </h2>
        <p className="text-sm text-muted-foreground">
          Book time slots for your upcoming evaluations.
        </p>
        <SlotsList slots={availableSlots} currentUserId={user.id} />
      </section>
    </div>
  );
}
