-- Insert the "what sound defines your neighborhood?" prompt as archived since it was replaced by breakfast prompt
INSERT INTO archived_prompts (prompt_text, archive_date, response_count, country_count)
VALUES ('what sound defines your neighborhood?', CURRENT_DATE, 4, 1)
ON CONFLICT DO NOTHING;