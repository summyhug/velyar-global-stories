-- Allow users to update daily_prompts (needed for admin functionality)
DROP POLICY IF EXISTS "Allow users to update daily prompts" ON daily_prompts;

CREATE POLICY "Allow users to update daily prompts" 
ON daily_prompts 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Also allow users to insert into daily_prompts
DROP POLICY IF EXISTS "Allow users to insert daily prompts" ON daily_prompts;

CREATE POLICY "Allow users to insert daily prompts" 
ON daily_prompts 
FOR INSERT 
WITH CHECK (true);