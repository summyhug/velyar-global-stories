-- Rename the existing theme "travel" to "streets"
UPDATE public.themes
SET name = 'streets'
WHERE lower(name) = 'travel';