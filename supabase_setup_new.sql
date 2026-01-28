-- Create music analytics table
CREATE TABLE music_analytics (
    id SERIAL PRIMARY KEY,
    track_id TEXT NOT NULL UNIQUE,
    track_title TEXT NOT NULL,
    track_artist TEXT NOT NULL,
    play_count INTEGER DEFAULT 1,
    last_played TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_music_analytics_track_id ON music_analytics(track_id);
CREATE INDEX idx_music_analytics_last_played ON music_analytics(last_played);

-- Enable RLS (Row Level Security) for public access
ALTER TABLE music_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert data
CREATE POLICY "Allow anonymous inserts" ON music_analytics
    FOR INSERT WITH CHECK (true);

-- Allow anonymous users to select data
CREATE POLICY "Allow anonymous selects" ON music_analytics
    FOR SELECT USING (true);

-- Allow anonymous users to update data (for incrementing play counts)
CREATE POLICY "Allow anonymous updates" ON music_analytics
    FOR UPDATE USING (true);
