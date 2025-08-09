-- Update the 'streets' theme icon and description
UPDATE public.themes
SET icon = '🏙️',
    description = 'Capture everyday street life from your city.'
WHERE lower(name) = 'streets';