-- Create the Obras table
CREATE TABLE IF NOT EXISTS obras (
    id SERIAL PRIMARY KEY,
    nombre_obra VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert example data
INSERT INTO obras (nombre_obra) VALUES
    ('Alza 145'),
    ('Acciona 330'),
    ('Cardoner 25');
