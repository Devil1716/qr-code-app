-- Add capacity field to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 60;

-- Add image_url field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing users with default avatar images
UPDATE users SET image_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id WHERE image_url IS NULL AND role = 'teacher';
UPDATE users SET image_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id WHERE image_url IS NULL AND role = 'student';
