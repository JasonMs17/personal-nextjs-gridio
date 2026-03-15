2. Tabel Accounts (Dompet / rekening)

Untuk memisahkan uang: cash, bank, e-wallet.

create table accounts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    balance numeric default 0,
    created_at timestamp default now()
);

Contoh:

Cash

BCA

OVO

Dana

3. Tabel budget_Categories

Kategori pemasukan dan pengeluaran.

create table budget_categories (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    type text check (type in ('income','expense')),
    created_at timestamp default now()
);

Contoh data:

name	type
Gaji	income
Freelance	income
Makanan	expense
Transport	expense
4. Tabel Transactions

Tabel utama untuk semua transaksi.

create table budget_transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    account_id uuid references accounts(id),
    category_id uuid references budget_categories(id),
    type text check (type in ('income','expense')),
    amount numeric not null,
    description text,
    transaction_date date not null default current_date,
    created_at timestamp default now()
);

Contoh isi:

type	amount	category	date
expense	20000	Makanan	2026-03-15
income	5000000	Gaji	2026-03-01
