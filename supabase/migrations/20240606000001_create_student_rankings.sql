CREATE TABLE IF NOT EXISTS student_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  grade DECIMAL(3,2) DEFAULT 0.00,
  certificates TEXT[] DEFAULT '{}',
  competitions_won INTEGER DEFAULT 0,
  total_score DECIMAL(5,2) DEFAULT 0.00,
  rank_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id)
);

CREATE OR REPLACE FUNCTION update_ranking_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_score = 
    (NEW.grade * 40) + 
    (array_length(NEW.skills, 1) * 10) + 
    (array_length(NEW.certificates, 1) * 15) + 
    (NEW.competitions_won * 25);
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_ranking_score
  BEFORE INSERT OR UPDATE ON student_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_ranking_score();

CREATE OR REPLACE FUNCTION update_all_rankings()
RETURNS TRIGGER AS $
DECLARE
  rec RECORD;
  position INTEGER := 1;
BEGIN
  FOR rec IN 
    SELECT id FROM student_rankings 
    ORDER BY total_score DESC, grade DESC, competitions_won DESC
  LOOP
    UPDATE student_rankings 
    SET rank_position = position 
    WHERE id = rec.id;
    position := position + 1;
  END LOOP;
  RETURN NULL;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_rankings_after_change
  AFTER INSERT OR UPDATE OR DELETE ON student_rankings
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_all_rankings();

alter publication supabase_realtime add table student_rankings;