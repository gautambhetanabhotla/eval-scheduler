import { Modal } from '@/components/modal';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';

import CourseCreationForm from '@/components/course_creation_form';
import { HelperMessage } from '@/components/helper-message';

export default function NewCourseModal() {
  const msg = HelperMessage();
  return (
    <Modal>
      <div className="p-4">
        <DialogTitle className="text-xl font-bold mb-4">New Course</DialogTitle>
        <DialogDescription>{msg}</DialogDescription>
        <div className="my-4" />
        <CourseCreationForm />
      </div>
    </Modal>
  );
}
