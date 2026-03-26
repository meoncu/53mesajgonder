-- Bilgi Kütüphanesi (Hadis, Sünnet, İlmihal)
CREATE TABLE IF NOT EXISTS content_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('hadis', 'sunnet', 'ilmihal')),
    content TEXT NOT NULL,
    narrator TEXT, -- Ravi
    source TEXT, -- Kaynak No / Kitap
    order_index INTEGER NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Otomasyon Kuralları
CREATE TABLE IF NOT EXISTS content_automation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type TEXT NOT NULL CHECK (content_type IN ('hadis', 'sunnet', 'ilmihal')),
    group_ids UUID[] NOT NULL, -- Hedef Gruplar
    schedule_day INTEGER, -- 0-6 (Pazar-Cumartesi)
    schedule_time TIME NOT NULL, -- 07:00:00
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    next_send_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gönderim Arşivi
CREATE TABLE IF NOT EXISTS content_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_library(id),
    content_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_group_ids UUID[],
    recipient_count INTEGER,
    sent_recipients JSONB -- [{name, phone}]
);

-- order_index için otomatik artış ve güncellenebilirlik
CREATE INDEX IF NOT EXISTS idx_content_library_type_order ON content_library(type, order_index);