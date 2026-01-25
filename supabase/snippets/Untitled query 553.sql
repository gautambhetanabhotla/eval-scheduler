UPDATE evaluations e
SET slot = s.id
FROM slots s
WHERE e.ta = s.ta 
  AND e.scheduled = s.start
  AND e.slot IS NULL;