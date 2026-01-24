import { Code } from '@/components/ui/code';

export function HelperMessage() {
  return (
    <p>
      Create a new course. The code should be of the form{' '}
      <Code>&lt;sem&gt;-&lt;course_code&gt;</Code> (e.g.,{' '}
      <Code>s26_cs1.201</Code>).
    </p>
  );
}
