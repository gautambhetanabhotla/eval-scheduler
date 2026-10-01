'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
// import { HelperMessage } from '@/components/helper-message';

import { createClient } from '@/lib/supabase/client';

export default function CourseCreationForm() {
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('courses')
      .insert([{ code: code, name: name }]);
    if (error) {
      if (error.message.includes('duplicate key value')) {
        setError('Course with this code already exists.');
      }
      setSuccess(null);
    } else {
      setSuccess('Course created successfully!');
      await supabase
        .from('taships')
        .insert([
          { course: code, ta: (await supabase.auth.getUser()).data.user?.id },
        ]);
      setError(null);
      setName('');
      setCode('');
    }
    setLoading(false);
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="courseName" className="block text-sm font-medium">
            Course Name
          </Label>
          <Input
            type="text"
            id="courseName"
            name="courseName"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Enter course name"
            value={name || ''}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="courseCode" className="block text-sm font-medium">
            Course Code
          </Label>
          <Input
            type="text"
            id="courseCode"
            name="courseCode"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Enter course code"
            value={code || ''}
            onChange={e => setCode(e.target.value)}
          />
        </div>
        <div>
          <Button type="submit" variant="default" disabled={loading}>
            Create Course
          </Button>
        </div>
      </form>
    </>
  );
}
