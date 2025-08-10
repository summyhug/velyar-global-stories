-- Create a function to fix user profiles by email
CREATE OR REPLACE FUNCTION public.fix_user_profile_by_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    profile_record RECORD;
    updated_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get user from auth.users
    SELECT id, raw_user_meta_data INTO user_record
    FROM auth.users
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN 'User not found with email: ' || user_email;
    END IF;
    
    -- Get profile
    SELECT * INTO profile_record
    FROM public.profiles
    WHERE user_id = user_record.id;
    
    IF NOT FOUND THEN
        RETURN 'Profile not found for user: ' || user_email;
    END IF;
    
    -- Update profile with metadata if fields are missing
    UPDATE public.profiles
    SET 
        city = COALESCE(city, user_record.raw_user_meta_data ->> 'city'),
        country = COALESCE(country, user_record.raw_user_meta_data ->> 'country'),
        date_of_birth = COALESCE(date_of_birth, (user_record.raw_user_meta_data ->> 'date_of_birth')::DATE)
    WHERE user_id = user_record.id;
    
    -- Check what was updated
    IF user_record.raw_user_meta_data ->> 'city' IS NOT NULL AND profile_record.city IS NULL THEN
        updated_fields := array_append(updated_fields, 'city');
    END IF;
    
    IF user_record.raw_user_meta_data ->> 'country' IS NOT NULL AND profile_record.country IS NULL THEN
        updated_fields := array_append(updated_fields, 'country');
    END IF;
    
    IF user_record.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL AND profile_record.date_of_birth IS NULL THEN
        updated_fields := array_append(updated_fields, 'date_of_birth');
    END IF;
    
    IF array_length(updated_fields, 1) > 0 THEN
        RETURN 'Profile updated for ' || user_email || ' with fields: ' || array_to_string(updated_fields, ', ');
    ELSE
        RETURN 'No updates needed for ' || user_email || ' - all fields already populated';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error updating profile for ' || user_email || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
