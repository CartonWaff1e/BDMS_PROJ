# BDMS_PROJ

Prerequisites

Node.js (v16+ recommended) and npm installed
start a mysql server on dbngin with PORT 3306 and NO PASSWORD

run all the sql files ONE BY ONE with:

# create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pesu_events CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# import schema + triggers + procedures + functions
mysql -u root -p pesu_events < sql/schema.sql
mysql -u root -p pesu_events < sql/triggers.sql
mysql -u root -p pesu_events < sql/procedures.sql
mysql -u root -p pesu_events < sql/functions.sql


run backend:

cd backend
npm install
# dev server (auto restart)
npm run dev

start frontend:

cd frontend
npm install
npm run dev

