
DROP POLICY IF EXISTS "Authenticated users can upload a resume" ON storage.objects;

CREATE POLICY "Authenticated users can upload a resume"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-resumes'
    AND (storage.foldername(name))[1] = 'applications'
    AND (
      lower(right(name, 4)) IN ('.pdf', '.doc', '.txt', '.rtf')
      OR lower(right(name, 5)) = '.docx'
    )
  );
