alter table letters add column if not exists reply_to uuid references letters(id);
